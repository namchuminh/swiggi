const Order = require('../models/order.model');
const DetailOrder = require('../models/detail_orders.model');
const Cart = require('../models/cart.model');
const Coupon = require('../models/coupon.model');

class OrderController {
    // [GET] /orders
    async index(req, res) {
        try {
            const { page = 1, limit = 10, search = '' } = req.query;
            const query = {};

            if (req.user.role === 'admin') {
                if (search) {
                    query.code = { $regex: search, $options: 'i' };
                }
            } else {
                query.user = req.user.userId;
            }

            const orders = await Order.find(query)
                .populate({
                    path: 'coupon', // Tham chiếu chính xác tới 'coupons'
                    select: 'value',  // Lấy giá trị 'value'
                    options: { lean: true }  // Trả về plain JavaScript objects
                })
                .populate('user')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ created_at: -1 });

            const totalOrders = await Order.countDocuments(query);

            // Thêm giá trị mặc định nếu không có coupon
            const formattedOrders = orders.map(order => ({
                ...order.toObject(),
                coupon_id: order.coupon_id ? order.coupon_id.value : 'Không sử dụng'
            }));

            return res.json({
                orders: formattedOrders,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders
            });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng', error });
        }
    }

    // [POST] /orders/
    async create(req, res) {
        try {
            const { address, phone, coupon } = req.body;

            // Lấy giỏ hàng của người dùng
            const carts = await Cart.find({ user: req.user.userId }).populate('food').populate('toppings');

            if (!carts.length) {
                return res.status(404).json({ message: 'Giỏ hàng hiện đang trống' });
            }

            // Tính tổng tiền từ giỏ hàng
            let totalAmount = carts.reduce((total, cartItem) => {
                const foodPrice = cartItem.food.price;
                const toppingsPrice = cartItem.toppings.reduce((toppingTotal, topping) => toppingTotal + topping.price, 0);
                return total + (foodPrice + toppingsPrice) * cartItem.quantity;
            }, 0);

            let couponCheck = null;
            // Kiểm tra mã giảm giá dựa trên code
            if (coupon) {
                couponCheck = await Coupon.findOne({ code: coupon });

                if (!couponCheck) {
                    return res.status(400).json({ message: 'Mã giảm giá không hợp lệ' });
                }

                // Kiểm tra hạn sử dụng của mã
                if (new Date(couponCheck.expiry_date) < new Date()) {
                    return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' });
                }

                // Trừ giá trị mã giảm giá theo % vào tổng tiền
                const discountAmount = totalAmount * (couponCheck.value / 100);
                totalAmount -= discountAmount;

                if (totalAmount < 0) {
                    totalAmount = 0;
                }
            }

            // Tạo đơn hàng mới
            const order = new Order({
                user: req.user.userId,
                code: `ORD${Date.now()}`,  // Tạo mã đơn hàng
                address,
                phone,
                amount: totalAmount,
                coupon: couponCheck ? couponCheck.userId : null,  // Lưu coupon nếu có
                status: 'Pending'  // Trạng thái đơn hàng
            });

            // Lưu đơn hàng
            await order.save();

            // Tạo chi tiết đơn hàng từ giỏ hàng
            const detailOrders = carts.map(cartItem => ({
                order: order._id,
                food: cartItem.food._id,
                toppings: cartItem.toppings.map(topping => topping._id),
                quantity: cartItem.quantity
            }));

            // Lưu các chi tiết đơn hàng
            await DetailOrder.insertMany(detailOrders);

            // Xóa giỏ hàng sau khi tạo đơn hàng
            await Cart.deleteMany({ user: req.user.userId });

            return res.status(201).json({ message: 'Đơn hàng đã được tạo thành công', order });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi khi tạo đơn hàng', error });
        }
    }

    // [GET] /orders/:id
    async show(req, res) {
        try {
            const { id } = req.params;

            const order = await Order.findById(id);
            
            if (!order) {
                return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
            }

            if((order.user._id != req.user.userId) && (req.user.role != "admin")){
                return res.status(400).json({ message: 'Bạn không được phép xem đơn hàng này' });
            }

            const detailOrders = await DetailOrder.find({ order: id })
                .populate('food')
                .populate('toppings');

            return res.json({ order, detailOrders });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi khi lấy chi tiết đơn hàng', error });
        }
    }

    // [PATCH] /orders/:id/cancel
    async cancel(req, res) {
        try {
            const { id } = req.params;

            // Tìm đơn hàng theo ID
            const order = await Order.findById(id);

            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            if((order.user._id != req.user.userId) && (req.user.role != "admin")){
                return res.status(400).json({ message: 'Bạn không được phép thực hiện hủy đơn hàng này' });
            }

            // Kiểm tra nếu trạng thái đơn hàng không phải là 'Completed' mới cho phép hủy
            if (order.status === 'Cancelled') {
                return res.status(400).json({ message: 'Đơn hàng đã bị hủy trước đó' });
            }

            // Kiểm tra nếu trạng thái đơn hàng không phải là 'Completed' mới cho phép hủy
            if (order.status === 'Completed') {
                return res.status(400).json({ message: 'Không thể hủy đơn hàng đã hoàn thành' });
            }

            // Cập nhật trạng thái đơn hàng thành 'Cancelled'
            order.status = 'Cancelled';
            await order.save();

            return res.status(200).json({ message: 'Đơn hàng đã được hủy thành công', order });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi khi hủy đơn hàng', error });
        }
    }

    // [PATCH] /orders/:id/status
    async status(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Kiểm tra trạng thái hợp lệ
            const validStatuses = ['Pending', 'Processing', 'Completed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
            }

            // Tìm đơn hàng theo ID
            const order = await Order.findById(id);

            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            // Kiểm tra nếu đơn hàng đã hoàn thành thì không cho phép cập nhật
            if (order.status === 'Cancelled') {
                return res.status(400).json({ message: 'Không thể cập nhật trạng thái đơn hàng đã hủy' });
            }

            // Kiểm tra nếu đơn hàng đã hoàn thành thì không cho phép cập nhật
            if (order.status === 'Completed') {
                return res.status(400).json({ message: 'Không thể cập nhật trạng thái đơn hàng đã hoàn thành' });
            }

            // Cập nhật trạng thái đơn hàng
            order.status = status;
            await order.save();

            return res.status(200).json({ message: 'Trạng thái đơn hàng đã được cập nhật thành công', order });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng', error });
        }
    }
}

module.exports = new OrderController();

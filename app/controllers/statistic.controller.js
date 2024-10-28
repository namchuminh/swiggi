const Order = require("../models/order.model.js");

class StatisticController {
    //[GET] /statistics/monthly_revenue
    async monthly_revenue(req, res) {
        try {
            const monthlyRevenue = await Order.aggregate([
                { $match: { status: "Completed" } }, // Filter for completed orders
                {
                    $group: {
                        _id: { $month: "$created_at" }, // Group by month of created_at
                        totalRevenue: { $sum: "$amount" } // Sum the amount for each month
                    }
                },
                {
                    $project: {
                        month: "$_id",
                        totalRevenue: 1,
                        _id: 0
                    }
                }
            ]);

            // Initialize an array of 12 elements, each set to 0
            const fullYearRevenue = Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                totalRevenue: 0
            }));

            // Map aggregated results to the fullYearRevenue array
            monthlyRevenue.forEach(result => {
                fullYearRevenue[result.month - 1].totalRevenue = result.totalRevenue;
            });

            res.json(fullYearRevenue);
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving monthly revenue', error });
        }
    }

    //[GET] /statistics/monthly_order_count
    async monthly_order_count(req, res) {
        try {
            const monthlyOrderCount = await Order.aggregate([
                {
                    $group: {
                        _id: { $month: "$created_at" }, // Group by month of created_at
                        orderCount: { $sum: 1 } // Count each order as 1
                    }
                },
                {
                    $project: {
                        month: "$_id",
                        orderCount: 1,
                        _id: 0
                    }
                }
            ]);

            // Initialize an array of 12 elements, each set to 0
            const fullYearOrderCount = Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                orderCount: 0
            }));

            // Map aggregated results to the fullYearOrderCount array
            monthlyOrderCount.forEach(result => {
                fullYearOrderCount[result.month - 1].orderCount = result.orderCount;
            });

            res.json(fullYearOrderCount);
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving monthly order count', error });
        }
    }

    //[GET] /statistics/current_revenue
    async current_revenue(req, res) {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const [dailyRevenue, weeklyRevenue, monthlyRevenue] = await Promise.all([
                Order.aggregate([
                    { $match: { status: "Completed", created_at: { $gte: startOfDay } } },
                    { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
                    { $project: { _id: 0, totalRevenue: { $ifNull: ["$totalRevenue", 0] } } }
                ]),
                Order.aggregate([
                    { $match: { status: "Completed", created_at: { $gte: startOfWeek } } },
                    { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
                    { $project: { _id: 0, totalRevenue: { $ifNull: ["$totalRevenue", 0] } } }
                ]),
                Order.aggregate([
                    { $match: { status: "Completed", created_at: { $gte: startOfMonth } } },
                    { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
                    { $project: { _id: 0, totalRevenue: { $ifNull: ["$totalRevenue", 0] } } }
                ])
            ]);

            res.json({
                dailyRevenue: dailyRevenue[0]?.totalRevenue || 0,
                weeklyRevenue: weeklyRevenue[0]?.totalRevenue || 0,
                monthlyRevenue: monthlyRevenue[0]?.totalRevenue || 0
            });
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving current revenue', error });
        }
    }

    //[GET] /statistics/current_order_count
    async current_order_count(req, res) {
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const [dailyOrders, weeklyOrders, monthlyOrders] = await Promise.all([
                Order.aggregate([
                    { $match: { created_at: { $gte: startOfDay } } },
                    { $count: "orderCount" }
                ]),
                Order.aggregate([
                    { $match: { created_at: { $gte: startOfWeek } } },
                    { $count: "orderCount" }
                ]),
                Order.aggregate([
                    { $match: { created_at: { $gte: startOfMonth } } },
                    { $count: "orderCount" }
                ])
            ]);

            res.json({
                dailyOrders: dailyOrders[0]?.orderCount || 0,
                weeklyOrders: weeklyOrders[0]?.orderCount || 0,
                monthlyOrders: monthlyOrders[0]?.orderCount || 0
            });
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving current order count', error });
        }
    }
}

module.exports = new StatisticController();

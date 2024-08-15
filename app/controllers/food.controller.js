const Food = require("../models/food.model.js");
const path = require('path');
const fs = require('fs');

class FoodController {
  // [GET] /foods
  async index(req, res) {
    try {
      const { page = 1, limit = 10, name = '' } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      // Validate page và limit phải là số nguyên dương
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({ message: 'Trang phải là số nguyên dương' });
      }
      if (isNaN(limitNum) || limitNum < 1) {
        return res.status(400).json({ message: 'Giới hạn phải là số nguyên dương' });
      }

      // Tìm kiếm các món ăn theo tên (nếu có)
      const queryCondition = name ? { name: new RegExp(name, 'i') } : {};

      const foods = await Food.find(queryCondition)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .populate('category')
        .exec();

      const count = await Food.countDocuments(queryCondition);
      const totalPages = Math.ceil(count / limitNum);

      return res.json({
        foods,
        totalPages,
        currentPage: pageNum,
        next: pageNum < totalPages ? `/foods?page=${pageNum + 1}&limit=${limitNum}&name=${name}` : null,
        prev: pageNum > 1 ? `/foods?page=${pageNum - 1}&limit=${limitNum}&name=${name}` : null
      });
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi khi truy xuất danh sách món ăn', error });
    }
  }

  // [GET] /foods/:id
  async show(req, res) {
    try {
      const food = await Food.findById(req.params.id).populate('category');
      if (!food) {
        return res.status(404).json({ message: 'Không tìm thấy món ăn' });
      }
      return res.json(food);
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi khi truy xuất món ăn', error });
    }
  }

  // [POST] /foods
  async create(req, res) {
    try {
      const { name, price, slug, category } = req.body;

      // Validate bắt buộc các trường name, price, slug, category_id
      if (!name || !price || !slug || !category) {
        return res.status(400).json({ message: 'Tên, giá, slug và danh mục là bắt buộc.' });
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // Slug pattern: lowercase letters, numbers, and hyphens
      if (!slugRegex.test(slug)) {
        return res.status(400).json({ message: 'Slug không hợp lệ. Vui lòng sử dụng chỉ chữ thường, số và dấu gạch nối.' });
      }

      // Validate file upload
      if (req.files && req.files.length > 0) {
        const imageFile = req.files[0];

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(imageFile.mimetype)) {
          fs.unlinkSync(path.join('uploads', imageFile.filename)); // Xóa tệp không hợp lệ
          return res.status(400).json({ message: 'Tệp tải lên không hợp lệ. Vui lòng chọn tệp hình ảnh.' });
        }

        // Validate file size (limit to 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (imageFile.size > maxSize) {
          fs.unlinkSync(path.join('uploads', imageFile.filename)); // Xóa tệp lớn quá giới hạn
          return res.status(400).json({ message: 'Tệp hình ảnh quá lớn. Vui lòng chọn tệp nhỏ hơn 5MB.' });
        }

        // Construct the full URL for the image
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${imageFile.filename}`;
        req.body.image = imageUrl;
      }else{
        return res.status(400).json({ message: 'Vui lòng chọn ảnh món ăn' });
      }

      const food = new Food(req.body);
      await food.save();

      return res.status(201).json({ message: 'Tạo món ăn thành công', food });
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi khi tạo món ăn', error });
    }
  }

  // [PUT] /foods/:id
  async update(req, res) {
    try {
      const { name, price, slug, category } = req.body;

      // Validate bắt buộc các trường name, price, slug, category
      if (!name || !price || !slug || !category) {
        return res.status(400).json({ message: 'Tên, giá, slug và danh mục là bắt buộc.' });
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        return res.status(400).json({ message: 'Slug không hợp lệ. Vui lòng sử dụng chỉ chữ thường, số và dấu gạch nối.' });
      }

      // Validate và xử lý file upload
      if (req.files && req.files.length > 0) {
        const imageFile = req.files[0];

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(imageFile.mimetype)) {
          fs.unlinkSync(path.join('uploads', imageFile.filename));
          return res.status(400).json({ message: 'Tệp tải lên không hợp lệ. Vui lòng chọn tệp hình ảnh.' });
        }

        const maxSize = 5 * 1024 * 1024;
        if (imageFile.size > maxSize) {
          fs.unlinkSync(path.join('uploads', imageFile.filename));
          return res.status(400).json({ message: 'Tệp hình ảnh quá lớn. Vui lòng chọn tệp nhỏ hơn 5MB.' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${imageFile.filename}`;
        req.body.image = imageUrl;
      }

      const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!food) {
        return res.status(404).json({ message: 'Không tìm thấy món ăn' });
      }

      return res.json({ message: 'Cập nhật món ăn thành công', food });
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi khi cập nhật món ăn', error });
    }
  }

  // [DELETE] /foods/:id
  async delete(req, res) {
    try {
      const food = await Food.findByIdAndDelete(req.params.id);
      if (!food) {
        return res.status(404).json({ message: 'Không tìm thấy món ăn' });
      }
      return res.json({ message: 'Xóa món ăn thành công' });
    } catch (error) {
      return res.status(500).json({ message: 'Lỗi khi xóa món ăn', error });
    }
  }
}

module.exports = new FoodController();

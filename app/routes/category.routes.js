const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller.js');
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware.js')

router.delete('/:id', authenticateToken, requireAdmin, categoryController.delete);
router.put('/:id', authenticateToken, requireAdmin, categoryController.update);
router.get('/:id', categoryController.show);
router.post('/', authenticateToken, requireAdmin, categoryController.create);
router.get('/', categoryController.index);


module.exports = router;
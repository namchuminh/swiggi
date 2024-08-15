const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller.js');

router.delete('/:id', categoryController.delete);
router.put('/:id', categoryController.update);
router.get('/:id', categoryController.show);
router.post('/', categoryController.create);
router.get('/', categoryController.index);


module.exports = router;
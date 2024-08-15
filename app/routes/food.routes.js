const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller.js');

router.delete('/:id', foodController.delete);
router.put('/:id', foodController.update);
router.get('/:id', foodController.show);
router.post('/', foodController.create);
router.get('/', foodController.index);


module.exports = router;
const express = require('express');
const router = express.Router();
const foodToppingController = require('../controllers/foodTopping.controller.js');

router.delete('/:id', foodToppingController.delete);
router.get('/:id', foodToppingController.show);
router.post('/', foodToppingController.create);


module.exports = router;
const express = require('express');
const router = express.Router();
const toppingController = require('../controllers/topping.controller.js');

router.delete('/:id', toppingController.delete);
router.put('/:id', toppingController.update);
router.get('/:id', toppingController.show);
router.post('/', toppingController.create);
router.get('/', toppingController.index);


module.exports = router;
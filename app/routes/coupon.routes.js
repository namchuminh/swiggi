const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller.js');

router.delete('/:id', couponController.delete);
router.put('/:id', couponController.update);
router.get('/:id', couponController.show);
router.post('/', couponController.create);
router.get('/', couponController.index);


module.exports = router;
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller.js');

router.patch('/:id/block', userController.block);
router.put('/', userController.update);
router.get('/profile', userController.profile);
router.get('/:id', userController.show);
router.get('/', userController.index);


module.exports = router;
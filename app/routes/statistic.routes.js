const express = require('express');
const router = express.Router();
const statisticController = require('../controllers/statistic.controller.js');
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware.js')


router.get('/monthly_revenue', authenticateToken, requireAdmin, statisticController.monthly_revenue);
router.get('/monthly_order_count', authenticateToken, requireAdmin, statisticController.monthly_order_count);
router.get('/current_revenue', authenticateToken, requireAdmin, statisticController.current_revenue);
router.get('/current_order_count', authenticateToken, requireAdmin, statisticController.current_order_count);


module.exports = router;
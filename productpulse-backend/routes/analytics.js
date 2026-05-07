const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

router.get('/forecast',        protect, ctrl.getForecastData);
router.get('/gender-sales',    protect, ctrl.getGenderSales);
router.get('/regional-growth', protect, ctrl.getRegionalGrowth);
router.get('/heatmap',         protect, ctrl.getHeatmap);
router.get('/ai-insights',     protect, ctrl.getAIInsights);

module.exports = router;

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

router.get('/kpis',                 protect, ctrl.getKPIs);
router.get('/profit-trend',         protect, ctrl.getProfitTrend);
router.get('/category-demand',      protect, ctrl.getCategoryDemand);
router.get('/regional-distribution',protect, ctrl.getRegionalDistribution);
router.get('/recent-activity',      protect, ctrl.getRecentActivity);
router.get('/top-alerts',           protect, ctrl.getTopAlerts);

module.exports = router;

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/reportsController');

router.get ('/summary',          protect, ctrl.getReportSummary);
router.get ('/profit-trend',     protect, ctrl.getProfitTrend);
router.get ('/category-demand',  protect, ctrl.getCategoryDemand);
router.get ('/alert-trend',      protect, ctrl.getAlertTrend);
router.get ('/recent',           protect, ctrl.getRecentReports);
router.post('/generate',         protect, ctrl.generateReport);
router.get ('/:id/download',     protect, ctrl.downloadReport);

module.exports = router;

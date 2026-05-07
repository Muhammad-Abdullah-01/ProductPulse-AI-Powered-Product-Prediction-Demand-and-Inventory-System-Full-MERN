const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/alertsController');

router.get   ('/',             protect, ctrl.getAlerts);
router.get   ('/summary',      protect, ctrl.getAlertsSummary);
router.post  ('/:id/reorder',  protect, ctrl.placeReorder);
router.patch ('/:id/dismiss',  protect, ctrl.dismissAlert);
router.delete('/:id',          protect, ctrl.deleteAlert);

module.exports = router;

const Alert = require('../models/Alert');

// GET /api/alerts?category=All&severity=All&region=All
exports.getAlerts = async (req, res, next) => {
  try {
    const { category, severity, region, active } = req.query;

    const query = { createdBy: req.user._id };
    if (category && category !== 'All') query.category = category;
    if (severity && severity !== 'All') query.severity = severity.toLowerCase();
    if (region   && region   !== 'All') query.region   = region;
    if (active   !== undefined) query.isActive = active === 'true';

    const alerts = await Alert.find(query).sort({ severity: 1, createdAt: -1 });

    // Counts summary
    const counts = {
      critical: await Alert.countDocuments({ createdBy: req.user._id, severity: 'critical', isActive: true }),
      warning:  await Alert.countDocuments({ createdBy: req.user._id, severity: 'warning',  isActive: true }),
      stable:   await Alert.countDocuments({ createdBy: req.user._id, severity: 'stable',   isActive: true }),
    };

    res.json({ success: true, count: alerts.length, counts, alerts });
  } catch (err) {
    next(err);
  }
};

// POST /api/alerts/:id/reorder  — place a reorder for a critical/warning alert
exports.placeReorder = async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    if (alert.severity === 'stable') {
      return res.status(400).json({ success: false, message: 'No reorder needed for stable stock.' });
    }

    alert.reorderPlaced = true;
    alert.reorderAt     = new Date();
    alert.action        = 'View Insights';
    await alert.save();

    res.json({
      success: true,
      message: `Reorder placed for ${alert.product}. Your supplier has been notified.`,
      alert,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/alerts/:id/dismiss
exports.dismissAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });

    res.json({ success: true, message: 'Alert dismissed.', alert });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/alerts/:id
exports.deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });

    res.json({ success: true, message: 'Alert deleted.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/alerts/summary  — quick counts for header badge
exports.getAlertsSummary = async (req, res, next) => {
  try {
    const critical = await Alert.countDocuments({ createdBy: req.user._id, severity: 'critical', isActive: true });
    const warning  = await Alert.countDocuments({ createdBy: req.user._id, severity: 'warning',  isActive: true });
    res.json({ success: true, total: critical + warning, critical, warning });
  } catch (err) {
    next(err);
  }
};

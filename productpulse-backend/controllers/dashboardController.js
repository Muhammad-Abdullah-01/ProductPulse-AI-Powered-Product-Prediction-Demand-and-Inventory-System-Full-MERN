const SalesRecord = require('../models/SalesRecord');
const Alert       = require('../models/Alert');
const Upload      = require('../models/Upload');
const { profitTrend, overstockRisk } = require('../services/predictionService');

// GET /api/dashboard/kpis
exports.getKPIs = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const records = await SalesRecord.find({ uploadedBy: userId });

    if (records.length === 0) {
      return res.json({ success: true, kpis: {
        topCategoryCount: 0, forecastedDemand: 0, overstockRisk: 0,
        outOfStockAlerts: 0, totalProfit: 0,
        topCategoryChange: '0', forecastChange: '0%', overstockChange: '0%',
        alertChange: '0', profitChange: '0%',
      }});
    }

    const categorySet = new Set(records.map(r => r.category));
    const withForecast = records.filter(r => r.forecastedDemand != null);
    const forecastedDemand = withForecast.reduce((s, r) => s + r.forecastedDemand, 0);
    const productsWithBoth = records.filter(r => r.stock != null && r.forecastedDemand != null);
    const overstockCount = productsWithBoth.filter(r => r.stock > r.forecastedDemand * 3).length;
    const overstockPct = productsWithBoth.length ? +((overstockCount / productsWithBoth.length) * 100).toFixed(1) : 0;
    const activeAlerts = await Alert.countDocuments({ createdBy: userId, severity: { $in: ['critical', 'warning'] }, isActive: true });
    const totalProfit = records.reduce((s, r) => s + (r.profit ?? Math.round(r.sales * (r.price || 10) * 0.35)), 0);

    // Compute change values by comparing first half vs second half
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    const mid = Math.max(Math.floor(sorted.length / 2), 1);
    const first = sorted.slice(0, mid), second = sorted.slice(mid);

    const firstCats = new Set(first.map(r => r.category)).size;
    const secondCats = new Set(second.map(r => r.category)).size;
    const catDiff = secondCats - firstCats;

    const ff = first.filter(r => r.forecastedDemand != null).reduce((s, r) => s + r.forecastedDemand, 0);
    const sf = second.filter(r => r.forecastedDemand != null).reduce((s, r) => s + r.forecastedDemand, 0);
    const forecastPct = ff > 0 ? (((sf - ff) / ff) * 100).toFixed(1) : (sf > 0 ? '100' : '0');

    const fp = first.reduce((s, r) => s + (r.profit ?? Math.round(r.sales * (r.price || 10) * 0.35)), 0);
    const sp = second.reduce((s, r) => s + (r.profit ?? Math.round(r.sales * (r.price || 10) * 0.35)), 0);
    const profitPct = fp > 0 ? (((sp - fp) / fp) * 100).toFixed(1) : (sp > 0 ? '100' : '0');

    res.json({ success: true, kpis: {
      topCategoryCount: categorySet.size,
      forecastedDemand: Math.round(forecastedDemand),
      overstockRisk: overstockPct,
      outOfStockAlerts: activeAlerts,
      totalProfit: Math.round(totalProfit),
      topCategoryChange: `${catDiff >= 0 ? '+' : ''}${catDiff}`,
      forecastChange: `${parseFloat(forecastPct) >= 0 ? '+' : ''}${forecastPct}%`,
      overstockChange: overstockPct > 0 ? `-${(overstockPct * 0.3).toFixed(1)}%` : '0%',
      alertChange: activeAlerts > 0 ? `+${activeAlerts}` : '0',
      profitChange: `${parseFloat(profitPct) >= 0 ? '+' : ''}${profitPct}%`,
    }});
  } catch (err) { next(err); }
};

// GET /api/dashboard/profit-trend
exports.getProfitTrend = async (req, res, next) => {
  try {
    const records = await SalesRecord.find({ uploadedBy: req.user._id }).sort({ date: 1 });
    if (records.length === 0) return res.json({ success: true, trend: [] });
    const trend = profitTrend(records, 8);
    const enriched = trend.map((t, i) => ({ ...t, forecast: Math.round(t.profit * (1 + 0.04 * (i - trend.length + 2))) }));
    res.json({ success: true, trend: enriched });
  } catch (err) { next(err); }
};

// GET /api/dashboard/category-demand
exports.getCategoryDemand = async (req, res, next) => {
  try {
    const records = await SalesRecord.find({ uploadedBy: req.user._id });
    if (records.length === 0) return res.json({ success: true, demand: [] });
    const map = {};
    for (const r of records) map[r.category] = (map[r.category] || 0) + r.sales;
    const demand = Object.entries(map).map(([name, demand]) => ({ name, demand })).sort((a, b) => b.demand - a.demand);
    res.json({ success: true, demand });
  } catch (err) { next(err); }
};

// GET /api/dashboard/regional-distribution
exports.getRegionalDistribution = async (req, res, next) => {
  try {
    const records = await SalesRecord.find({ uploadedBy: req.user._id });
    if (records.length === 0) return res.json({ success: true, data: [] });
    const map = {};
    const total = records.reduce((s, r) => s + r.sales, 0);
    for (const r of records) map[r.region] = (map[r.region] || 0) + r.sales;
    const data = Object.entries(map).map(([name, sales]) => ({ name, value: total > 0 ? Math.round((sales / total) * 100) : 0 }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/dashboard/recent-activity
exports.getRecentActivity = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const uploads = await Upload.find({ uploadedBy: userId }).sort({ createdAt: -1 }).limit(6)
      .select('originalName status createdAt predictionSummary');

    const alerts = await Alert.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5)
      .select('product severity createdAt reorderPlaced reorderAt');

    const activity = [
      ...uploads.map(u => ({
        type: u.status === 'completed' ? 'Upload' : 'Processing',
        file: u.originalName,
        status: u.status === 'completed' ? 'Completed' : u.status === 'processing' ? 'Running' : u.status === 'failed' ? 'Failed' : 'Pending',
        statusType: u.status === 'completed' ? 'success' : u.status === 'processing' ? 'info' : 'danger',
        time: u.createdAt,
      })),
      // Show alerts
      ...alerts.filter(a => !a.reorderPlaced).map(a => ({
        type: 'Alert',
        alert: `Stock ${a.severity === 'critical' ? 'Critical' : 'Warning'}: ${a.product}`,
        status: 'Active',
        statusType: a.severity === 'critical' ? 'danger' : 'warning',
        time: a.createdAt,
      })),
      // Show reorder actions
      ...alerts.filter(a => a.reorderPlaced).map(a => ({
        type: 'Reorder',
        alert: `Reorder placed: ${a.product}`,
        status: 'Completed',
        statusType: 'success',
        time: a.reorderAt || a.createdAt,
      })),
    ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8)
    .map(item => ({ ...item, time: formatRelativeTime(item.time) }));

    res.json({ success: true, activity });
  } catch (err) { next(err); }
};

// GET /api/dashboard/top-alerts
exports.getTopAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.find({ createdBy: req.user._id, isActive: true })
      .sort({ severity: 1, createdAt: -1 }).limit(5)
      .select('product category severity stock required');
    res.json({ success: true, alerts });
  } catch (err) { next(err); }
};

function formatRelativeTime(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2) return 'Yesterday';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

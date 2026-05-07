const Report      = require('../models/Report');
const SalesRecord = require('../models/SalesRecord');
const Alert       = require('../models/Alert');
const XLSX        = require('xlsx');
const path        = require('path');
const fs          = require('fs');
const { profitTrend } = require('../services/predictionService');

// GET /api/reports/summary?range=All+Time
exports.getReportSummary = async (req, res, next) => {
  try {
    const { range = 'All Time' } = req.query;
    const dateFilter = buildDateFilter(range);
    const records = await SalesRecord.find({ uploadedBy: req.user._id, ...dateFilter });

    if (records.length === 0) {
      return res.json({ success: true, summary: {
        totalProfit: 0, topCategory: '—', topCategoryUnits: 0, growthRegion: '—',
        riskPercent: 0, profitChange: 0, topRegGrowth: 0, riskChange: 0, totalSales: 0, totalRecords: 0,
      }});
    }

    const totalProfit = records.reduce((s, r) => s + (r.profit ?? Math.round(r.sales * (r.price || 10) * 0.35)), 0);
    const totalSales = records.reduce((s, r) => s + r.sales, 0);

    const catMap = {};
    for (const r of records) catMap[r.category] = (catMap[r.category] || 0) + r.sales;
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    const regMap = {};
    for (const r of records) regMap[r.region] = (regMap[r.region] || 0) + r.sales;
    const topReg = Object.entries(regMap).sort((a, b) => b[1] - a[1])[0];

    const withData = records.filter(r => r.stock != null && r.forecastedDemand != null);
    const overstock = withData.filter(r => r.stock > r.forecastedDemand * 3);
    const riskPct = withData.length ? +((overstock.length / withData.length) * 100).toFixed(1) : 0;

    // Compute changes
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    const mid = Math.floor(sorted.length / 2);
    const fp = sorted.slice(0, Math.max(mid, 1)).reduce((s, r) => s + (r.profit ?? Math.round(r.sales * (r.price || 10) * 0.35)), 0);
    const sp = sorted.slice(Math.max(mid, 1)).reduce((s, r) => s + (r.profit ?? Math.round(r.sales * (r.price || 10) * 0.35)), 0);
    const profitChange = fp > 0 ? +(((sp - fp) / fp) * 100).toFixed(1) : 0;

    const regionValues = Object.values(regMap);
    const avgRegion = regionValues.reduce((s, v) => s + v, 0) / regionValues.length;
    const topRegGrowth = topReg && avgRegion > 0 ? +(((topReg[1] - avgRegion) / avgRegion) * 100).toFixed(1) : 0;

    res.json({ success: true, summary: {
      totalProfit: Math.round(totalProfit), topCategory: topCat?.[0] || '—',
      topCategoryUnits: topCat?.[1] || 0, growthRegion: topReg?.[0] || '—',
      riskPercent: riskPct, profitChange, topRegGrowth,
      riskChange: riskPct > 0 ? -(riskPct * 0.3).toFixed(1) : 0,
      totalSales, totalRecords: records.length,
    }});
  } catch (err) { next(err); }
};

// GET /api/reports/profit-trend?range=All+Time
exports.getProfitTrend = async (req, res, next) => {
  try {
    const { range = 'All Time' } = req.query;
    const dateFilter = buildDateFilter(range);
    const records = await SalesRecord.find({ uploadedBy: req.user._id, ...dateFilter }).sort({ date: 1 });
    const trend = profitTrend(records, 8);
    res.json({ success: true, trend });
  } catch (err) { next(err); }
};

// GET /api/reports/category-demand?range=All+Time
exports.getCategoryDemand = async (req, res, next) => {
  try {
    const { range = 'All Time' } = req.query;
    const dateFilter = buildDateFilter(range);
    const records = await SalesRecord.find({ uploadedBy: req.user._id, ...dateFilter });

    const catMap = {};
    for (const r of records) catMap[r.category] = (catMap[r.category] || 0) + r.sales;
    const demand = Object.entries(catMap).map(([name, demand]) => ({ name, demand })).sort((a, b) => b.demand - a.demand);
    res.json({ success: true, demand });
  } catch (err) { next(err); }
};

// GET /api/reports/alert-trend
exports.getAlertTrend = async (req, res, next) => {
  try {
    const alerts = await Alert.find({ createdBy: req.user._id }).sort({ createdAt: 1 });
    if (alerts.length === 0) return res.json({ success: true, trend: [] });

    const monthMap = {};
    for (const a of alerts) {
      const key = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthMap[key]) monthMap[key] = { total: 0, critical: 0, warning: 0 };
      monthMap[key].total++;
      if (a.severity === 'critical') monthMap[key].critical++;
      if (a.severity === 'warning') monthMap[key].warning++;
    }

    const trend = Object.entries(monthMap).map(([month, v]) => ({ month, ...v }));
    res.json({ success: true, trend });
  } catch (err) { next(err); }
};

// POST /api/reports/generate — create actual downloadable report
exports.generateReport = async (req, res, next) => {
  try {
    const { reportType = 'Monthly', format = 'pdf', dateRangeLabel = 'All Time' } = req.body;
    const dateFilter = buildDateFilter(dateRangeLabel);
    const records = await SalesRecord.find({ uploadedBy: req.user._id, ...dateFilter });

    const totalProfit = records.reduce((s, r) => s + (r.profit ?? Math.round(r.sales * (r.price || 10) * 0.35)), 0);
    const catMap = {}, regMap = {};
    for (const r of records) {
      catMap[r.category] = (catMap[r.category] || 0) + r.sales;
      regMap[r.region] = (regMap[r.region] || 0) + r.sales;
    }
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    const topReg = Object.entries(regMap).sort((a, b) => b[1] - a[1])[0];

    // Generate actual Excel file
    const reportRows = records.map(r => ({
      'Product ID': r.productId, 'Product Name': r.productName,
      'Category': r.category, 'Region': r.region, 'Gender': r.gender || '—',
      'Sales': r.sales, 'Month': r.month, 'Stock': r.stock ?? '—',
      'Price': r.price ?? '—', 'Cost': r.cost ?? '—', 'Profit': r.profit ?? '—',
      'Forecasted Demand': r.forecastedDemand ?? '—', 'Stock Risk': r.stockRisk ?? '—',
    }));

    // Summary sheet
    const summaryRows = [
      { Metric: 'Report Type', Value: reportType },
      { Metric: 'Date Range', Value: dateRangeLabel },
      { Metric: 'Total Records', Value: records.length },
      { Metric: 'Total Sales (units)', Value: records.reduce((s, r) => s + r.sales, 0) },
      { Metric: 'Total Profit', Value: Math.round(totalProfit) },
      { Metric: 'Top Category', Value: topCat?.[0] || '—' },
      { Metric: 'Top Region', Value: topReg?.[0] || '—' },
      { Metric: 'Categories', Value: Object.keys(catMap).join(', ') },
      { Metric: 'Regions', Value: Object.keys(regMap).join(', ') },
    ];

    // Category breakdown
    const catRows = Object.entries(catMap).map(([name, sales]) => ({
      Category: name, 'Total Sales': sales, 'Market Share %': records.length ? ((sales / records.reduce((s, r) => s + r.sales, 0)) * 100).toFixed(1) : 0,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportRows), 'Sales Data');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catRows), 'Category Breakdown');

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'reports');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `${reportType}_Report_${Date.now()}.xlsx`;
    const filePath = path.join(uploadsDir, fileName);
    XLSX.writeFile(wb, filePath);

    const fileSize = fs.statSync(filePath).size;

    const report = await Report.create({
      generatedBy: req.user._id,
      name: `${reportType} Report — ${dateRangeLabel}`,
      reportType, format: 'excel',
      dateRange: { from: dateFilter.date?.$gte || new Date(2020, 0, 1), to: dateFilter.date?.$lte || new Date(), label: dateRangeLabel },
      summary: { totalProfit: Math.round(totalProfit), topCategory: topCat?.[0] || '—', growthRegion: topReg?.[0] || '—', riskPercent: 0 },
      filePath, fileSize, status: 'ready', readyAt: new Date(),
    });

    res.status(201).json({ success: true, message: `Report generated successfully.`, report });
  } catch (err) { next(err); }
};

// GET /api/reports/:id/download — download the actual report file
exports.downloadReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, generatedBy: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (!report.filePath || !fs.existsSync(report.filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found on disk.' });
    }
    res.download(report.filePath, `${report.name}.xlsx`);
  } catch (err) { next(err); }
};

// GET /api/reports/recent
exports.getRecentReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ generatedBy: req.user._id })
      .sort({ createdAt: -1 }).limit(10)
      .select('name format status fileSize readyAt createdAt dateRange');
    res.json({ success: true, reports });
  } catch (err) { next(err); }
};

function buildDateFilter(label = 'All Time') {
  const now = new Date(), year = now.getFullYear(), month = now.getMonth();
  switch (label) {
    case 'This Month': return { date: { $gte: new Date(year, month, 1), $lte: new Date(year, month + 1, 0) } };
    case 'Last 3 Months': return { date: { $gte: new Date(year, month - 3, 1) } };
    case 'YTD': return { date: { $gte: new Date(year, 0, 1) } };
    case 'All Time': default: return {};
  }
}

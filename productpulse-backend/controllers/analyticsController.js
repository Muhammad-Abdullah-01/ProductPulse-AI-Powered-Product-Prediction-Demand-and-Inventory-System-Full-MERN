const SalesRecord = require('../models/SalesRecord');
const Alert       = require('../models/Alert');
const { linearForecast, holtLinearForecast, computeSeasonalIndices } = require('../services/predictionService');

// GET /api/analytics/forecast?category=All&region=All
exports.getForecastData = async (req, res, next) => {
  try {
    const { category = 'All', region = 'All' } = req.query;
    let query = { uploadedBy: req.user._id };
    if (category !== 'All') query.category = category;
    if (region   !== 'All') query.region   = region;

    const records = await SalesRecord.find(query).sort({ date: 1 });
    if (records.length === 0) return res.json({ success: true, data: [] });

    // Group by month preserving order
    const monthOrder = [];
    const monthMap = {};
    for (const r of records) {
      if (!monthMap[r.month]) { monthMap[r.month] = 0; monthOrder.push(r.month); }
      monthMap[r.month] += r.sales;
    }

    const monthlyValues = monthOrder.map(m => monthMap[m]);
    const { forecast: lf } = linearForecast(monthlyValues, 3);
    const hf = holtLinearForecast(monthlyValues, 0.4, 0.2, 3);

    // Actual months
    const data = monthOrder.map((month, i) => ({
      month,
      actual:    monthlyValues[i],
      predicted: Math.round((lf[Math.min(i, lf.length - 1)] + hf[Math.min(i, hf.length - 1)]) / 2),
    }));

    // 3 future predicted months
    const lastRecord = records[records.length - 1];
    if (lastRecord && lastRecord.date) {
      for (let i = 0; i < 3; i++) {
        const futureDate = new Date(lastRecord.date);
        futureDate.setMonth(futureDate.getMonth() + i + 1);
        const label = futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        data.push({
          month: label,
          actual: null,
          predicted: Math.max(0, Math.round((lf[i] + hf[i]) / 2)),
        });
      }
    }

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/analytics/gender-sales
exports.getGenderSales = async (req, res, next) => {
  try {
    const records = await SalesRecord.find({ uploadedBy: req.user._id });
    if (records.length === 0) return res.json({ success: true, data: [] });

    // Check if real gender data exists in the records
    const hasGenderData = records.some(r => r.gender != null);

    if (hasGenderData) {
      // Use REAL gender data from uploaded file
      const catGender = {};
      for (const r of records) {
        if (!catGender[r.category]) catGender[r.category] = { male: 0, female: 0, other: 0 };
        if (r.gender === 'Male') catGender[r.category].male += r.sales;
        else if (r.gender === 'Female') catGender[r.category].female += r.sales;
        else if (r.gender === 'Other') catGender[r.category].other += r.sales;
        else {
          // No gender on this row — split 50/50
          catGender[r.category].male += Math.round(r.sales * 0.5);
          catGender[r.category].female += Math.round(r.sales * 0.5);
        }
      }
      const data = Object.entries(catGender).map(([category, vals]) => ({
        category, male: vals.male, female: vals.female,
      }));
      return res.json({ success: true, data, source: 'uploaded' });
    }

    // Fallback: estimate from industry averages
    const catMap = {};
    for (const r of records) catMap[r.category] = (catMap[r.category] || 0) + r.sales;

    const genderRatios = {
      Electronics:    { male: 0.67, female: 0.33 },
      Fashion:        { male: 0.24, female: 0.76 },
      Groceries:      { male: 0.43, female: 0.57 },
      Sports:         { male: 0.74, female: 0.26 },
      Beauty:         { male: 0.11, female: 0.89 },
      'Home & Garden':{ male: 0.45, female: 0.55 },
      Appliances:     { male: 0.52, female: 0.48 },
      Other:          { male: 0.50, female: 0.50 },
    };

    const data = Object.entries(catMap).map(([category, total]) => {
      const ratio = genderRatios[category] || { male: 0.5, female: 0.5 };
      return { category, male: Math.round(total * ratio.male), female: Math.round(total * ratio.female) };
    });

    res.json({ success: true, data, source: 'estimated' });
  } catch (err) { next(err); }
};

// GET /api/analytics/regional-growth
exports.getRegionalGrowth = async (req, res, next) => {
  try {
    const records = await SalesRecord.find({ uploadedBy: req.user._id }).sort({ date: 1 });
    if (records.length === 0) return res.json({ success: true, data: [] });

    // Group months in order, then split into 4 quarters
    const monthOrder = [];
    const monthSet = new Set();
    for (const r of records) {
      if (!monthSet.has(r.month)) { monthSet.add(r.month); monthOrder.push(r.month); }
    }

    // Split months evenly into 4 quarters
    const qSize = Math.max(Math.ceil(monthOrder.length / 4), 1);
    const quarterLabels = {};
    monthOrder.forEach((m, i) => {
      const q = Math.min(Math.floor(i / qSize), 3);
      quarterLabels[m] = `Q${q + 1}`;
    });

    const result = {};
    for (const r of records) {
      if (!result[r.region]) result[r.region] = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      const qKey = quarterLabels[r.month] || 'Q1';
      result[r.region][qKey] += r.sales;
    }

    const data = Object.entries(result).map(([region, vals]) => ({ region, ...vals }));

    // Build quarter month ranges for labels
    const quarterInfo = {};
    monthOrder.forEach((m, i) => {
      const q = Math.min(Math.floor(i / qSize), 3);
      const qKey = `Q${q + 1}`;
      if (!quarterInfo[qKey]) quarterInfo[qKey] = { first: m, last: m };
      quarterInfo[qKey].last = m;
    });

    res.json({ success: true, data, quarterInfo });
  } catch (err) { next(err); }
};

// GET /api/analytics/heatmap
exports.getHeatmap = async (req, res, next) => {
  try {
    const records = await SalesRecord.find({ uploadedBy: req.user._id });
    if (records.length === 0) return res.json({ success: true, data: [] });

    const grid = {};
    for (const r of records) {
      if (!grid[r.category]) grid[r.category] = {};
      // Use the month field directly (already formatted as "Mar 2025" → extract month part)
      const monthPart = r.month ? r.month.split(' ')[0] : new Date(r.date).toLocaleString('en-US', { month: 'short' });
      grid[r.category][monthPart] = (grid[r.category][monthPart] || 0) + r.sales;
    }

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data = Object.entries(grid).map(([category, monthData]) => ({
      category,
      values: months.filter(m => monthData[m] != null).map(m => ({ month: m, value: monthData[m] })),
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/analytics/ai-insights
exports.getAIInsights = async (req, res, next) => {
  try {
    const records = await SalesRecord.find({ uploadedBy: req.user._id }).sort({ date: -1 });
    if (records.length === 0) return res.json({ success: true, insights: [] });

    const insights = [];

    // Determine "recent" relative to DATA's own date range
    const allDates = records.map(r => new Date(r.date)).filter(d => !isNaN(d));
    const maxDataDate = new Date(Math.max(...allDates));
    const minDataDate = new Date(Math.min(...allDates));
    const dataRange = maxDataDate - minDataDate;
    const recentThreshold = Math.max(dataRange * 0.25, 86400000);
    const recentCutoff = new Date(maxDataDate - recentThreshold);

    // Insight 1: Fastest growing category
    const catTotals = {}, catRecent = {};
    for (const r of records) {
      catTotals[r.category] = (catTotals[r.category] || 0) + r.sales;
      if (new Date(r.date) >= recentCutoff) catRecent[r.category] = (catRecent[r.category] || 0) + r.sales;
    }
    const topCat = Object.entries(catRecent).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      const pct = Math.round((catRecent[topCat[0]] / (catTotals[topCat[0]] || 1)) * 100);
      insights.push({ type: 'growth', severity: 'info', text: `${topCat[0]} is your fastest-growing category — ${pct}% of total ${topCat[0]} sales came from recent periods. Consider increasing stock buffer.` });
    }

    // Insight 2: Critical stock regions
    const criticalRecords = await SalesRecord.find({ uploadedBy: req.user._id, stockRisk: 'critical' }).select('region category');
    if (criticalRecords.length > 0) {
      const regionCount = {};
      for (const r of criticalRecords) regionCount[r.region] = (regionCount[r.region] || 0) + 1;
      const [topRegion] = Object.entries(regionCount).sort((a, b) => b[1] - a[1]);
      if (topRegion) {
        insights.push({ type: 'alert', severity: 'danger', text: `Stockout risk: ${criticalRecords.length} products critical, with ${topRegion[1]} in ${topRegion[0]} region. Reorder immediately.` });
      }
    }

    // Insight 3: Forecast accuracy
    const withForecast = records.filter(r => r.forecastedDemand != null && r.sales > 0);
    if (withForecast.length > 0) {
      const gaps = withForecast.map(r => Math.abs(r.forecastedDemand - r.sales) / r.sales);
      const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
      insights.push({ type: 'model', severity: avgGap > 0.1 ? 'warning' : 'info', text: avgGap > 0.1 ? `Categories outperforming forecasts by ~${Math.round(avgGap * 100)}% — model recalibration recommended.` : `Forecast accuracy is strong — within ${Math.round(avgGap * 100)}% of actual sales.` });
    }

    // Insight 4: Seasonal pattern
    const seasonalIndices = computeSeasonalIndices(records);
    const entries = Object.entries(seasonalIndices);
    if (entries.length >= 3) {
      const sorted = [...entries].sort((a, b) => b[1] - a[1]);
      const peakMonth = sorted[0];
      const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      if (peakMonth[1] > 1.1) {
        insights.push({ type: 'growth', severity: 'info', text: `Seasonal pattern: ${monthNames[peakMonth[0]]} shows ${Math.round((peakMonth[1]-1)*100)}% above-average demand. Plan inventory accordingly.` });
      }
    }

    // Insight 5: Regional comparison
    const regionSales = {};
    for (const r of records) regionSales[r.region] = (regionSales[r.region] || 0) + r.sales;
    const regionEntries = Object.entries(regionSales).sort((a, b) => b[1] - a[1]);
    if (regionEntries.length >= 2) {
      const best = regionEntries[0], worst = regionEntries[regionEntries.length - 1];
      if (best[1] > worst[1] * 1.5) {
        insights.push({ type: 'growth', severity: 'warning', text: `${best[0]} leads with ${best[1].toLocaleString()} units — ${Math.round((best[1]/worst[1]-1)*100)}% higher than ${worst[0]}. Consider rebalancing inventory.` });
      }
    }

    res.json({ success: true, insights });
  } catch (err) { next(err); }
};

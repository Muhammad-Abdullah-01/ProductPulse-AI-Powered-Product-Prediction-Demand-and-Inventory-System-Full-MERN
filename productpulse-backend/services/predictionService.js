/**
 * ProductPulse — AI Demand Prediction Service
 * ─────────────────────────────────────────────
 * Algorithms implemented (pure JS, no Python dependency):
 *
 *  1. Linear Regression          — baseline trend line over historical sales
 *  2. Exponential Smoothing (SES)— weighted recent-data demand smoothing
 *  3. Holt's Linear Trend        — handles trend + level without seasonality
 *  4. Seasonal Decomposition     — month-of-year seasonality indices
 *  5. Safety Stock formula       — reorder point based on lead time & variability
 *  6. Risk Classification        — critical / warning / stable based on stock vs forecast
 *  7. Confidence Scoring         — based on R² of regression fit
 */

const ss = require('simple-statistics');

// ─── 1. Linear Regression ────────────────────────────────────────────────────
/**
 * Given an array of numbers (monthly sales values in chronological order),
 * returns the predicted value for the next N steps.
 *
 * @param {number[]} values  Historical sales values
 * @param {number}   steps   How many future periods to forecast
 * @returns {{ forecast: number[], r2: number, slope: number, intercept: number }}
 */
function linearForecast(values, steps = 1) {
  if (!values || values.length < 2) {
    const last = values?.[0] ?? 0;
    return { forecast: Array(steps).fill(last), r2: 0, slope: 0, intercept: last };
  }

  const n = values.length;
  const pairs = values.map((v, i) => [i, v]);

  const { m: slope, b: intercept } = ss.linearRegression(pairs);
  const r2 = ss.rSquared(pairs, x => slope * x + intercept);

  const forecast = Array.from({ length: steps }, (_, i) =>
    Math.max(0, Math.round(slope * (n + i) + intercept))
  );

  return { forecast, r2, slope, intercept };
}

// ─── 2. Simple Exponential Smoothing (SES) ───────────────────────────────────
/**
 * Smooths out noise in the series. Alpha near 1 = very reactive; near 0 = very smooth.
 *
 * @param {number[]} values
 * @param {number}   alpha   Smoothing factor 0 < α < 1  (default 0.3)
 * @param {number}   steps
 * @returns {number[]}  Forecasted values
 */
function exponentialSmoothing(values, alpha = 0.3, steps = 1) {
  if (!values || values.length === 0) return Array(steps).fill(0);

  let level = values[0];
  for (let i = 1; i < values.length; i++) {
    level = alpha * values[i] + (1 - alpha) * level;
  }
  // SES flat forecast
  return Array(steps).fill(Math.max(0, Math.round(level)));
}

// ─── 3. Holt's Linear Trend Method ───────────────────────────────────────────
/**
 * Captures both level and trend in the data.
 *
 * @param {number[]} values
 * @param {number}   alpha  Level smoothing  (0 < α < 1)
 * @param {number}   beta   Trend smoothing  (0 < β < 1)
 * @param {number}   steps
 * @returns {number[]}
 */
function holtLinearForecast(values, alpha = 0.4, beta = 0.2, steps = 1) {
  if (!values || values.length < 2) return exponentialSmoothing(values, alpha, steps);

  let level = values[0];
  let trend = values[1] - values[0];

  for (let i = 1; i < values.length; i++) {
    const prevLevel = level;
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  return Array.from({ length: steps }, (_, i) =>
    Math.max(0, Math.round(level + (i + 1) * trend))
  );
}

// ─── 4. Seasonal Indices ─────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Compute a seasonal index for each month (1–12) from historical records.
 * Returns an object { 1: 1.12, 2: 0.94, ... } where values > 1 = above average.
 *
 * @param {{ month: string, sales: number }[]} records
 * @returns {Object.<number, number>}
 */
function computeSeasonalIndices(records) {
  const totals = {};
  const counts = {};

  for (const r of records) {
    const d = new Date(r.date || Date.now());
    const m = d.getMonth() + 1;   // 1-indexed
    totals[m] = (totals[m] || 0) + r.sales;
    counts[m] = (counts[m] || 0) + 1;
  }

  const monthlyAvgs = {};
  for (const m in totals) monthlyAvgs[m] = totals[m] / counts[m];

  const overallAvg = ss.mean(Object.values(monthlyAvgs));
  if (overallAvg === 0) return {};

  const indices = {};
  for (const m in monthlyAvgs) indices[m] = monthlyAvgs[m] / overallAvg;
  return indices;
}

// ─── 5. Safety Stock & Reorder Point ─────────────────────────────────────────
/**
 * Safety stock = Z * σ_demand * √(lead_time)
 * Reorder point = avg_daily_demand * lead_time + safety_stock
 *
 * @param {number[]} dailySales   Historical daily sales values
 * @param {number}   leadTimeDays How many days to restock
 * @param {number}   serviceLevel 0.95 = 95% service level → Z = 1.645
 * @returns {{ safetyStock: number, reorderPoint: number, avgDailyDemand: number }}
 */
function computeSafetyStock(dailySales, leadTimeDays = 7, serviceLevel = 0.95) {
  if (!dailySales || dailySales.length === 0) {
    return { safetyStock: 0, reorderPoint: 0, avgDailyDemand: 0 };
  }

  // Z-scores for common service levels
  const zScores = { 0.90: 1.28, 0.95: 1.645, 0.99: 2.326 };
  const Z = zScores[serviceLevel] || 1.645;

  const avgDailyDemand = ss.mean(dailySales);
  const stdDev         = dailySales.length > 1 ? ss.standardDeviation(dailySales) : avgDailyDemand * 0.2;

  const safetyStock  = Math.ceil(Z * stdDev * Math.sqrt(leadTimeDays));
  const reorderPoint = Math.ceil(avgDailyDemand * leadTimeDays + safetyStock);

  return { safetyStock, reorderPoint, avgDailyDemand: Math.round(avgDailyDemand) };
}

// ─── 6. Risk Classification ───────────────────────────────────────────────────
/**
 * Classifies stock risk for a product.
 *
 * @param {number} currentStock
 * @param {number} forecastedDemand30d  Next 30-day demand forecast
 * @param {number} reorderPoint
 * @returns {{ severity: 'critical'|'warning'|'stable', stockStatus: string,
 *             shortageDate: string, shortageDateISO: Date|null }}
 */
function classifyRisk(currentStock, forecastedDemand30d, reorderPoint) {
  const dailyRate = forecastedDemand30d / 30;

  let daysUntilStockout = dailyRate > 0 ? Math.floor(currentStock / dailyRate) : 999;

  const shortageDateISO = daysUntilStockout < 60
    ? new Date(Date.now() + daysUntilStockout * 86400000)
    : null;

  const shortageDate = shortageDateISO
    ? shortageDateISO.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  let severity, stockStatus, action;

  if (currentStock <= reorderPoint * 0.3 || daysUntilStockout <= 7) {
    severity = 'critical'; stockStatus = 'Critical'; action = 'Reorder';
  } else if (currentStock <= reorderPoint || daysUntilStockout <= 21) {
    severity = 'warning'; stockStatus = 'Warning'; action = 'Reorder';
  } else {
    severity = 'stable'; stockStatus = 'Stable'; action = 'Monitor';
  }

  return { severity, stockStatus, shortageDate, shortageDateISO, action };
}

// ─── 7. Confidence Score ─────────────────────────────────────────────────────
/**
 * Blends R² from linear regression with data sufficiency penalty.
 * Returns a percentage 0–100.
 */
function computeConfidence(r2, dataPoints) {
  const sufficiency = Math.min(dataPoints / 12, 1);   // 12 months = full confidence
  return Math.round(r2 * sufficiency * 100);
}

// ─── Main: Forecast a single product ─────────────────────────────────────────
/**
 * Given historical sales records for ONE product, returns a full demand forecast.
 *
 * @param {Array}  records         SalesRecord documents for this product (sorted asc by date)
 * @param {number} currentStock    Current inventory on hand
 * @param {number} leadTimeDays    Supplier lead time
 * @returns {Object}               Full prediction object
 */
function forecastProduct(records, currentStock = 0, leadTimeDays = 7) {
  const values = records.map(r => r.sales);

  // Use ensemble: average of linear + holt's for robustness
  const { forecast: lf, r2, slope } = linearForecast(values, 3);
  const hf = holtLinearForecast(values, 0.4, 0.2, 3);

  const ensembled = lf.map((v, i) => Math.round((v + hf[i]) / 2));
  const forecast30d = ensembled[0];

  const seasonalIndices = computeSeasonalIndices(records);
  const nextMonthIdx    = ((new Date().getMonth() + 1) % 12) + 1;
  const seasonalFactor  = seasonalIndices[nextMonthIdx] ?? 1;
  const adjustedForecast = Math.round(forecast30d * seasonalFactor);

  // Approximate daily sales as monthly / 30
  const dailySales = values.map(v => v / 30);
  const { safetyStock, reorderPoint, avgDailyDemand } = computeSafetyStock(dailySales, leadTimeDays);

  const risk = classifyRisk(currentStock, adjustedForecast, reorderPoint);
  const confidence = computeConfidence(r2, values.length);

  return {
    forecastedDemand:   adjustedForecast,
    forecast3Months:    ensembled,
    seasonalFactor:     +seasonalFactor.toFixed(3),
    trend:              slope > 0 ? 'rising' : slope < 0 ? 'falling' : 'flat',
    trendSlope:         +slope.toFixed(2),
    safetyStock,
    reorderPoint,
    avgDailyDemand,
    confidence,
    r2:                 +r2.toFixed(4),
    ...risk,
  };
}

// ─── Batch: Forecast all products in an upload ───────────────────────────────
/**
 * Takes all SalesRecords from one upload, groups by productId,
 * runs forecasts, and returns an array of prediction objects.
 *
 * @param {Array}  salesRecords  SalesRecord[] (any order)
 * @param {Object} stockMap      { [productId]: currentStock }
 * @returns {Array}              [{ productId, productName, ...forecastResult }]
 */
function batchForecast(salesRecords, stockMap = {}) {
  // Group records by productId
  const groups = {};
  for (const r of salesRecords) {
    if (!groups[r.productId]) groups[r.productId] = [];
    groups[r.productId].push(r);
  }

  const results = [];
  for (const [productId, records] of Object.entries(groups)) {
    // Sort ascending by date
    records.sort((a, b) => new Date(a.date) - new Date(b.date));

    const currentStock = stockMap[productId] ?? records[records.length - 1]?.stock ?? 0;
    const prediction   = forecastProduct(records, currentStock);

    results.push({
      productId,
      productName: records[0].productName,
      category:    records[0].category,
      region:      records[0].region,
      currentStock,
      dataPoints:  records.length,
      ...prediction,
    });
  }

  return results;
}

// ─── Dashboard Aggregation helpers ───────────────────────────────────────────

/**
 * Compute overall forecasted demand for next 30 days across all products.
 */
function aggregateForecast(predictions) {
  return predictions.reduce((sum, p) => sum + (p.forecastedDemand || 0), 0);
}

/**
 * Compute overstock risk % — products with stock > 3× forecasted demand.
 */
function overstockRisk(predictions) {
  if (!predictions.length) return 0;
  const over = predictions.filter(p => p.currentStock > p.forecastedDemand * 3);
  return +((over.length / predictions.length) * 100).toFixed(1);
}

/**
 * Aggregate profit trend from sales records.
 * Returns array of { month, profit, forecast } for the last N months.
 */
function profitTrend(salesRecords, months = 8) {
  // Preserve insertion order (records are already sorted by date)
  const monthOrder = [];
  const map = {};
  for (const r of salesRecords) {
    const key = r.month;
    if (!map[key]) {
      map[key] = { month: key, profit: 0 };
      monthOrder.push(key);
    }
    // Use actual profit if available, otherwise estimate from price/cost or 35% margin
    if (r.profit != null) {
      map[key].profit += r.profit;
    } else if (r.price && r.cost) {
      map[key].profit += Math.round((r.price - r.cost) * r.sales);
    } else {
      map[key].profit += Math.round(r.sales * (r.price || 10) * 0.35);
    }
  }

  return monthOrder.slice(-months).map(key => map[key]);
}

module.exports = {
  linearForecast,
  exponentialSmoothing,
  holtLinearForecast,
  computeSeasonalIndices,
  computeSafetyStock,
  classifyRisk,
  computeConfidence,
  forecastProduct,
  batchForecast,
  aggregateForecast,
  overstockRisk,
  profitTrend,
};

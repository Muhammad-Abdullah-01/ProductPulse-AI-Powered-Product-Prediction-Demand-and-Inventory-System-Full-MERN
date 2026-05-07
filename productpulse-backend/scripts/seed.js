/**
 * ProductPulse — Database Seed Script
 * Run: node scripts/seed.js
 *
 * Creates:
 *  - 1 demo user (alex@demo.com / demo1234)
 *  - 8 months of sales records across 6 categories × 4 regions
 *  - Upload record
 *  - AI-computed alerts
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose    = require('mongoose');
const User        = require('../models/User');
const SalesRecord = require('../models/SalesRecord');
const Upload      = require('../models/Upload');
const Alert       = require('../models/Alert');
const Report      = require('../models/Report');
const { batchForecast } = require('../services/predictionService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/productpulse';

// ── Demo Products ─────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id:'P001', name:'Wireless Earbuds Pro',  category:'Electronics',  baseStock:4   },
  { id:'P002', name:'Winter Jacket XL',      category:'Fashion',      baseStock:22  },
  { id:'P003', name:'Organic Olive Oil 1L',  category:'Groceries',    baseStock:8   },
  { id:'P004', name:'Running Shoes M10',     category:'Sports',       baseStock:156 },
  { id:'P005', name:'Vitamin C Serum',       category:'Beauty',       baseStock:6   },
  { id:'P006', name:'Coffee Maker Deluxe',   category:'Appliances',   baseStock:31  },
  { id:'P007', name:'Garden Hose 50ft',      category:'Home & Garden',baseStock:94  },
  { id:'P008', name:'Smart Watch Series 5',  category:'Electronics',  baseStock:18  },
];

const REGIONS    = ['North', 'South', 'East', 'West'];
const MONTHS     = ['Aug 2024','Sep 2024','Oct 2024','Nov 2024','Dec 2024','Jan 2025','Feb 2025','Mar 2025'];
const MONTH_DATES= MONTHS.map(m => {
  const [mon, yr] = m.split(' ');
  const monthIdx  = new Date(`${mon} 1 ${yr}`).getMonth();
  return new Date(parseInt(yr), monthIdx, 1);
});

// Seasonal multipliers — Dec high, Feb low
const SEASONAL = [0.85, 0.90, 1.00, 1.15, 1.30, 0.90, 0.95, 1.05];

// Base monthly sales per product (realistically varied)
const BASE_SALES = {
  P001: 480,  P002: 210,  P003: 890,
  P004: 340,  P005: 670,  P006: 130,
  P007: 240,  P008: 120,
};

function rnd(base, variance = 0.15) {
  return Math.max(1, Math.round(base * (1 + (Math.random() - 0.5) * variance * 2)));
}

async function seed() {
  console.log('🔌 Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  // ── Wipe existing demo data ────────────────────────────────────────────────
  console.log('🧹 Clearing existing collections…');
  await Promise.all([
    User.deleteMany({}),
    SalesRecord.deleteMany({}),
    Upload.deleteMany({}),
    Alert.deleteMany({}),
    Report.deleteMany({}),
  ]);

  // ── Create demo user ───────────────────────────────────────────────────────
  console.log('👤 Creating demo user…');
  const user = await User.create({
    name:     'Alex Stevens',
    email:    'alex@demo.com',
    password: 'demo1234',
    company:  'RetailPro Inc.',
    phone:    '+1 (555) 234-5678',
    role:     'admin',
  });
  console.log('   ✅ alex@demo.com / demo1234');

  // ── Create a demo upload ───────────────────────────────────────────────────
  const upload = await Upload.create({
    uploadedBy:   user._id,
    fileName:     'demo_seed.csv',
    originalName: 'Q1_sales_data.csv',
    fileSize:     48200,
    mimeType:     'text/csv',
    filePath:     '/tmp/demo_seed.csv',
    status:       'completed',
    rowsTotal:    PRODUCTS.length * REGIONS.length * MONTHS.length,
    rowsImported: PRODUCTS.length * REGIONS.length * MONTHS.length,
    processedAt:  new Date(),
  });

  // ── Generate SalesRecords ──────────────────────────────────────────────────
  console.log('📊 Generating sales records…');
  const salesDocs = [];

  for (const product of PRODUCTS) {
    for (const region of REGIONS) {
      const regionFactor = { North: 1.10, South: 0.90, East: 1.05, West: 0.85 }[region];

      for (let mi = 0; mi < MONTHS.length; mi++) {
        const base   = BASE_SALES[product.id];
        const sales  = rnd(base * SEASONAL[mi] * regionFactor);
        const price  = rnd(25 + Math.random() * 200);
        const cost   = Math.round(price * 0.6);
        const profit = (price - cost) * sales;

        salesDocs.push({
          uploadedBy:  user._id,
          uploadId:    upload._id,
          productId:   product.id,
          productName: product.name,
          category:    product.category,
          region,
          sales,
          month:       MONTHS[mi],
          date:        MONTH_DATES[mi],
          stock:       mi === MONTHS.length - 1 ? product.baseStock : null,
          price,
          cost,
          profit,
        });
      }
    }
  }

  const records = await SalesRecord.insertMany(salesDocs);
  console.log(`   ✅ ${records.length} sales records inserted`);

  // ── Run AI predictions ─────────────────────────────────────────────────────
  console.log('🧠 Running AI demand forecasts…');
  const stockMap = {};
  for (const p of PRODUCTS) stockMap[p.id] = p.baseStock;

  const predictions = batchForecast(records, stockMap);

  // Update SalesRecords with predictions
  const bulkOps = predictions.map(p => ({
    updateMany: {
      filter: { productId: p.productId, uploadId: upload._id },
      update: {
        $set: {
          forecastedDemand: p.forecastedDemand,
          stockRisk:        p.severity,
          restockDate:      p.shortageDateISO,
        },
      },
    },
  }));
  await SalesRecord.bulkWrite(bulkOps);

  // ── Create Alerts ──────────────────────────────────────────────────────────
  console.log('⚠️  Creating alerts…');
  const alertDocs = predictions
    .filter(p => p.severity !== 'stable')
    .map(p => ({
      createdBy:       user._id,
      product:         p.productName,
      productId:       p.productId,
      category:        p.category,
      region:          p.region,
      stockStatus:     p.stockStatus,
      severity:        p.severity,
      stock:           p.currentStock,
      required:        p.reorderPoint,
      shortageDate:    p.shortageDate,
      shortageDateISO: p.shortageDateISO,
      action:          p.action,
    }));

  const alerts = await Alert.insertMany(alertDocs);
  console.log(`   ✅ ${alerts.length} alerts created`);

  // ── Finalise upload with prediction summary ────────────────────────────────
  const totalForecast = predictions.reduce((s, p) => s + p.forecastedDemand, 0);
  const avgConf       = Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length);

  await Upload.findByIdAndUpdate(upload._id, {
    predictionSummary: {
      forecastedDemand: totalForecast,
      criticalAlerts:   alerts.filter(a => a.severity === 'critical').length,
      warningAlerts:    alerts.filter(a => a.severity === 'warning').length,
      modelConfidence:  avgConf,
    },
    validationWarnings: [
      { type: 'info', message: `${records.length} product records loaded successfully`, rows: [] },
    ],
  });

  // ── Create sample reports ──────────────────────────────────────────────────
  console.log('📑 Creating sample reports…');
  await Report.insertMany([
    {
      generatedBy: user._id,
      name:        'March Summary',
      reportType:  'Monthly',
      format:      'pdf',
      dateRange:   { label: 'This Month' },
      summary:     { totalProfit: 182000, topCategory: 'Groceries', growthRegion: 'East', riskPercent: 14 },
      status:      'ready',
      fileSize:    1468006,
      readyAt:     new Date(Date.now() - 2 * 3600000),
    },
    {
      generatedBy: user._id,
      name:        'Q1 Category Report',
      reportType:  'Category',
      format:      'excel',
      dateRange:   { label: 'Last 3 Months' },
      summary:     { totalProfit: 142000, topCategory: 'Electronics', growthRegion: 'North', riskPercent: 11 },
      status:      'ready',
      fileSize:    862208,
      readyAt:     new Date(Date.now() - 86400000),
    },
    {
      generatedBy: user._id,
      name:        'Inventory Report Feb',
      reportType:  'Inventory',
      format:      'pdf',
      dateRange:   { label: 'Last 3 Months' },
      summary:     { totalProfit: 108000, topCategory: 'Fashion', growthRegion: 'East', riskPercent: 18 },
      status:      'ready',
      fileSize:    2202009,
      readyAt:     new Date(Date.now() - 14 * 86400000),
    },
  ]);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉  Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Login:    alex@demo.com');
  console.log('   Password: demo1234');
  console.log(`   Records:  ${records.length}`);
  console.log(`   Alerts:   ${alerts.length}`);
  console.log(`   Forecast: ${totalForecast.toLocaleString()} units (30d)`);
  console.log(`   Confidence: ${avgConf}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});

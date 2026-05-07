/**
 * Generate a detailed sales data XLSX file for ProductPulse testing.
 * Run:  node scripts/generate_sales_data.js
 */
const XLSX = require('xlsx');
const path = require('path');

const PRODUCTS = [
  { id: 'ELEC-001', name: 'Wireless Bluetooth Headphones',  category: 'Electronics',   basePrice: 79.99,  baseCost: 42.00, baseSales: 320, genderSplit: [0.62, 0.38] },
  { id: 'ELEC-002', name: 'Smart LED TV 55"',               category: 'Electronics',   basePrice: 549.99, baseCost: 310.00, baseSales: 85, genderSplit: [0.70, 0.30] },
  { id: 'ELEC-003', name: 'Portable Power Bank 20000mAh',   category: 'Electronics',   basePrice: 34.99,  baseCost: 15.50, baseSales: 510, genderSplit: [0.58, 0.42] },
  { id: 'ELEC-004', name: 'Mechanical Gaming Keyboard',     category: 'Electronics',   basePrice: 129.99, baseCost: 65.00, baseSales: 195, genderSplit: [0.78, 0.22] },
  { id: 'ELEC-005', name: 'USB-C Docking Station',          category: 'Electronics',   basePrice: 89.99,  baseCost: 38.00, baseSales: 145, genderSplit: [0.65, 0.35] },
  { id: 'ELEC-006', name: 'Wireless Charging Pad',          category: 'Electronics',   basePrice: 29.99,  baseCost: 11.00, baseSales: 680, genderSplit: [0.55, 0.45] },
  { id: 'FASH-001', name: 'Premium Cotton T-Shirt',         category: 'Fashion',       basePrice: 24.99,  baseCost: 8.50,  baseSales: 890, genderSplit: [0.45, 0.55] },
  { id: 'FASH-002', name: 'Slim Fit Denim Jeans',           category: 'Fashion',       basePrice: 59.99,  baseCost: 22.00, baseSales: 420, genderSplit: [0.52, 0.48] },
  { id: 'FASH-003', name: 'Running Sneakers Pro',           category: 'Fashion',       basePrice: 99.99,  baseCost: 45.00, baseSales: 310, genderSplit: [0.48, 0.52] },
  { id: 'FASH-004', name: 'Leather Crossbody Bag',          category: 'Fashion',       basePrice: 74.99,  baseCost: 28.00, baseSales: 260, genderSplit: [0.15, 0.85] },
  { id: 'FASH-005', name: 'Winter Puffer Jacket',           category: 'Fashion',       basePrice: 149.99, baseCost: 62.00, baseSales: 180, genderSplit: [0.40, 0.60] },
  { id: 'GROC-001', name: 'Organic Whole Milk 1 Gallon',    category: 'Groceries',     basePrice: 5.49,   baseCost: 3.20,  baseSales: 2400, genderSplit: [0.42, 0.58] },
  { id: 'GROC-002', name: 'Extra Virgin Olive Oil 1L',      category: 'Groceries',     basePrice: 12.99,  baseCost: 7.50,  baseSales: 850, genderSplit: [0.38, 0.62] },
  { id: 'GROC-003', name: 'Premium Basmati Rice 5kg',       category: 'Groceries',     basePrice: 9.99,   baseCost: 5.80,  baseSales: 1200, genderSplit: [0.45, 0.55] },
  { id: 'GROC-004', name: 'Mixed Nuts Variety Pack',        category: 'Groceries',     basePrice: 14.99,  baseCost: 8.00,  baseSales: 620, genderSplit: [0.50, 0.50] },
  { id: 'GROC-005', name: 'Arabica Coffee Beans 1kg',       category: 'Groceries',     basePrice: 18.99,  baseCost: 10.50, baseSales: 780, genderSplit: [0.55, 0.45] },
  { id: 'SPRT-001', name: 'Yoga Mat Premium 6mm',           category: 'Sports',        basePrice: 39.99,  baseCost: 14.00, baseSales: 340, genderSplit: [0.30, 0.70] },
  { id: 'SPRT-002', name: 'Adjustable Dumbbell Set 25kg',   category: 'Sports',        basePrice: 159.99, baseCost: 72.00, baseSales: 120, genderSplit: [0.80, 0.20] },
  { id: 'SPRT-003', name: 'Resistance Bands Set (5 Pack)',  category: 'Sports',        basePrice: 19.99,  baseCost: 5.50,  baseSales: 560, genderSplit: [0.35, 0.65] },
  { id: 'SPRT-004', name: 'Sports Water Bottle 1L',         category: 'Sports',        basePrice: 14.99,  baseCost: 4.80,  baseSales: 920, genderSplit: [0.60, 0.40] },
  { id: 'BEAU-001', name: 'Vitamin C Face Serum 30ml',      category: 'Beauty',        basePrice: 28.99,  baseCost: 9.00,  baseSales: 470, genderSplit: [0.12, 0.88] },
  { id: 'BEAU-002', name: 'Moisturizing Cream SPF 50',      category: 'Beauty',        basePrice: 22.99,  baseCost: 7.50,  baseSales: 580, genderSplit: [0.20, 0.80] },
  { id: 'BEAU-003', name: 'Hair Growth Oil 100ml',          category: 'Beauty',        basePrice: 16.99,  baseCost: 5.00,  baseSales: 390, genderSplit: [0.40, 0.60] },
  { id: 'BEAU-004', name: 'Matte Lipstick Collection',      category: 'Beauty',        basePrice: 34.99,  baseCost: 12.00, baseSales: 710, genderSplit: [0.05, 0.95] },
  { id: 'HOME-001', name: 'Memory Foam Pillow Set',         category: 'Home & Garden', basePrice: 44.99,  baseCost: 18.00, baseSales: 280, genderSplit: [0.42, 0.58] },
  { id: 'HOME-002', name: 'LED Desk Lamp Adjustable',       category: 'Home & Garden', basePrice: 36.99,  baseCost: 14.00, baseSales: 350, genderSplit: [0.50, 0.50] },
  { id: 'HOME-003', name: 'Indoor Plant Pot Set (3 Pack)',   category: 'Home & Garden', basePrice: 27.99,  baseCost: 10.00, baseSales: 420, genderSplit: [0.30, 0.70] },
  { id: 'HOME-004', name: 'Bamboo Cutting Board Set',       category: 'Home & Garden', basePrice: 32.99,  baseCost: 13.00, baseSales: 310, genderSplit: [0.48, 0.52] },
  { id: 'APPL-001', name: 'Air Fryer 5.5L Digital',         category: 'Appliances',    basePrice: 89.99,  baseCost: 42.00, baseSales: 230, genderSplit: [0.45, 0.55] },
  { id: 'APPL-002', name: 'Robot Vacuum Cleaner',           category: 'Appliances',    basePrice: 299.99, baseCost: 145.00, baseSales: 95, genderSplit: [0.52, 0.48] },
  { id: 'APPL-003', name: 'Electric Kettle 1.7L',           category: 'Appliances',    basePrice: 39.99,  baseCost: 16.00, baseSales: 480, genderSplit: [0.40, 0.60] },
  { id: 'APPL-004', name: 'Blender Pro 1200W',              category: 'Appliances',    basePrice: 69.99,  baseCost: 28.00, baseSales: 310, genderSplit: [0.38, 0.62] },
];

const REGIONS = ['North', 'South', 'East', 'West'];
const MONTHS = [
  'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025',
  'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025',
];

const SEASONAL = {
  Electronics:    [0.85, 0.80, 0.90, 0.95, 1.00, 1.05, 1.00, 1.10, 1.15, 1.05, 1.40, 1.65],
  Fashion:        [1.10, 0.95, 1.15, 1.20, 1.10, 0.90, 0.85, 0.95, 1.00, 1.10, 1.30, 1.45],
  Groceries:      [1.00, 0.95, 1.00, 1.00, 1.05, 1.05, 1.10, 1.05, 1.00, 1.00, 1.10, 1.15],
  Sports:         [1.30, 1.10, 1.05, 1.00, 1.15, 1.20, 1.10, 1.00, 0.90, 0.85, 0.80, 0.75],
  Beauty:         [0.95, 1.10, 1.15, 1.05, 1.10, 1.00, 0.95, 1.05, 1.10, 1.00, 1.15, 1.20],
  'Home & Garden':[0.80, 0.85, 1.10, 1.25, 1.30, 1.20, 1.10, 1.00, 0.95, 0.90, 0.85, 0.90],
  Appliances:     [0.90, 0.85, 0.95, 1.00, 1.05, 1.10, 1.00, 1.05, 1.10, 1.15, 1.35, 1.50],
};

const REGION_WEIGHT = { North: 1.1, South: 0.95, East: 1.0, West: 1.05 };

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function jitter(base, pct) { return Math.round(base * (1 + (Math.random() * 2 - 1) * pct)); }

const rows = [];

for (const product of PRODUCTS) {
  for (let mi = 0; mi < MONTHS.length; mi++) {
    const regionCount = rand(2, 4);
    const shuffled = [...REGIONS].sort(() => Math.random() - 0.5);
    const selectedRegions = shuffled.slice(0, regionCount);

    for (const region of selectedRegions) {
      const seasonal = SEASONAL[product.category]?.[mi] || 1.0;
      const regionMul = REGION_WEIGHT[region] || 1.0;
      const sales = Math.max(jitter(Math.round(product.baseSales * seasonal * regionMul / regionCount), 0.20), 1);

      // Gender assignment based on product's gender split
      const gender = Math.random() < product.genderSplit[0] ? 'Male' : 'Female';

      let stock;
      const stockRoll = Math.random();
      if (stockRoll < 0.08) stock = rand(2, 15);
      else if (stockRoll < 0.20) stock = rand(15, 50);
      else if (stockRoll < 0.40) stock = rand(50, 150);
      else stock = rand(100, 500);

      const price = +(product.basePrice * (1 + (Math.random() * 0.10 - 0.05))).toFixed(2);
      const cost  = +(product.baseCost  * (1 + (Math.random() * 0.10 - 0.05))).toFixed(2);

      rows.push({
        product_id:   product.id,
        product_name: product.name,
        category:     product.category,
        region:       region,
        gender:       gender,
        sales:        sales,
        month:        MONTHS[mi],
        stock:        stock,
        price:        price,
        cost:         cost,
      });
    }
  }
}

rows.sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month) || a.product_id.localeCompare(b.product_id));

const worksheet = XLSX.utils.json_to_sheet(rows);
worksheet['!cols'] = [
  { wch: 12 }, { wch: 36 }, { wch: 16 }, { wch: 8 }, { wch: 8 },
  { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

const outputPath = path.join(__dirname, '..', '..', 'sales_data_detailed.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`\n✅  Generated ${rows.length} rows`);
console.log(`    📦  ${PRODUCTS.length} products · 🏷️ 7 categories · 🌍 4 regions · 📅 12 months`);
console.log(`    👤  Gender column included (Male/Female per row)`);
console.log(`\n📄  File: ${outputPath}\n`);

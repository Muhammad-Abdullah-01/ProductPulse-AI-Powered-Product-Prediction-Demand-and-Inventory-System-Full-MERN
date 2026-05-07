// ===== MOCK DATA =====

export const kpiData = [
  {
    id: 'categories',
    label: 'Top-Selling Categories',
    value: '8',
    change: '+2',
    changeDir: 'up',
    icon: '🏷️',
    tooltip: 'Electronics, Fashion & Groceries lead sales this month',
  },
  {
    id: 'forecast',
    label: 'Forecasted Demand (30d)',
    value: '24.8K',
    change: '+12.4%',
    changeDir: 'up',
    icon: '📈',
    tooltip: 'ML model confidence: 91.3%',
  },
  {
    id: 'overstock',
    label: 'Overstock Risk',
    value: '14%',
    change: '-3.1%',
    changeDir: 'up',
    icon: '📦',
    tooltip: '14% of SKUs are at overstock risk',
  },
  {
    id: 'outofstock',
    label: 'Out-of-Stock Alerts',
    value: '37',
    change: '+5',
    changeDir: 'dn',
    icon: '⚠️',
    tooltip: '37 products below safety stock threshold',
  },
  {
    id: 'profit',
    label: 'Total Profit',
    value: '$182K',
    change: '+18.7%',
    changeDir: 'up',
    icon: '💰',
    tooltip: 'Net profit this calendar month',
  },
];

// Green shades for charts
export const profitTrend = [
  { month: 'Aug', profit: 82000,  forecast: 78000  },
  { month: 'Sep', profit: 94000,  forecast: 90000  },
  { month: 'Oct', profit: 108000, forecast: 104000 },
  { month: 'Nov', profit: 135000, forecast: 130000 },
  { month: 'Dec', profit: 158000, forecast: 162000 },
  { month: 'Jan', profit: 142000, forecast: 148000 },
  { month: 'Feb', profit: 162000, forecast: 156000 },
  { month: 'Mar', profit: 182000, forecast: 179000 },
];

export const categoryDemand = [
  { name: 'Electronics', demand: 4200, color: '#1A7A3A' },
  { name: 'Fashion',     demand: 3800, color: '#2D9D5C' },
  { name: 'Groceries',   demand: 5100, color: '#4CAF72' },
  { name: 'Home & Garden',demand: 2400, color: '#76C893' },
  { name: 'Sports',      demand: 1900, color: '#A8DAB5' },
  { name: 'Beauty',      demand: 2800, color: '#0D5C28' },
];

export const regionalData = [
  { name: 'North', value: 32, color: '#1A7A3A' },
  { name: 'South', value: 24, color: '#2D9D5C' },
  { name: 'East',  value: 28, color: '#4CAF72' },
  { name: 'West',  value: 16, color: '#76C893' },
];

export const recentActivity = [
  { id: 1, type: 'Upload',     file: 'Q1_sales_data.csv',       status: 'Completed', time: '2m ago',  statusType: 'success' },
  { id: 2, type: 'Prediction', model: 'Demand Forecast v3',     status: 'Running',   time: '8m ago',  statusType: 'info'    },
  { id: 3, type: 'Upload',     file: 'inventory_march.xlsx',    status: 'Completed', time: '23m ago', statusType: 'success' },
  { id: 4, type: 'Report',     report: 'Monthly Summary',       status: 'Generated', time: '1h ago',  statusType: 'purple'  },
  { id: 5, type: 'Prediction', model: 'Seasonal Trends',        status: 'Failed',    time: '2h ago',  statusType: 'danger'  },
  { id: 6, type: 'Alert',      alert: 'Stock Critical: 12 SKUs',status: 'Active',    time: '3h ago',  statusType: 'warning' },
];

export const topAlerts = [
  { product: 'Wireless Earbuds Pro', category: 'Electronics', severity: 'critical', stock: 4,  required: 150 },
  { product: 'Winter Jacket XL',     category: 'Fashion',     severity: 'warning',  stock: 22, required: 80  },
  { product: 'Organic Olive Oil',    category: 'Groceries',   severity: 'critical', stock: 8,  required: 200 },
];

// ── Analytics page ──────────────────────────────────────────────────────────
export const forecastData = [
  { month: 'Jan', actual: 3800, predicted: 3650 },
  { month: 'Feb', actual: 4200, predicted: 4100 },
  { month: 'Mar', actual: 3900, predicted: 4050 },
  { month: 'Apr', actual: 4800, predicted: 4700 },
  { month: 'May', actual: 5200, predicted: 5100 },
  { month: 'Jun', actual: 4600, predicted: 4800 },
  { month: 'Jul', actual: 5500, predicted: 5400 },
  { month: 'Aug', actual: 6100, predicted: 5900 },
];

export const genderSales = [
  { category: 'Electronics', male: 2800, female: 1400 },
  { category: 'Fashion',     male: 900,  female: 2900 },
  { category: 'Groceries',   male: 2200, female: 2900 },
  { category: 'Sports',      male: 1400, female: 500  },
  { category: 'Beauty',      male: 300,  female: 2500 },
];

export const regionalGrowth = [
  { region: 'North', q1: 22, q2: 28, q3: 32, q4: 38 },
  { region: 'South', q1: 18, q2: 22, q3: 24, q4: 26 },
  { region: 'East',  q1: 25, q2: 30, q3: 34, q4: 40 },
  { region: 'West',  q1: 14, q2: 16, q3: 18, q4: 22 },
];

export const heatmapData = (() => {
  const cats = ['Electronics', 'Fashion', 'Groceries', 'Sports', 'Beauty', 'Home'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return cats.map(c => ({
    category: c,
    values: months.map(m => ({ month: m, value: Math.floor(Math.random() * 100) + 20 })),
  }));
})();

// ── Alerts page ─────────────────────────────────────────────────────────────
export const alertsData = [
  { id: 1, product: 'Wireless Earbuds Pro',  category: 'Electronics',  region: 'North', stockStatus: 'Critical', shortageDate: 'Apr 28', action: 'Reorder',        severity: 'critical', stock: 4   },
  { id: 2, product: 'Winter Jacket XL',      category: 'Fashion',      region: 'South', stockStatus: 'Warning',  shortageDate: 'May 3',  action: 'Reorder',        severity: 'warning',  stock: 22  },
  { id: 3, product: 'Organic Olive Oil 1L',  category: 'Groceries',    region: 'East',  stockStatus: 'Critical', shortageDate: 'Apr 30', action: 'Reorder',        severity: 'critical', stock: 8   },
  { id: 4, product: 'Running Shoes M10',     category: 'Sports',       region: 'West',  stockStatus: 'Stable',   shortageDate: '—',      action: 'Monitor',        severity: 'stable',   stock: 156 },
  { id: 5, product: 'Smart Watch Series 5',  category: 'Electronics',  region: 'North', stockStatus: 'Warning',  shortageDate: 'May 8',  action: 'Reorder',        severity: 'warning',  stock: 18  },
  { id: 6, product: 'Vitamin C Serum',       category: 'Beauty',       region: 'South', stockStatus: 'Critical', shortageDate: 'May 1',  action: 'Reorder',        severity: 'critical', stock: 6   },
  { id: 7, product: 'Garden Hose 50ft',      category: 'Home & Garden',region: 'West',  stockStatus: 'Stable',   shortageDate: '—',      action: 'Monitor',        severity: 'stable',   stock: 94  },
  { id: 8, product: 'Coffee Maker Deluxe',   category: 'Appliances',   region: 'East',  stockStatus: 'Warning',  shortageDate: 'May 12', action: 'View Insights',  severity: 'warning',  stock: 31  },
];

// ── Reports page ─────────────────────────────────────────────────────────────
export const reportSummary = [
  { label: 'Total Profit',   value: '$182K',    change: '+18.7%',  dir: 'up', color: 'var(--accent)'   },
  { label: 'Top Category',   value: 'Groceries',change: '5.1K units',dir:'up', color: 'var(--accent-2)' },
  { label: 'Growth Region',  value: 'East',     change: '+40%',    dir: 'up', color: 'var(--accent-3)' },
  { label: 'Risk %',         value: '14%',      change: '-3.1%',   dir: 'up', color: 'var(--status-orange)' },
];

export const miniProfitData = [
  { m: 'J', v: 82  }, { m: 'F', v: 94  }, { m: 'M', v: 108 },
  { m: 'A', v: 122 }, { m: 'M2',v: 135 }, { m: 'J2',v: 148 },
  { m: 'J3',v: 162 }, { m: 'A2',v: 182 },
];

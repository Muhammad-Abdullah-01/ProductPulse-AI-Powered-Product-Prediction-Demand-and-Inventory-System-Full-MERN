# ProductPulse Backend — API Reference & Frontend Integration Guide

## 🚀 Quick Start

```bash
cd productpulse-backend

# 1. Install dependencies
npm install

# 2. Copy env file and fill in your MongoDB URI
cp .env.example .env

# 3. Seed demo data (optional but recommended for testing)
npm run seed

# 4. Start server
npm run dev        # development (nodemon)
npm start          # production
```

**Base URL:** `http://localhost:5000/api`

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <token>
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login → returns JWT |
| GET | `/auth/me` | Get current user |
| PATCH | `/auth/update-profile` | Update name, email, prefs |
| PATCH | `/auth/change-password` | Change password |
| DELETE | `/auth/revoke-sessions` | Sign out all other devices |

### Login Example
```js
const res = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'alex@demo.com', password: 'demo1234' })
});
const { token, user } = await res.json();
localStorage.setItem('pp_token', token);
```

---

## 📊 Dashboard

All return live data computed from the user's uploaded sales records.

| Method | Endpoint | Frontend Card |
|--------|----------|---------------|
| GET | `/dashboard/kpis` | 5 KPI cards |
| GET | `/dashboard/profit-trend` | Profit Trend line chart |
| GET | `/dashboard/category-demand` | Category Demand bar chart |
| GET | `/dashboard/regional-distribution` | Regional Donut chart |
| GET | `/dashboard/recent-activity` | Recent Activity table |
| GET | `/dashboard/top-alerts` | ⚠️ Stock Alerts widget |

### KPI Response
```json
{
  "kpis": {
    "topCategoryCount": 6,
    "forecastedDemand": 24800,
    "overstockRisk": 14.0,
    "outOfStockAlerts": 37,
    "totalProfit": 182000
  }
}
```

---

## 📁 File Uploads

```js
// POST /api/uploads  (multipart/form-data, field name = "file")
const formData = new FormData();
formData.append('file', file);   // File object from <input type="file">

const res = await fetch('/api/uploads', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
const { uploadId } = await res.json();   // 202 Accepted immediately

// Poll status
const status = await fetch(`/api/uploads/${uploadId}/status`, {
  headers: { Authorization: `Bearer ${token}` }
});
// status.upload.status: 'pending' | 'processing' | 'completed' | 'failed'
// status.upload.validationWarnings: [...] ← feeds UploadData.js sidebar
// status.upload.predictionSummary: { forecastedDemand, criticalAlerts, modelConfidence }
```

---

## 📈 Analytics

| Method | Endpoint | Query Params | Chart |
|--------|----------|--------------|-------|
| GET | `/analytics/forecast` | `category`, `region` | Demand Forecast |
| GET | `/analytics/gender-sales` | — | Gender Area chart |
| GET | `/analytics/regional-growth` | — | Regional Area chart |
| GET | `/analytics/heatmap` | — | Category Heatmap |
| GET | `/analytics/ai-insights` | — | AI Insights panel |

---

## ⚠️ Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts` | List (filter: `category`, `severity`, `region`) |
| GET | `/alerts/summary` | Badge counts (critical/warning totals) |
| POST | `/alerts/:id/reorder` | Place reorder → sets reorderPlaced flag |
| PATCH | `/alerts/:id/dismiss` | Dismiss alert |
| DELETE | `/alerts/:id` | Delete alert |

---

## 📑 Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/summary` | KPI summary cards |
| GET | `/reports/profit-trend` | Mini profit chart data |
| GET | `/reports/category-demand` | Category bar chart |
| GET | `/reports/recent` | Recent exports list |
| POST | `/reports/generate` | Generate & save report record |

### Generate Report Body
```json
{
  "reportType": "Monthly",
  "format": "pdf",
  "dateRangeLabel": "This Month"
}
```

---

## 🤖 AI Prediction Algorithms

The prediction service (`services/predictionService.js`) implements:

1. **Linear Regression** — trend line over historical monthly sales  
2. **Holt's Linear Trend (Double Exponential Smoothing)** — captures both level and trend  
3. **Ensemble** — averages Linear Regression + Holt's for better accuracy  
4. **Seasonal Decomposition** — computes month-of-year indices (Dec spike, Feb dip etc.)  
5. **Safety Stock formula** — `Z × σ_demand × √(lead_time)` at 95% service level  
6. **Reorder Point** — `avg_daily_demand × lead_time + safety_stock`  
7. **Risk Classification** — critical (≤7 days stock), warning (≤21 days), stable  
8. **Confidence Score** — R² × data sufficiency (penalises < 12 months of history)  

---

## 🗂️ File Structure

```
productpulse-backend/
├── server.js                    ← Entry point
├── .env.example                 ← Copy to .env
├── config/
│   └── db.js                   ← MongoDB connection
├── models/
│   ├── User.js                  ← Users + sessions + prefs
│   ├── SalesRecord.js           ← Parsed CSV/XLSX rows + AI results
│   ├── Upload.js                ← Upload job tracking
│   ├── Alert.js                 ← Stock alerts
│   └── Report.js                ← Generated report records
├── controllers/
│   ├── authController.js
│   ├── dashboardController.js
│   ├── uploadController.js
│   ├── analyticsController.js
│   ├── alertsController.js
│   └── reportsController.js
├── routes/
│   ├── auth.js
│   ├── uploads.js
│   ├── dashboard.js
│   ├── analytics.js
│   ├── alerts.js
│   └── reports.js
├── services/
│   ├── predictionService.js     ← All AI/ML algorithms
│   └── fileParser.js            ← CSV + XLSX normaliser
├── middleware/
│   ├── auth.js                  ← JWT protect + restrictTo
│   ├── errorHandler.js          ← Global error handler
│   └── uploadMiddleware.js      ← Multer config
└── scripts/
    └── seed.js                  ← Demo data seeder
```

---

## 🔗 Connecting Frontend to Backend

In your React frontend, create a helper like:

```js
// src/api/client.js
const BASE = 'http://localhost:5000/api';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('pp_token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API error');
  return data;
}
```

Then replace mockData imports in each page with `useEffect` + `apiFetch` calls.

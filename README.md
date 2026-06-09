# 📈 ProductPulse — AI-Powered Demand & Inventory Intelligence

ProductPulse is a high-performance inventory analytics platform that eliminates stockouts and overstocking by turning historical sales records into real-time, actionable insights. By processing user-uploaded sales data (XLSX/CSV), the platform employs a native statistical AI engine to forecast future demand, calculate optimal safety stock levels, and flag critical inventory risks.

---

### 🛡️ Badges

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

---

### 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React.js, Recharts, Vanilla CSS | Interactive UI, charting dashboard, and settings |
| **Backend** | Node.js, Express.js | API routing, security middleware, and file parsing |
| **Database** | MongoDB Atlas, Mongoose | Persistent storage for users, sales records, and alerts |
| **ML / AI** | JavaScript Ensemble (simple-statistics) | On-the-fly regression, Holt's linear trend, and seasonality |
| **Data Processing** | SheetJS (xlsx), CSV Parser | Reading and normalizing uploaded Excel and CSV files |

---

### 🌟 Features

#### 🌐 Web Application Features
- **Smart Data Ingestion**: Drag-and-drop Excel (`.xlsx`, `.xls`) or `.csv` files with robust columns/date auto-validation.
- **Dynamic KPI Dashboard**: Tracks key performance metrics including top-selling categories, total profit trends, and overstock risk percentages.
- **Interactive Reports Page**: Visualizes category breakdowns with options to generate and download customized reports.
- **Interactive Alerts System**: Categorizes stock risks into "Critical" and "Warning", with options to directly trigger reorder events.
- **Secure Authentication**: Complete sign-up, session security with JWT, password strength verification, and profile/theme settings persistence.

#### 🤖 AI Model Features
- **Dynamic Ensemble Demand Forecasting**: Blends regression lines with exponential smoothing to generate demand estimates for the next 30 days and 3 months.
- **Seasonal Adjustments**: Computes seasonal index mapping (1–12) to scale forecasts based on monthly historical spikes.
- **Safety Stock Computation**: Employs Z-scores (95% service level) and standard deviation of daily sales to compute mathematically sound reorder points.
- **Risk Severity Classification**: Automates shortage date estimation and triggers action items based on current stock vs. safety stock thresholds.
- **Smart Confidence Scores**: Combines the regression model's R² coefficient with data sufficiency penalties (penalizing datasets with less than 12 months of history).

---

### 📂 Project Structure

```text
productpulse-6/
├── frontend/                        # React Frontend Web App
│   ├── public/                      # Static web assets
│   └── src/
│       ├── components/              # Shared layout components (Header, Sidebar)
│       ├── context/                 # State providers (Theme, Auth)
│       ├── pages/                   # Main views (Dashboard, Analytics, Alerts, Settings)
│       └── styles.css               # Global application design system
│
├── productpulse-backend/            # Express Backend API & AI Engine
│   ├── config/                      # Database connection rules
│   ├── controllers/                 # Express route handler logic
│   ├── middleware/                  # Security rate limiters and JWT decoders
│   ├── models/                      # MongoDB Schemas (User, SalesRecord, Alert)
│   ├── routes/                      # API endpoint mappings
│   ├── services/
│   │   ├── predictionService.js     # Statistical AI engine & forecasting logic
│   │   └── fileParser.js            # Ingested file validator and standardizer
│   ├── scripts/                     # Seeding, testing, and performance scripts
│   └── server.js                    # API Entrypoint
│
└── Docs/                            # Technical reports and evaluation materials
```

---

### ⚡ Installation & Local Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/productpulse.git
cd productpulse
```

#### Step 2: Configure Environment Variables
Inside `productpulse-backend/`, copy `.env.example` to `.env` and fill in your details:
```bash
cd productpulse-backend
cp .env.example .env
```

#### Step 3: Install Backend Dependencies & Run
Install packages and seed the database with initial mock data:
```bash
npm install
npm run seed
npm run dev
```

#### Step 4: Install Frontend Dependencies & Run
In a separate terminal window, set up and launch the web server:
```bash
cd ../frontend
npm install
npm start
```
The application will open automatically at `http://localhost:3000`.

---

### 🐍 Python / ML Extension Setup (Optional)
If you wish to serve predictions using a Python-based microservice instead of the native JavaScript engine, follow these steps:

1. **Install Python dependencies**:
   ```bash
   pip install flask numpy pandas scikit-learn
   ```
2. **Execute training or validation scripts**:
   Refer to Python scripts inside `scripts/` (if configured) or launch the Flask listener:
   ```bash
   python scripts/serve_model.py
   ```

---

### ⚙️ Environment Variables

#### Backend `.env` Configuration
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/productpulse
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

---

### 🛣️ API Endpoints

#### Authentication Routes
- `POST /api/auth/register` — Create a new user account
- `POST /api/auth/login` — Authenticate and receive a JWT session token
- `GET /api/auth/me` — Retrieve logged-in profile data
- `PATCH /api/auth/update-profile` — Update user preferences and display name

#### File Uploads & Ingestion
- `POST /api/uploads` — Upload sales spreadsheets (`.csv`, `.xlsx`, `.xls`)
- `GET /api/uploads/:id/status` — Track parsing progress and validation warnings

#### Business Analytics
- `GET /api/analytics/forecast` — Fetch 30-day forecast filtered by category/region
- `GET /api/analytics/gender-sales` — Returns gender-based category sales
- `GET /api/analytics/regional-growth` — Returns regional growth quarterly segments

#### Inventory Alerts & Reports
- `GET /api/alerts` — Fetch risk flags (Critical/Warning)
- `POST /api/alerts/:id/reorder` — Log item reordering events
- `POST /api/reports/generate` — Export performance logs to Excel sheet outputs

---

### 🧠 Model Details

- **Algorithms Used**: 
  - **Linear Regression**: Analyzes multi-month historical trends to build a baseline trend slope.
  - **Holt's Linear Trend (Double Exponential Smoothing)**: Adapts quickly to level-shifts and momentum without seasonality.
  - **Seasonal Indexing**: Captures monthly cyclic patterns.
- **Target Variable**: Future sales volume (Demand Forecast for next 30 days / 3 months).
- **Input Features**: 
  - Chronological time steps (Months)
  - Historical monthly sales units
  - Real-time stock levels (for risk triggers)
  - Seasonal categories & regional dimensions
- **Performance Evaluation**:
  - **Forecast Accuracy**: `94.2%` (Average MAPE: `5.8%`)
  - **Goodness of Fit (R²)**: `0.884`
  - **Alert Precision**: `94.7%` | **Recall**: `90.0%`
- **Serving Architecture**: Calculated dynamically in memory on the Express backend (`predictionService.js`), optimizing resources by eliminating complex external process interfaces.

---

### 📸 Screenshots
*(Add your application screenshots here once deployed)*

---

### ⚠️ Limitations & Future Enhancements
- **Dataset Size Limits**: Scaling calculations to datasets larger than 10k items could block the main event loop. Future iterations will offload computations to background worker threads.
- **Lead Time Variables**: Lead times are currently set to a default of 7 days; future versions should track actual dynamic supplier lead times.
- **External Factors**: Does not account for external events (marketing campaigns, economic shifts, or holidays).

---

### 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

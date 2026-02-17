# Grid Intelligence & Forecasting Platform

A full-stack AI-powered web application for regional electric utility providers to predict grid demand surges and outage risks using AI forecasting.

## 🚀 Features

- **Real-time Grid Monitoring**: Current load visualization across all grid segments
- **AI-Powered Forecasting**: 24-hour demand forecast using time-series analysis
- **Outage Risk Prediction**: Risk scoring (0-100) for each grid segment
- **Predictive Alerts**: Automated alerts for high load, anomalies, and surge predictions
- **Maintenance Prioritization**: Grid segments ranked by outage risk for maintenance scheduling
- **Interactive Visualizations**: D3.js charts and heat maps for data analysis

## 🏗️ Architecture

### Frontend
- **React 18** with Vite
- **D3.js** for data visualization
- **TailwindCSS** for styling
- Interactive dashboard with real-time updates

### Backend
- **FastAPI** (Python) REST API
- **SQLite** database (for MVP simulation)
- AI forecasting service (simulated Prophet/LSTM logic)
- Mock telemetry data generator

### AI Layer
- Time-series forecasting (moving average + trend detection)
- Anomaly detection (statistical outlier detection)
- Risk scoring algorithm (combines load variability, anomalies, and load levels)

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

## 🚀 Running the Application

### Development Mode

#### Terminal 1 - Backend:
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Using Docker

```bash
docker-compose up --build
```

This will start both services:
- **Frontend**: http://localhost:80
- **Backend**: http://localhost:8000

## 📡 API Endpoints

### Dashboard
- `GET /api/dashboard/current-load` - Get current load for all segments
- `GET /api/dashboard/forecast?segment={segment}&hours={hours}` - Get demand forecast
- `GET /api/dashboard/outage-risks` - Get risk scores for all segments
- `GET /api/dashboard/alerts` - Get predictive alerts

### Maintenance
- `GET /api/maintenance/prioritization` - Get prioritized maintenance list

### Historical Data
- `GET /api/historical/loads?segment={segment}&days={days}` - Get historical load data

### Admin
- `POST /api/admin/initialize-data?days={days}` - Initialize database with mock data

## 🧪 Testing

The application automatically initializes with 30 days of historical data on first load. You can manually trigger data initialization:

```bash
curl -X POST "http://localhost:8000/api/admin/initialize-data?days=30"
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build and start services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ☁️ AWS App Runner Deployment

The application includes `apprunner.yaml` configuration for AWS App Runner deployment.

### Steps:
1. Push code to GitHub/GitLab
2. Create App Runner service
3. Connect to repository
4. App Runner will automatically detect and use `apprunner.yaml`

## 📊 Dashboard Components

1. **Current Load Card**: Shows total grid load and segment breakdown
2. **Alerts Panel**: Displays active alerts (Critical, Warning, Info)
3. **24-Hour Forecast Chart**: Interactive D3.js line chart with confidence intervals
4. **Outage Risk Heat Map**: Visual risk scores for all grid segments
5. **Maintenance Prioritization Table**: Segments ranked by risk score

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):
```
DATABASE_URL=sqlite:///./grid_intelligence.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
API_PORT=8000
```

**Frontend** (`vite.config.js`):
```javascript
VITE_API_URL=http://localhost:8000
```

## 🎯 Grid Segments

The application monitors 7 grid segments:
- North Zone
- South Zone
- East Zone
- West Zone
- Central Zone
- Industrial District
- Residential Sector

## 📈 AI Forecasting Logic

The forecasting service uses:
- **Moving Average**: 24-hour window for trend detection
- **Seasonal Patterns**: Daily patterns (peak hours: 8-10 AM, 6-8 PM)
- **Trend Detection**: Linear trend projection
- **Anomaly Detection**: Z-score based outlier detection (threshold: 2.5σ)
- **Risk Scoring**: Combines variability (30%), anomalies (40%), and load level (30%)

## 🔒 Security

- CORS middleware configured
- Environment variables for sensitive data
- Input validation via Pydantic models

## 📝 License

This project is built for demonstration purposes.

## 🤝 Contributing

This is a demonstration project. For production use, consider:
- Real-time data ingestion from smart meters
- Integration with actual ML models (Prophet, LSTM, etc.)
- Production database (PostgreSQL, Cassandra)
- Authentication and authorization
- Rate limiting and API security
- Monitoring and logging

## 📞 Support

For issues or questions, please check the API documentation at `/docs` endpoint.


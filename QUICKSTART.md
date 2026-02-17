# Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Install Backend Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 3: Run Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # If not already activated
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🌐 Access the Application

- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📊 First Time Setup

The application will automatically initialize with 30 days of historical data on first load. You can also manually trigger initialization:

```bash
curl -X POST "http://localhost:8000/api/admin/initialize-data?days=30"
```

## ✅ Verify Installation

1. Backend should show: "Database initialized" on startup
2. Frontend should open in browser automatically
3. Dashboard should display current load, forecasts, and risk scores

## 🐛 Troubleshooting

### Backend Issues
- Ensure Python 3.11+ is installed: `python3 --version`
- Check if port 8000 is available
- Verify database file is created: `ls backend/*.db`

### Frontend Issues
- Ensure Node.js 18+ is installed: `node --version`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if port 5173 is available

### CORS Errors
- Ensure backend CORS_ORIGINS includes `http://localhost:5173`
- Check backend is running on port 8000

## 📝 Next Steps

- Explore the dashboard at http://localhost:5173
- Check API documentation at http://localhost:8000/docs
- Review README.md for detailed documentation


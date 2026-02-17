# Grid Intelligence & Forecasting Platform - Complete Feature Inventory

## BACKEND API ENDPOINTS

### Public Endpoints
1. `GET /` - Root endpoint, API status
2. `GET /health` - Health check endpoint
3. `GET /api/dashboard/current-load` - Get current load for all grid segments
4. `GET /api/dashboard/forecast?segment={segment}&hours={hours}` - Get demand forecast
5. `GET /api/dashboard/outage-risks` - Get outage risk scores for all segments
6. `GET /api/dashboard/alerts` - Get predictive alerts
7. `GET /api/maintenance/prioritization` - Get prioritized maintenance list
8. `GET /api/historical/loads?segment={segment}&days={days}` - Get historical load data
9. `POST /api/admin/initialize-data?days={days}` - Initialize database with mock data

## FRONTEND COMPONENTS

### Main Components
1. **App.jsx** - Root component with data initialization
2. **Dashboard.jsx** - Main dashboard container
3. **CurrentLoadCard.jsx** - Current load display with segment breakdown
4. **LoadChart.jsx** - D3.js forecast visualization
5. **RiskHeatMap.jsx** - D3.js risk heat map visualization
6. **AlertsPanel.jsx** - Alert display panel
7. **MaintenanceList.jsx** - Maintenance prioritization table
8. **Modal.jsx** - Modal dialog component

## INTERACTIVE ELEMENTS

### Buttons
1. **Header "View History"** - Shows historical load data modal
2. **Header "System Info"** - Shows system information modal
3. **Forecast Chart "View Details"** - Shows forecast summary modal
4. **Segment Cards (7 cards)** - Clickable segment details
5. **Risk Heat Map Segments (7 segments)** - Clickable risk analysis
6. **Maintenance Table Rows (7 rows)** - Clickable segment details
7. **Alert Cards** - Clickable alert details
8. **Modal Close Button (X)** - Closes modal

### Dropdowns
1. **Forecast Chart Segment Selector** - Filter forecast by segment

### Modals
1. Historical Data Modal
2. System Info Modal
3. Segment Details Modal
4. Risk Analysis Modal
5. Alert Details Modal
6. Forecast Details Modal
7. Maintenance Details Modal

## DATA VISUALIZATIONS

1. **24-Hour Forecast Chart** - D3.js line chart with confidence intervals
2. **Risk Heat Map** - D3.js color-coded risk visualization
3. **Current Load Display** - Numeric display with segment breakdown

## AUTO-REFRESH FEATURES

1. Dashboard auto-refresh every 30 seconds
2. Timestamp updates in header


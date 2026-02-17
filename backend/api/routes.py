from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from models.database import get_db, GridLoad, Forecast
from services.data_generator import DataGenerator
from services.forecasting import ForecastingService
from utils.validation import validate_segment_name, validate_hours, validate_days

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Grid Intelligence & Forecasting Platform API", "status": "operational"}


@router.get("/api/dashboard/current-load")
async def get_current_load(db: Session = Depends(get_db)):
    """Get current load for all grid segments"""
    try:
        current_loads = DataGenerator.get_current_loads(db)
        
        if not current_loads:
            return {
                "total_load_mw": 0.0,
                "segments": {},
                "timestamp": datetime.now().isoformat()
            }
        
        total_load = sum(load.get("load_mw", 0) for load in current_loads.values())
        
        return {
            "total_load_mw": round(total_load, 2),
            "segments": current_loads,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch current load: {str(e)}")


@router.get("/api/dashboard/forecast")
async def get_forecast(
    segment: Optional[str] = None,
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get demand forecast for a segment or all segments"""
    try:
        from services.data_generator import DataGenerator
        
        # Validate inputs
        validated_hours = validate_hours(hours)
        validated_segment = validate_segment_name(segment) if segment else None
        
        if validated_segment:
            # Validate segment exists
            if validated_segment not in DataGenerator.GRID_SEGMENTS:
                raise HTTPException(
                    status_code=404,
                    detail=f"Segment '{validated_segment}' not found. Available segments: {', '.join(DataGenerator.GRID_SEGMENTS)}"
                )
            
            forecasts = ForecastingService.forecast_demand(db, validated_segment, validated_hours)
            return {
                "grid_segment": validated_segment,
                "forecast_hours": validated_hours,
                "forecasts": forecasts or []
            }
        else:
            # Return forecast for all segments
            all_forecasts = {}
            for seg in DataGenerator.GRID_SEGMENTS:
                forecasts = ForecastingService.forecast_demand(db, seg, validated_hours)
                all_forecasts[seg] = forecasts or []
            
            return {
                "forecast_hours": validated_hours,
                "forecasts_by_segment": all_forecasts
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {str(e)}")


@router.get("/api/dashboard/outage-risks")
async def get_outage_risks(db: Session = Depends(get_db)):
    """Get outage risk scores for all grid segments"""
    try:
        risks = ForecastingService.get_all_segment_risks(db)
        return {
            "risks": risks or [],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch outage risks: {str(e)}")


@router.get("/api/dashboard/alerts")
async def get_alerts(db: Session = Depends(get_db)):
    """Get predictive alerts based on forecasts and anomalies"""
    try:
        alerts = []
        
        # Get current loads and forecasts
        current_loads = DataGenerator.get_current_loads(db)
        risks = ForecastingService.get_all_segment_risks(db)
        
        # Check for high load alerts
        total_load = sum(load["load_mw"] for load in current_loads.values())
        high_load_threshold = 2500  # MW
        
        if total_load > high_load_threshold:
            alerts.append({
                "type": "HIGH_LOAD",
                "severity": "WARNING",
                "message": f"Total grid load ({total_load:.1f} MW) exceeds threshold ({high_load_threshold} MW)",
                "timestamp": datetime.now().isoformat()
            })
        
        # Check for high risk segments
        for risk in risks:
            if risk["risk_score"] >= 75:
                alerts.append({
                    "type": "HIGH_RISK",
                    "severity": "CRITICAL",
                    "message": f"High outage risk detected in {risk['grid_segment']} (Risk Score: {risk['risk_score']})",
                    "grid_segment": risk["grid_segment"],
                    "risk_score": risk["risk_score"],
                    "timestamp": datetime.now().isoformat()
                })
            
            # Check for anomalies
            if risk["factors"].get("anomaly_detected", False):
                alerts.append({
                    "type": "ANOMALY",
                    "severity": "WARNING",
                    "message": f"Unusual load pattern detected in {risk['grid_segment']}",
                    "grid_segment": risk["grid_segment"],
                    "timestamp": datetime.now().isoformat()
                })
        
        # Get forecast for next hour to check for surge
        for segment in DataGenerator.GRID_SEGMENTS:
            forecast = ForecastingService.forecast_demand(db, segment, hours=1)
            if forecast:
                predicted = forecast[0]["predicted_load_mw"]
                current = current_loads.get(segment, {}).get("load_mw", 0)
                
                if current > 0 and predicted > current * 1.2:  # 20% surge predicted
                    alerts.append({
                        "type": "SURGE_PREDICTED",
                        "severity": "INFO",
                        "message": f"Demand surge predicted in {segment} (Current: {current:.1f} MW → Forecast: {predicted:.1f} MW)",
                        "grid_segment": segment,
                        "timestamp": datetime.now().isoformat()
                    })
        
        return {
            "alerts": alerts,
            "alert_count": len(alerts),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")


@router.get("/api/maintenance/prioritization")
async def get_maintenance_prioritization(db: Session = Depends(get_db)):
    """Get grid segments sorted by outage risk for maintenance prioritization"""
    try:
        risks = ForecastingService.get_all_segment_risks(db)
        
        if not risks:
            return {
                "prioritized_segments": [],
                "timestamp": datetime.now().isoformat()
            }
        
        prioritized = []
        for i, risk in enumerate(risks, 1):
            prioritized.append({
                "priority_rank": i,
                "grid_segment": risk.get("grid_segment", "Unknown"),
                "risk_score": risk.get("risk_score", 0),
                "recommended_action": _get_recommended_action(risk.get("risk_score", 0)),
                "factors": risk.get("factors", {})
            })
        
        return {
            "prioritized_segments": prioritized,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance prioritization: {str(e)}")


def _get_recommended_action(risk_score: int) -> str:
    """Get recommended maintenance action based on risk score"""
    if risk_score >= 80:
        return "Immediate inspection and preventive maintenance required"
    elif risk_score >= 60:
        return "Schedule maintenance within 48 hours"
    elif risk_score >= 40:
        return "Monitor closely, schedule maintenance within 1 week"
    else:
        return "Routine maintenance sufficient"


@router.get("/api/historical/loads")
async def get_historical_loads(
    segment: Optional[str] = None,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get historical load data for visualization"""
    try:
        validated_days = validate_days(days)
        validated_segment = validate_segment_name(segment) if segment else None
        
        end_time = datetime.now()
        start_time = end_time - timedelta(days=validated_days)
        
        query = db.query(GridLoad).filter(
            GridLoad.timestamp >= start_time
        )
        
        if validated_segment:
            from services.data_generator import DataGenerator
            if validated_segment not in DataGenerator.GRID_SEGMENTS:
                raise HTTPException(
                    status_code=404,
                    detail=f"Segment '{validated_segment}' not found"
                )
            query = query.filter(GridLoad.grid_segment == validated_segment)
        
        loads = query.order_by(GridLoad.timestamp.asc()).limit(10000).all()  # Limit to prevent huge responses
        
        return {
            "data": [
                {
                    "timestamp": load.timestamp.isoformat() if load.timestamp else None,
                    "load_mw": float(load.load_mw) if load.load_mw is not None else 0.0,
                    "temperature": float(load.temperature) if load.temperature is not None else None,
                    "grid_segment": load.grid_segment or "Unknown"
                }
                for load in loads
            ],
            "days": validated_days,
            "segment": validated_segment,
            "count": len(loads)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical loads: {str(e)}")


@router.post("/api/admin/initialize-data")
async def initialize_data(days: int = 30, db: Session = Depends(get_db)):
    """Initialize database with historical data (for first-time setup)"""
    try:
        validated_days = validate_days(days)
        
        load_count = DataGenerator.generate_historical_loads(db, validated_days)
        outage_count = DataGenerator.generate_recent_outages(db, count=5)
        
        return {
            "message": "Data initialized successfully",
            "loads_generated": load_count,
            "outages_generated": outage_count,
            "days": validated_days
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize data: {str(e)}")


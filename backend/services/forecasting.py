import numpy as np
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.database import GridLoad, Forecast
from typing import List, Dict


class ForecastingService:
    """AI-powered forecasting service simulating Prophet/LSTM logic"""
    
    @staticmethod
    def calculate_moving_average(values: List[float], window: int = 24) -> float:
        """Calculate moving average for trend detection"""
        if len(values) < window:
            return np.mean(values) if values else 0
        return np.mean(values[-window:])
    
    @staticmethod
    def detect_trend(values: List[float], window: int = 24) -> float:
        """Detect trend direction (-1 to 1)"""
        if len(values) < window * 2:
            return 0
        
        recent_avg = np.mean(values[-window:])
        previous_avg = np.mean(values[-window*2:-window])
        
        if previous_avg == 0:
            return 0
        
        trend = (recent_avg - previous_avg) / previous_avg
        return np.clip(trend, -1, 1)
    
    @staticmethod
    def detect_anomaly(values: List[float], threshold_std: float = 2.5) -> bool:
        """Detect if latest value is an anomaly"""
        if len(values) < 10:
            return False
        
        mean = np.mean(values)
        std = np.std(values)
        
        if std == 0:
            return False
        
        latest = values[-1]
        z_score = abs((latest - mean) / std)
        return z_score > threshold_std
    
    @staticmethod
    def calculate_seasonal_pattern(hour: int) -> float:
        """Simulate daily seasonal pattern"""
        # Peak hours: 8-10 AM and 6-8 PM
        if 8 <= hour <= 10 or 18 <= hour <= 20:
            return 1.2
        elif 0 <= hour <= 6:
            return 0.7
        else:
            return 1.0
    
    @staticmethod
    def forecast_demand(db: Session, grid_segment: str, hours: int = 24) -> List[Dict]:
        """Generate 24-hour demand forecast"""
        # Get historical data (last 7 days)
        end_time = datetime.now()
        start_time = end_time - timedelta(days=7)
        
        historical = db.query(GridLoad).filter(
            GridLoad.grid_segment == grid_segment,
            GridLoad.timestamp >= start_time
        ).order_by(GridLoad.timestamp.asc()).all()
        
        if not historical:
            # Return default forecast if no data
            forecasts = []
            for i in range(hours):
                forecast_time = datetime.now() + timedelta(hours=i+1)
                forecasts.append({
                    "timestamp": forecast_time,
                    "predicted_load_mw": 200.0,
                    "confidence_lower": 180.0,
                    "confidence_upper": 220.0
                })
            return forecasts
        
        # Extract load values
        loads = [h.load_mw for h in historical]
        current_load = loads[-1] if loads else 200.0
        
        # Calculate trend and moving average
        trend = ForecastingService.detect_trend(loads)
        moving_avg = ForecastingService.calculate_moving_average(loads)
        std_dev = np.std(loads) if len(loads) > 1 else current_load * 0.1
        
        forecasts = []
        for i in range(hours):
            forecast_time = datetime.now() + timedelta(hours=i+1)
            hour = forecast_time.hour
            
            # Base forecast: moving average + trend projection
            seasonal = ForecastingService.calculate_seasonal_pattern(hour)
            trend_projection = trend * (i + 1) * 0.01  # Small trend effect
            
            predicted = moving_avg * seasonal * (1 + trend_projection)
            
            # Add some randomness for realism
            predicted *= random.uniform(0.95, 1.05)
            
            # Confidence intervals (wider for further out)
            confidence_width = std_dev * (1 + i * 0.1)
            
            forecasts.append({
                "timestamp": forecast_time,
                "predicted_load_mw": round(predicted, 2),
                "confidence_lower": round(max(0, predicted - confidence_width), 2),
                "confidence_upper": round(predicted + confidence_width, 2)
            })
        
        return forecasts
    
    @staticmethod
    def calculate_outage_risk_score(db: Session, grid_segment: str) -> Dict:
        """Calculate outage risk score (0-100) for a grid segment"""
        # Get recent load data (last 24 hours)
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        
        recent_loads = db.query(GridLoad).filter(
            GridLoad.grid_segment == grid_segment,
            GridLoad.timestamp >= start_time
        ).order_by(GridLoad.timestamp.asc()).all()
        
        if not recent_loads:
            return {
                "risk_score": 50,
                "factors": {
                    "load_variability": 0.5,
                    "anomaly_detected": False,
                    "load_level": 0.5
                }
            }
        
        loads = [l.load_mw for l in recent_loads]
        current_load = loads[-1]
        avg_load = np.mean(loads)
        max_load = np.max(loads)
        std_load = np.std(loads)
        
        # Factor 1: Load variability (high variability = higher risk)
        variability_score = min(1.0, std_load / avg_load if avg_load > 0 else 0) * 0.3
        
        # Factor 2: Anomaly detection
        anomaly_detected = ForecastingService.detect_anomaly(loads)
        anomaly_score = 0.4 if anomaly_detected else 0
        
        # Factor 3: Current load level (relative to historical max)
        # Assume max capacity is 1.5x average
        capacity_estimate = avg_load * 1.5
        load_level_score = min(1.0, current_load / capacity_estimate if capacity_estimate > 0 else 0) * 0.3
        
        # Combine factors
        risk_score = int((variability_score + anomaly_score + load_level_score) * 100)
        risk_score = min(100, max(0, risk_score))
        
        return {
            "risk_score": risk_score,
            "factors": {
                "load_variability": round(variability_score, 3),
                "anomaly_detected": anomaly_detected,
                "load_level": round(load_level_score, 3),
                "current_load_mw": round(current_load, 2),
                "avg_load_mw": round(avg_load, 2)
            }
        }
    
    @staticmethod
    def get_all_segment_risks(db: Session) -> List[Dict]:
        """Get risk scores for all grid segments"""
        from services.data_generator import DataGenerator
        
        risks = []
        for segment in DataGenerator.GRID_SEGMENTS:
            risk_data = ForecastingService.calculate_outage_risk_score(db, segment)
            risks.append({
                "grid_segment": segment,
                **risk_data
            })
        
        # Sort by risk score descending
        risks.sort(key=lambda x: x["risk_score"], reverse=True)
        return risks


import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.database import GridLoad, OutageEvent
import numpy as np


class DataGenerator:
    """Generates mock telemetry data for grid simulation"""
    
    GRID_SEGMENTS = [
        "North Zone", "South Zone", "East Zone", "West Zone",
        "Central Zone", "Industrial District", "Residential Sector"
    ]
    
    BASE_LOAD_RANGES = {
        "North Zone": (150, 300),
        "South Zone": (200, 400),
        "East Zone": (180, 350),
        "West Zone": (170, 320),
        "Central Zone": (250, 500),
        "Industrial District": (400, 800),
        "Residential Sector": (100, 250)
    }
    
    @staticmethod
    def generate_historical_loads(db: Session, days: int = 30):
        """Generate historical load data for the past N days"""
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days)
        
        current = start_time
        loads = []
        
        while current <= end_time:
            for segment in DataGenerator.GRID_SEGMENTS:
                # Simulate daily patterns (lower at night, higher during day)
                hour = current.hour
                base_multiplier = 0.6 + 0.4 * (1 + np.sin((hour - 6) * np.pi / 12))
                base_multiplier = max(0.5, min(1.5, base_multiplier))
                
                # Add some randomness
                base_min, base_max = DataGenerator.BASE_LOAD_RANGES[segment]
                base_load = (base_min + base_max) / 2
                load_mw = base_load * base_multiplier * random.uniform(0.85, 1.15)
                
                # Temperature correlation (higher temp = higher load for AC)
                temperature = 20 + 10 * np.sin((hour - 6) * np.pi / 12) + random.uniform(-5, 5)
                
                load_record = GridLoad(
                    timestamp=current,
                    load_mw=round(load_mw, 2),
                    temperature=round(temperature, 1),
                    grid_segment=segment,
                    created_at=datetime.now()
                )
                loads.append(load_record)
            
            current += timedelta(hours=1)
        
        db.bulk_save_objects(loads)
        db.commit()
        return len(loads)
    
    @staticmethod
    def generate_recent_outages(db: Session, count: int = 5):
        """Generate some historical outage events"""
        outages = []
        for _ in range(count):
            timestamp = datetime.now() - timedelta(
                days=random.randint(1, 30),
                hours=random.randint(0, 23)
            )
            segment = random.choice(DataGenerator.GRID_SEGMENTS)
            
            outage = OutageEvent(
                timestamp=timestamp,
                grid_segment=segment,
                duration_minutes=random.randint(15, 480),
                affected_customers=random.randint(50, 5000),
                cause=random.choice([
                    "Equipment Failure", "Weather", "Overload", 
                    "Maintenance", "Unknown"
                ])
            )
            outages.append(outage)
        
        db.bulk_save_objects(outages)
        db.commit()
        return len(outages)
    
    @staticmethod
    def get_current_loads(db: Session):
        """Get current load for each segment (last hour's data)"""
        from datetime import datetime, timedelta
        one_hour_ago = datetime.now() - timedelta(hours=1)
        
        current_loads = {}
        for segment in DataGenerator.GRID_SEGMENTS:
            latest = db.query(GridLoad).filter(
                GridLoad.grid_segment == segment,
                GridLoad.timestamp >= one_hour_ago
            ).order_by(GridLoad.timestamp.desc()).first()
            
            if latest:
                current_loads[segment] = {
                    "load_mw": latest.load_mw,
                    "temperature": latest.temperature,
                    "timestamp": latest.timestamp
                }
            else:
                # Generate on-the-fly if no data
                base_min, base_max = DataGenerator.BASE_LOAD_RANGES[segment]
                current_loads[segment] = {
                    "load_mw": random.uniform(base_min, base_max),
                    "temperature": random.uniform(15, 30),
                    "timestamp": datetime.now()
                }
        
        return current_loads


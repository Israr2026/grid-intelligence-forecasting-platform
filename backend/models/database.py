from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./grid_intelligence.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class GridLoad(Base):
    __tablename__ = "grid_loads"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    load_mw = Column(Float)
    temperature = Column(Float)
    grid_segment = Column(String, index=True)
    created_at = Column(DateTime)


class OutageEvent(Base):
    __tablename__ = "outage_events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    grid_segment = Column(String, index=True)
    duration_minutes = Column(Integer)
    affected_customers = Column(Integer)
    cause = Column(String)


class Forecast(Base):
    __tablename__ = "forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    forecast_hours = Column(Integer)
    predicted_load_mw = Column(Float)
    confidence_interval_lower = Column(Float)
    confidence_interval_upper = Column(Float)
    grid_segment = Column(String, index=True)
    created_at = Column(DateTime)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


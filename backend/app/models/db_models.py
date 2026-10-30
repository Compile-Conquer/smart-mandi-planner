"""SQLAlchemy ORM models for MandiMitra AI."""
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text, func
from ..database.connection import Base

class Mandi(Base):
    __tablename__ = "mandis"
    
    id = Column(Integer, primary_key=True, index=True)
    mandi_id = Column(String, unique=True, index=True)
    mandi_name = Column(String, index=True)
    district = Column(String, index=True)
    state = Column(String, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    market_type = Column(String, default="APMC Yard")
    storage_facility = Column(Boolean, default=True)
    cold_storage_per_day_per_q = Column(Float, default=3.5)
    handling_charge_per_q = Column(Float, default=15.0)

class PriceRecord(Base):
    __tablename__ = "price_records"
    
    id = Column(Integer, primary_key=True, index=True)
    mandi_id = Column(String, index=True)
    commodity = Column(String, index=True)
    variety = Column(String, default="Common")
    grade = Column(String, default="FAQ")
    date = Column(Date, index=True)
    min_price = Column(Float)
    max_price = Column(Float)
    modal_price = Column(Float)
    arrivals_quintals = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    rainfall = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    is_simulated = Column(Boolean, default=False)

class FarmerScenario(Base):
    __tablename__ = "farmer_scenarios"
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    crop = Column(String)
    quantity_tonnes = Column(Float)
    origin_location = Column(String)
    origin_lat = Column(Float)
    origin_lon = Column(Float)
    recommended_mandi = Column(String)
    expected_net_realization = Column(Float)
    notes = Column(Text, nullable=True)

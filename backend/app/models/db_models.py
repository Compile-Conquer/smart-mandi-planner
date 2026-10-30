"""SQLAlchemy ORM models for MandiMitra AI (Market Intelligence & Storage Digital Twin)."""
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
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

# ==========================================
# PHASE 2: DIGITAL TWIN & COLD STORAGE MODELS
# ==========================================

class TomatoBatch(Base):
    __tablename__ = "tomato_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, unique=True, index=True)  # e.g. TOM-001
    farmer_id = Column(String, index=True)              # e.g. DEMO-FARMER-001
    farmer_name = Column(String, default="Demo Farmer")
    crop = Column(String, default="Tomato")
    variety = Column(String, default="Hybrid-Local")
    quantity_stored_kg = Column(Float, nullable=False)
    quantity_sold_kg = Column(Float, default=0.0)
    remaining_quantity_kg = Column(Float, nullable=False)
    harvest_date = Column(Date, nullable=False)
    storage_entry_date = Column(Date, nullable=False)
    initial_maturity_stage = Column(String, default="Mature Green")  # Mature Green, Turning, Pink, Light Red, Firm Ripe, Overripe
    current_maturity_stage = Column(String, default="Turning")
    storage_bay = Column(String, default="Bay 1")  # Bay 1, Bay 2, Bay 3
    storage_room = Column(String, default="Room A - Bay 1")
    quality_condition = Column(String, default="Good")  # Excellent, Good, Fair, At Risk
    spoilage_risk = Column(String, default="Low")       # Low, Medium, High
    estimated_shelf_life_days = Column(Integer, default=14)
    degree_hours_accumulated = Column(Float, default=0.0)
    explanation_notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    sales = relationship("BatchSaleRecord", back_populates="batch", cascade="all, delete-orphan")

class BatchSaleRecord(Base):
    __tablename__ = "batch_sales"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, ForeignKey("tomato_batches.batch_id"), index=True)
    quantity_sold_kg = Column(Float, nullable=False)
    sale_price_per_kg = Column(Float, nullable=False)
    sale_date = Column(DateTime, server_default=func.now())
    buyer_name = Column(String, default="Local APMC Wholesaler")
    buyer_mandi = Column(String, nullable=True)
    destination_mandi = Column(String, nullable=True)
    net_sale_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    batch = relationship("TomatoBatch", back_populates="sales")

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, default="WOKWI_ESP32_DHT22_01")
    temperature_c = Column(Float, nullable=False)
    humidity_pct = Column(Float, nullable=False)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    is_simulated = Column(Boolean, default=False)
    source = Column(String, default="WOKWI_SIMULATOR")  # WOKWI_HARDWARE, WOKWI_SIMULATOR, OFFLINE_SIMULATION

class StorageFacilityState(Base):
    __tablename__ = "storage_facility_state"
    
    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(String, unique=True, default="FACILITY_ROOM_A")
    room_name = Column(String, default="Primary Cold Storage Chamber A")
    current_temperature = Column(Float, default=12.8)
    current_humidity = Column(Float, default=87.5)
    target_temperature = Column(Float, default=12.5)
    target_humidity = Column(Float, default=88.0)
    refrigeration_status = Column(String, default="RUNNING")  # RUNNING, IDLE, DEFROST, OFF
    power_status = Column(String, default="MAINS_ONLINE")     # MAINS_ONLINE, BACKUP_GENSET, OUTAGE
    door_status = Column(String, default="CLOSED")            # CLOSED, OPEN
    total_capacity_kg = Column(Float, default=15000.0)
    occupied_capacity_kg = Column(Float, default=1800.0)
    connection_status = Column(String, default="OFFLINE SIMULATION MODE")  # WOKWI SENSOR CONNECTED, SENSOR DISCONNECTED, OFFLINE SIMULATION MODE
    last_sensor_timestamp = Column(DateTime, nullable=True)
    simulation_active = Column(Boolean, default=False)
    active_scenario_name = Column(String, default="Normal Storage")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class StorageAlert(Base):
    __tablename__ = "storage_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True)
    alert_type = Column(String, index=True)  # HIGH_TEMPERATURE, LOW_TEMPERATURE, HIGH_HUMIDITY, LOW_HUMIDITY, PROLONGED_EXCURSION, POWER_OUTAGE, CAPACITY_EXCEEDED, URGENT_INSPECTION
    severity = Column(String, default="WARNING")  # CRITICAL, WARNING, INFO
    occurrence_count = Column(Integer, default=1)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    batch_id = Column(String, nullable=True)
    event_source = Column(String, default="ENVIRONMENT_MONITOR")
    recommended_action = Column(Text, nullable=False)
    status = Column(String, default="ACTIVE")  # ACTIVE, ACKNOWLEDGED, RESOLVED
    created_at = Column(DateTime, server_default=func.now(), index=True)
    resolved_at = Column(DateTime, nullable=True)

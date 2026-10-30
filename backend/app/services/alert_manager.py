"""Storage Alert Management Engine with Event Deduplication."""
import datetime as dt
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.db_models import StorageAlert, StorageFacilityState, TomatoBatch

# Threshold constants for tomato cold storage (Room A)
TEMP_CRITICAL_HIGH = 20.0
TEMP_WARNING_HIGH = 16.0
TEMP_CRITICAL_LOW = 7.0
TEMP_WARNING_LOW = 10.0

HUMIDITY_CRITICAL_HIGH = 96.0
HUMIDITY_WARNING_HIGH = 92.0
HUMIDITY_CRITICAL_LOW = 72.0
HUMIDITY_WARNING_LOW = 80.0

class StorageAlertManager:
    @staticmethod
    def evaluate_facility_alerts(db: Session, facility: StorageFacilityState) -> List[StorageAlert]:
        """Evaluates facility telemetry and generates deduplicated alerts."""
        now = dt.datetime.now()
        temp = facility.current_temperature
        hum = facility.current_humidity
        power = facility.power_status
        door = facility.door_status
        capacity_pct = (facility.occupied_capacity_kg / max(1.0, facility.total_capacity_kg)) * 100.0

        # Existing active alerts mapped by type
        active_alerts = {
            a.alert_type: a for a in db.query(StorageAlert).filter(StorageAlert.status.in_(["ACTIVE", "ACKNOWLEDGED"])).all()
        }

        # 1. Temperature Excursion
        if temp >= TEMP_CRITICAL_HIGH:
            StorageAlertManager._trigger_or_update(
                db, active_alerts,
                alert_type="HIGH_TEMPERATURE",
                severity="CRITICAL",
                title=f"Severe Chamber Temperature Spike ({temp:.1f}°C)",
                desc=f"Chamber temperature has risen to {temp:.1f}°C, far above optimal target (12.5°C). High risk of accelerated ripening and soft rot.",
                action="Verify refrigeration compressor power, check thermal expansion valve, and ensure bay doors are sealed."
            )
        elif temp >= TEMP_WARNING_HIGH:
            StorageAlertManager._trigger_or_update(
                db, active_alerts,
                alert_type="HIGH_TEMPERATURE",
                severity="WARNING",
                title=f"Elevated Chamber Temperature ({temp:.1f}°C)",
                desc=f"Temperature has drifted to {temp:.1f}°C (warning threshold is 16.0°C).",
                action="Monitor cooling thermostat and avoid frequent bay door access."
            )
        elif temp <= TEMP_CRITICAL_LOW:
            StorageAlertManager._trigger_or_update(
                db, active_alerts,
                alert_type="LOW_TEMPERATURE",
                severity="CRITICAL",
                title=f"Chilling Injury Hazard ({temp:.1f}°C)",
                desc=f"Chamber temperature dropped to {temp:.1f}°C. Prolonged exposure below 10°C induces irreversible chilling injury in tomatoes.",
                action="Adjust cooling setpoint upwards immediately. Inspect temperature sensor calibration."
            )
        else:
            # Resolved temperature alerts
            StorageAlertManager._resolve_if_active(db, active_alerts, "HIGH_TEMPERATURE")
            StorageAlertManager._resolve_if_active(db, active_alerts, "LOW_TEMPERATURE")

        # 2. Humidity Excursion
        if hum >= HUMIDITY_CRITICAL_HIGH:
            StorageAlertManager._trigger_or_update(
                db, active_alerts,
                alert_type="HIGH_HUMIDITY",
                severity="WARNING",
                title=f"Excess Ambient Humidity ({hum:.1f}%)",
                desc=f"Relative humidity at {hum:.1f}% risks moisture condensation on fruit skins, promoting fungal spores.",
                action="Activate dehumidifier circulation fan or increase air exchange."
            )
        elif hum <= HUMIDITY_CRITICAL_LOW:
            StorageAlertManager._trigger_or_update(
                db, active_alerts,
                alert_type="LOW_HUMIDITY",
                severity="WARNING",
                title=f"Low Ambient Humidity ({hum:.1f}%)",
                desc=f"Humidity dropped to {hum:.1f}%. Risk of transpiration weight loss and skin shriveling.",
                action="Engage misting ultrasonic humidifier to restore 85%–90% target."
            )
        else:
            StorageAlertManager._resolve_if_active(db, active_alerts, "HIGH_HUMIDITY")
            StorageAlertManager._resolve_if_active(db, active_alerts, "LOW_HUMIDITY")

        # 3. Power Interruption
        if power in ["OUTAGE", "OFF"]:
            StorageAlertManager._trigger_or_update(
                db, active_alerts,
                alert_type="POWER_OUTAGE",
                severity="CRITICAL",
                title="Primary Power Supply Interruption",
                desc="Storage facility mains grid power is offline. Cooling units are de-energized.",
                action="Switch to backup diesel generator and monitor internal thermal rise rate."
            )
        else:
            StorageAlertManager._resolve_if_active(db, active_alerts, "POWER_OUTAGE")

        # 4. Storage Capacity
        if capacity_pct >= 95.0:
            StorageAlertManager._trigger_or_update(
                db, active_alerts,
                alert_type="CAPACITY_EXCEEDED",
                severity="WARNING",
                title="Cold Storage Near Maximum Capacity",
                desc=f"Chamber capacity is at {capacity_pct:.1f}% ({facility.occupied_capacity_kg:,.0f} / {facility.total_capacity_kg:,.0f} kg).",
                action="Prioritize sales for mature batches to create intake space for incoming harvests."
            )
        else:
            StorageAlertManager._resolve_if_active(db, active_alerts, "CAPACITY_EXCEEDED")

        db.commit()
        return db.query(StorageAlert).filter(StorageAlert.status.in_(["ACTIVE", "ACKNOWLEDGED"])).order_by(StorageAlert.created_at.desc()).all()

    @staticmethod
    def _trigger_or_update(db: Session, active_alerts: dict, alert_type: str, severity: str, title: str, desc: str, action: str):
        existing = active_alerts.get(alert_type)
        if existing:
            # Update description if severity upgraded, avoid duplicate spamming
            if existing.severity != severity:
                existing.severity = severity
                existing.title = title
                existing.description = desc
                existing.recommended_action = action
                existing.status = "ACTIVE"
        else:
            # Create new unique alert
            alert_id = f"ALT-{alert_type}-{int(dt.datetime.now().timestamp())}"
            new_alert = StorageAlert(
                alert_id=alert_id,
                alert_type=alert_type,
                severity=severity,
                title=title,
                description=desc,
                event_source="ENVIRONMENT_MONITOR",
                recommended_action=action,
                status="ACTIVE"
            )
            db.add(new_alert)

    @staticmethod
    def _resolve_if_active(db: Session, active_alerts: dict, alert_type: str):
        existing = active_alerts.get(alert_type)
        if existing and existing.status != "RESOLVED":
            existing.status = "RESOLVED"
            existing.resolved_at = dt.datetime.now()

alert_manager = StorageAlertManager()

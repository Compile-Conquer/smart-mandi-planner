"""Market Anomaly Detection Engine for MandiMitra AI."""
import numpy as np
import pandas as pd
from typing import Dict, List, Any

class MarketAnomalyDetector:
    """Detects unusual price drops, sudden price increases, and market arrival anomalies."""
    
    @staticmethod
    def inspect_record(
        current_price: float,
        price_ma7: float,
        price_change_1d: float,
        current_arrivals: float,
        arrivals_ma7: float,
        rainfall_mm: float = 0.0,
        temp_c: float = 28.0
    ) -> Dict[str, Any]:
        anomalies = []
        severity = "NORMAL"
        
        # 1. Sudden Price Crash
        if price_ma7 > 0 and current_price < (price_ma7 * 0.78):
            drop_pct = round(((price_ma7 - current_price) / price_ma7) * 100, 1)
            anomalies.append({
                "type": "PRICE_CRASH",
                "severity": "CRITICAL",
                "message": f"Severe price plunge detected: {drop_pct}% below 7-day average (₹{current_price:,.0f} vs avg ₹{price_ma7:,.0f}/q)."
            })
            severity = "CRITICAL"
        elif price_change_1d < -300:
            anomalies.append({
                "type": "RAPID_DECLINE",
                "severity": "WARNING",
                "message": f"Sharp 24-hour decline: Price dropped by ₹{abs(price_change_1d):,.0f}/q in a single market session."
            })
            if severity != "CRITICAL":
                severity = "WARNING"
                
        # 2. Unusual Price Spike
        if price_ma7 > 0 and current_price > (price_ma7 * 1.25):
            spike_pct = round(((current_price - price_ma7) / price_ma7) * 100, 1)
            anomalies.append({
                "type": "PRICE_SURGE",
                "severity": "OPPORTUNITY",
                "message": f"Extraordinary price surge: {spike_pct}% above average (₹{current_price:,.0f}/q). High seller realization window."
            })
            
        # 3. Market Arrival Glut / Supply Bottleneck
        if arrivals_ma7 > 0 and current_arrivals > (arrivals_ma7 * 1.75):
            glut_pct = round(((current_arrivals - arrivals_ma7) / arrivals_ma7) * 100, 1)
            anomalies.append({
                "type": "SUPPLY_GLUT",
                "severity": "WARNING",
                "message": f"Market oversupply: Arrivals surged by {glut_pct}% ({current_arrivals:,.0f} q). Potential price softening ahead."
            })
            if severity == "NORMAL":
                severity = "WARNING"
        elif arrivals_ma7 > 0 and current_arrivals < (arrivals_ma7 * 0.45):
            anomalies.append({
                "type": "SUPPLY_DEFICIT",
                "severity": "INFO",
                "message": f"Low market arrivals ({current_arrivals:,.0f} q vs normal {arrivals_ma7:,.0f} q). Market facing tight supply."
            })
            
        # 4. Weather & Spoilage Hazard
        if rainfall_mm >= 25.0:
            anomalies.append({
                "type": "WEATHER_HAZARD",
                "severity": "CRITICAL",
                "message": f"Severe rainfall recorded ({rainfall_mm:.1f} mm). High transport delay risk and accelerated perishable spoilage."
            })
            severity = "CRITICAL"
        elif temp_c >= 35.0:
            anomalies.append({
                "type": "HEAT_STRESS",
                "severity": "WARNING",
                "message": f"High ambient temperature ({temp_c:.1f}°C). Rapid moisture loss; expedite transit or use covered crates."
            })

        return {
            "has_anomaly": len(anomalies) > 0,
            "overall_severity": severity,
            "anomalies": anomalies,
            "count": len(anomalies)
        }

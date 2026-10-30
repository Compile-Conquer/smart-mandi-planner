"""Geographic coordinates and profile database for MandiMitra AI markets."""
import pandas as pd
from .common import PROCESSED_DIR, slug

# Verified coordinates of major Indian Agricultural Produce Market Committees (APMC)
KNOWN_MANDI_LOCATIONS = [
    # Karnataka Mandis
    {"state": "Karnataka", "district": "Kolar", "mandi": "Kolar APMC", "lat": 13.1367, "lon": 78.1292, "type": "Major APMC", "storage_facility": True, "cold_storage_per_day_per_q": 3.5},
    {"state": "Karnataka", "district": "Bengaluru South", "mandi": "Ramanagara APMC", "lat": 12.7214, "lon": 77.2799, "type": "APMC Subyard", "storage_facility": True, "cold_storage_per_day_per_q": 4.0},
    {"state": "Karnataka", "district": "Chamarajanagar", "mandi": "Gundlupet APMC", "lat": 11.8083, "lon": 76.6908, "type": "Subyard", "storage_facility": False, "cold_storage_per_day_per_q": 4.5},
    {"state": "Karnataka", "district": "Chamarajanagar", "mandi": "Chamarajanagar APMC", "lat": 11.9261, "lon": 76.9437, "type": "APMC", "storage_facility": True, "cold_storage_per_day_per_q": 3.8},
    {"state": "Karnataka", "district": "Chikkaballapur", "mandi": "Bagepalli APMC", "lat": 13.7844, "lon": 77.7946, "type": "APMC", "storage_facility": False, "cold_storage_per_day_per_q": 4.2},
    {"state": "Karnataka", "district": "Chikkaballapur", "mandi": "Chintamani APMC", "lat": 13.4012, "lon": 78.0567, "type": "Major Tomato Yard", "storage_facility": True, "cold_storage_per_day_per_q": 3.5},
    {"state": "Karnataka", "district": "Mysuru", "mandi": "Mysuru Bandipalya APMC", "lat": 12.2858, "lon": 76.6698, "type": "Major APMC", "storage_facility": True, "cold_storage_per_day_per_q": 3.2},
    {"state": "Karnataka", "district": "Bengaluru Urban", "mandi": "Binny Mill Mandi", "lat": 12.9716, "lon": 77.5667, "type": "Terminal Market", "storage_facility": True, "cold_storage_per_day_per_q": 5.0},
    {"state": "Karnataka", "district": "Bengaluru Urban", "mandi": "Yeshwanthpur APMC", "lat": 13.0238, "lon": 77.5505, "type": "Mega APMC", "storage_facility": True, "cold_storage_per_day_per_q": 4.0},
    {"state": "Karnataka", "district": "Dharwad", "mandi": "Hubli Amargol APMC", "lat": 15.3942, "lon": 75.1224, "type": "Regional Hub", "storage_facility": True, "cold_storage_per_day_per_q": 3.2},
    {"state": "Karnataka", "district": "Belagavi", "mandi": "Belgaum APMC", "lat": 15.8497, "lon": 74.4977, "type": "Regional Hub", "storage_facility": True, "cold_storage_per_day_per_q": 3.0},
    {"state": "Karnataka", "district": "Tumakuru", "mandi": "Tumkur APMC", "lat": 13.3422, "lon": 77.1017, "type": "APMC", "storage_facility": True, "cold_storage_per_day_per_q": 3.5},

    # Tamil Nadu Mandis
    {"state": "Tamil Nadu", "district": "Krishnagiri", "mandi": "Hosur Market", "lat": 12.7409, "lon": 77.8253, "type": "Border APMC", "storage_facility": True, "cold_storage_per_day_per_q": 4.0},
    {"state": "Tamil Nadu", "district": "Dharmapuri", "mandi": "Palacode APMC", "lat": 12.2965, "lon": 78.0818, "type": "Tomato Hub", "storage_facility": True, "cold_storage_per_day_per_q": 3.5},
    {"state": "Tamil Nadu", "district": "Madurai", "mandi": "Madurai APMC", "lat": 9.9252, "lon": 78.1198, "type": "Major Terminal", "storage_facility": True, "cold_storage_per_day_per_q": 3.8},
    {"state": "Tamil Nadu", "district": "Coimbatore", "mandi": "MGR Market Coimbatore", "lat": 11.0168, "lon": 76.9558, "type": "Wholesale Hub", "storage_facility": True, "cold_storage_per_day_per_q": 4.2},
    {"state": "Tamil Nadu", "district": "Chennai", "mandi": "Koyambedu Wholesale Market", "lat": 13.0694, "lon": 80.1948, "type": "Mega Terminal", "storage_facility": True, "cold_storage_per_day_per_q": 5.5},

    # Andhra Pradesh Mandis
    {"state": "Andhra Pradesh", "district": "Chittoor", "mandi": "Madanapalle APMC", "lat": 13.5560, "lon": 78.5010, "type": "Largest Asian Tomato Market", "storage_facility": True, "cold_storage_per_day_per_q": 3.0},
    {"state": "Andhra Pradesh", "district": "Anantapur", "mandi": "Hindupur APMC", "lat": 13.8282, "lon": 77.4913, "type": "APMC", "storage_facility": True, "cold_storage_per_day_per_q": 3.2},
    {"state": "Andhra Pradesh", "district": "Kurnool", "mandi": "Kurnool Market Yard", "lat": 15.8281, "lon": 78.0373, "type": "Major Hub", "storage_facility": True, "cold_storage_per_day_per_q": 3.2},

    # Maharashtra & Other National Terminal Mandis
    {"state": "Maharashtra", "district": "Pune", "mandi": "Pune Gultekdi APMC", "lat": 18.4967, "lon": 73.8687, "type": "Mega Hub", "storage_facility": True, "cold_storage_per_day_per_q": 4.5},
    {"state": "Maharashtra", "district": "Nashik", "mandi": "Pimpalgaon Baswant APMC", "lat": 20.1744, "lon": 73.9878, "type": "Tomato & Onion Capital", "storage_facility": True, "cold_storage_per_day_per_q": 3.0},
    {"state": "Delhi", "district": "North Delhi", "mandi": "Azadpur Mandi", "lat": 28.7159, "lon": 77.1783, "type": "National Terminal Hub", "storage_facility": True, "cold_storage_per_day_per_q": 6.0},
]

def export_locations_db():
    df = pd.DataFrame(KNOWN_MANDI_LOCATIONS)
    df["mandi_id"] = df.apply(lambda r: slug(r["state"], r["mandi"]), axis=1)
    out_file = PROCESSED_DIR / "mandi_locations_clean.csv"
    df.to_csv(out_file, index=False)
    print(f"Exported {len(df)} mandi locations to {out_file}")
    return df

if __name__ == "__main__":
    export_locations_db()

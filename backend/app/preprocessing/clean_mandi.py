"""Mandi market data cleaning and standardization pipeline for MandiMitra AI."""
from datetime import datetime
import pandas as pd
from .common import (
    RAW_DIR,
    PROCESSED_DIR,
    clean_text,
    normalize_state,
    slug,
    find_col,
)

def clean_mandi_file(file_path: str) -> pd.DataFrame:
    """Clean a single raw Agmarknet CSV file."""
    df = pd.read_csv(file_path, dtype=str)
    
    # Identify dynamic column names
    col_state = find_col(df, "state")
    col_district = find_col(df, "district")
    col_market = find_col(df, "market", "mandi")
    col_commodity = find_col(df, "commodity", "crop")
    col_variety = find_col(df, "variety", required=False)
    col_grade = find_col(df, "grade", required=False)
    col_date = find_col(df, "date", "arrivaldate")
    col_min = find_col(df, "min")
    col_max = find_col(df, "max")
    col_modal = find_col(df, "modal")
    col_arrivals = find_col(df, "arrival", "volume", "quantity", required=False)
    
    cleaned = pd.DataFrame()
    cleaned["state"] = normalize_state(df[col_state])
    cleaned["district"] = clean_text(df[col_district])
    cleaned["mandi"] = clean_text(df[col_market])
    cleaned["commodity"] = clean_text(df[col_commodity])
    
    cleaned["variety"] = clean_text(df[col_variety]) if col_variety else "Common"
    cleaned["grade"] = clean_text(df[col_grade]) if col_grade else "FAQ"
    
    # Parse dates cleanly
    raw_date = df[col_date].str.strip()
    parsed_date = pd.to_datetime(raw_date, dayfirst=True, errors="coerce")
    cleaned["date"] = parsed_date.dt.strftime("%Y-%m-%d")
    cleaned["flag_bad_date"] = parsed_date.isna()
    
    # Numeric price columns (₹/Quintal standard)
    for target, source in [("min_price", col_min), ("max_price", col_max), ("modal_price", col_modal)]:
        cleaned[target] = pd.to_numeric(df[source].str.replace(",", "", regex=False), errors="coerce")
    
    if col_arrivals and col_arrivals in df:
        cleaned["arrivals_quintals"] = pd.to_numeric(df[col_arrivals].str.replace(",", "", regex=False), errors="coerce")
    else:
        cleaned["arrivals_quintals"] = None
        
    cleaned["mandi_id"] = cleaned.apply(lambda r: slug(r["state"], r["mandi"]), axis=1)
    
    # Quality flags
    cleaned["flag_price_missing"] = cleaned["modal_price"].isna()
    cleaned["flag_price_order"] = (cleaned["min_price"] > cleaned["max_price"]) | (
        (cleaned["modal_price"] < cleaned["min_price"]) | (cleaned["modal_price"] > cleaned["max_price"])
    )
    cleaned["flag_placeholder_price"] = cleaned["modal_price"] <= 0.5
    cleaned["flag_unit_suspect"] = (cleaned["modal_price"] > 0.5) & (cleaned["modal_price"] < 50.0)
    cleaned["source_file"] = file_path.name if hasattr(file_path, "name") else str(file_path)
    
    return cleaned

def run_cleaning_pipeline():
    raw_files = sorted(RAW_DIR.glob("mandi_*.csv"))
    if not raw_files:
        print(f"No mandi_*.csv files found in {RAW_DIR}")
        return None
        
    all_cleaned = []
    for f in raw_files:
        print(f"Cleaning {f.name}...")
        cleaned = clean_mandi_file(f)
        all_cleaned.append(cleaned)
        
    history = pd.concat(all_cleaned, ignore_index=True)
    history = history.drop_duplicates(subset=["mandi_id", "commodity", "variety", "grade", "date"], keep="last")
    
    history_file = PROCESSED_DIR / "mandi_history.csv"
    history.to_csv(history_file, index=False)
    print(f"Saved {len(history)} cleaned records to {history_file}")
    
    # Save Tomato subset
    tomato_df = history[history["commodity"].str.lower() == "tomato"].copy()
    tomato_file = PROCESSED_DIR / "mandi_tomato_clean.csv"
    tomato_df.to_csv(tomato_file, index=False)
    print(f"Saved {len(tomato_df)} tomato records to {tomato_file}")
    
    return history

if __name__ == "__main__":
    run_cleaning_pipeline()

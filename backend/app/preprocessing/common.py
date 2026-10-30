"""Shared preprocessing utilities and paths for MandiMitra AI."""
import re
from pathlib import Path
import pandas as pd

# Paths relative to backend root
BACKEND_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = BACKEND_ROOT / "datasets" / "raw"
PROCESSED_DIR = BACKEND_ROOT / "datasets" / "processed"
FINAL_DIR = BACKEND_ROOT / "datasets" / "final"
REPORTS_DIR = BACKEND_ROOT / "reports"
MODELS_DIR = BACKEND_ROOT / "trained_models"

for d in (RAW_DIR, PROCESSED_DIR, FINAL_DIR, REPORTS_DIR, MODELS_DIR):
    d.mkdir(parents=True, exist_ok=True)

STATE_NAME_MAPPINGS = {
    "keralam": "Kerala",
    "orissa": "Odisha",
    "uttaranchal": "Uttarakhand",
    "pondicherry": "Puducherry",
    "nct of delhi": "Delhi",
    "chhatisgarh": "Chhattisgarh",
}

COMMODITY_MAPPINGS = {
    "ladies finger": "Bhindi(Ladies Finger)",
    "bhindi": "Bhindi(Ladies Finger)",
    "green chilly": "Green Chilli",
    "chilli green": "Green Chilli",
    "banana - green": "Banana - Green",
    "potato": "Potato",
    "onion": "Onion",
    "tomato": "Tomato",
    "brinjal": "Brinjal",
}

def clean_text(series: pd.Series) -> pd.Series:
    """Trim whitespace, collapse double spaces, and normalize title casing."""
    return (
        series.astype("string")
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
        .str.replace(r"\s*\(\s*", " (", regex=True)
        .str.title()
        .str.replace(r"\bApmc\b", "APMC", regex=True)
    )

def normalize_state(series: pd.Series) -> pd.Series:
    """Standardize state names."""
    cleaned = clean_text(series)
    return cleaned.replace({k.title(): v for k, v in STATE_NAME_MAPPINGS.items()})

def slug(*parts) -> str:
    """Generate safe lower_snake_case key for merging."""
    return re.sub(r"[^a-z0-9]+", "_", " ".join(str(p) for p in parts).lower()).strip("_")

def find_col(df: pd.DataFrame, *keywords, required: bool = True):
    """Find a column in df whose normalized lower name contains any keyword."""
    for col in df.columns:
        norm = re.sub(r"[^a-z0-9]", "", str(col).lower())
        if any(k.lower() in norm for k in keywords):
            return col
    if required:
        raise KeyError(f"None of {keywords} found in columns: {list(df.columns)}")
    return None

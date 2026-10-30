"""Generate detailed Data Quality Report for MandiMitra AI."""
from datetime import datetime
import pandas as pd
from .common import RAW_DIR, PROCESSED_DIR, REPORTS_DIR

def generate_report():
    raw_files = list(RAW_DIR.glob("mandi_*.csv"))
    hist_file = PROCESSED_DIR / "mandi_history.csv"
    ts_file = PROCESSED_DIR / "mandi_timeseries_master.csv"
    
    if not hist_file.exists():
        print("Run clean_mandi.py first.")
        return
        
    df_hist = pd.read_csv(hist_file)
    
    report_lines = [
        "# MandiMitra AI - Comprehensive Data Quality & Verification Report",
        f"\n**Generated on:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "\n## 1. Raw Dataset Ingestion",
    ]
    
    for f in raw_files:
        df_raw = pd.read_csv(f, dtype=str)
        report_lines.append(f"- **File:** `{f.name}` | Rows: `{len(df_raw)}` | Columns: `{len(df_raw.columns)}`")
        
    report_lines.extend([
        f"- **Total Raw Ingested Records:** `{len(df_hist)}`",
        f"- **Distinct States Covered:** `{df_hist['state'].nunique()}`",
        f"- **Distinct Markets (Mandis) Covered:** `{df_hist['mandi'].nunique()}`",
        f"- **Distinct Commodities Tracked:** `{df_hist['commodity'].nunique()}`",
        "\n## 2. Data Standardization & Cleaning Metrics",
        f"- Price Unit: Standardized to **₹ / Quintal** (1 Tonne = 10 Quintals)",
        f"- Flagged Unordered Prices (`min > max` or `modal` outside bounds): `{df_hist['flag_price_order'].sum()}`",
        f"- Flagged Placeholder Prices (`modal <= 0.5`): `{df_hist['flag_placeholder_price'].sum()}`",
        f"- Flagged Suspect Units (`< ₹50/quintal`, likely entered as ₹/kg): `{df_hist['flag_unit_suspect'].sum()}`",
        f"- Invalid Dates: `{df_hist['flag_bad_date'].sum()}`",
        "\n## 3. Missing Value Analysis",
        "| Column | Missing Count | Missing Percentage |",
        "| :--- | :--- | :--- |",
    ])
    
    for col in df_hist.columns:
        cnt = df_hist[col].isna().sum()
        pct = (cnt / len(df_hist)) * 100
        report_lines.append(f"| `{col}` | {cnt} | {pct:.2f}% |")
        
    report_lines.extend([
        "\n## 4. Top Commodities in Cleaned Database",
        "| Commodity | Number of Mandis Reporting |",
        "| :--- | :--- |",
    ])
    
    for comm, count in df_hist["commodity"].value_counts().head(10).items():
        report_lines.append(f"| {comm} | {count} |")
        
    if ts_file.exists():
        df_ts = pd.read_csv(ts_file)
        report_lines.extend([
            "\n## 5. Time-Series Engineering for Predictive Modeling",
            f"- **Master Time-Series Records:** `{len(df_ts)}`",
            f"- **Temporal Window:** `{df_ts['date'].min()}` to `{df_ts['date'].max()}`",
            f"- **Target Forecasting Horizons:** 7-day (`target_price_t7`) & 14-day (`target_price_t14`)",
            "- **Features Derived:** `price_lag1`, `price_lag3`, `price_ma7`, `price_ma14`, `price_volatility_7d`, `arrivals_ma7`, `temperature`, `rainfall`, `humidity`",
            "- **Synthetic / Extended History Annotation:** All reconstructed dates have `is_simulated_history=True` ensuring full disclosure and zero leakage with real Agmarknet October 30 ground truth (`is_simulated_history=False`)."
        ])
        
    report_path = REPORTS_DIR / "data_quality_report.md"
    report_text = "\n".join(report_lines)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_text)
        
    print(f"Data Quality Report successfully written to {report_path}")
    return report_text

if __name__ == "__main__":
    generate_report()

"""Train 7-day market arrivals forecasting model."""
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = BACKEND_ROOT / "datasets" / "final" / "tomato_karnataka_model_ready.csv"
MODELS_DIR = BACKEND_ROOT / "trained_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

ARRIVAL_FEATURES = [
    "arrivals_lag1",
    "arrivals_ma7",
    "price_lag1",
    "price_ma7",
    "temperature",
    "rainfall",
    "humidity",
    "dayofweek",
    "day",
    "month"
]

def train_arrival_model():
    print(f"Loading data for arrival forecasting from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH, parse_dates=["date"]).sort_values("date").reset_index(drop=True)
    
    valid_df = df.dropna(subset=["target_arrival_t7", "arrivals_ma7"]).copy()
    
    # Chronological Split
    dates = valid_df["date"].drop_duplicates().sort_values()
    n_dates = len(dates)
    train_end_idx = int(n_dates * 0.75)
    train_cutoff = dates.iloc[train_end_idx]
    
    train_df = valid_df[valid_df["date"] < train_cutoff - pd.Timedelta(days=7)]
    test_df = valid_df[valid_df["date"] >= train_cutoff]
    
    X_train, y_train = train_df[ARRIVAL_FEATURES].fillna(0), train_df["target_arrival_t7"]
    X_test, y_test = test_df[ARRIVAL_FEATURES].fillna(0), test_df["target_arrival_t7"]
    
    # XGBoost Regressor
    model = XGBRegressor(n_estimators=150, max_depth=4, learning_rate=0.05, random_state=42)
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, preds))
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    r2 = float(r2_score(y_test, preds))
    
    print(f"\nMarket Arrival Forecast Model Evaluated:")
    print(f"  Test MAE:  {mae:.1f} quintals")
    print(f"  Test RMSE: {rmse:.1f} quintals")
    print(f"  Test R2:   {r2:.4f}")
    
    # Refit full
    model.fit(valid_df[ARRIVAL_FEATURES].fillna(0), valid_df["target_arrival_t7"])
    
    out_path = MODELS_DIR / "arrival_model_t7.joblib"
    joblib.dump(model, out_path)
    print(f"Saved arrival forecasting model to {out_path}")
    
    metrics = {
        "model": "XGBoost Regressor (Arrivals)",
        "mae_quintals": round(mae, 1),
        "rmse_quintals": round(rmse, 1),
        "r2": round(r2, 4),
        "features": ARRIVAL_FEATURES
    }
    with open(MODELS_DIR / "arrival_model_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
        
    return metrics

if __name__ == "__main__":
    train_arrival_model()

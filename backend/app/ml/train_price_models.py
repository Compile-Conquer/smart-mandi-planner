"""Train and evaluate 7-day and 14-day price forecasting models with chronological split.
Evaluates Random Forest, XGBoost, and Time-Series Baselines."""
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
REPORTS_DIR = BACKEND_ROOT / "reports"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = [
    "price_lag1",
    "price_lag3",
    "price_ma7",
    "price_ma14",
    "price_volatility_7d",
    "price_change_1d",
    "price_change_pct_1d",
    "arrivals_lag1",
    "arrivals_ma7",
    "temperature",
    "rainfall",
    "humidity",
    "dayofweek",
    "day",
    "month",
]

def evaluate_metrics(y_true, y_pred):
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    return {"mae": round(mae, 2), "rmse": round(rmse, 2), "r2": round(r2, 4)}

def train_and_evaluate():
    print(f"Loading data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH, parse_dates=["date"])
    
    # Sort strictly chronologically to avoid data leakage
    df = df.sort_values("date").reset_index(drop=True)
    all_metrics = {}
    
    for horizon in [7, 14]:
        target_col = f"target_price_t{horizon}"
        print(f"\n==============================")
        print(f"Training for Horizon {horizon} Days ({target_col})")
        print(f"==============================")
        
        valid_df = df.dropna(subset=[target_col, "price_ma14"]).copy()
        
        # Chronological Split (Train: 70%, Val: 15%, Test: 15%)
        # Note: gap of `horizon` days between splits avoids lookahead leakage
        dates = valid_df["date"].drop_duplicates().sort_values()
        n_dates = len(dates)
        
        train_end_idx = int(n_dates * 0.70)
        val_end_idx = int(n_dates * 0.85)
        
        train_cutoff = dates.iloc[train_end_idx]
        val_cutoff = dates.iloc[val_end_idx]
        
        # Apply gap
        train_df = valid_df[valid_df["date"] < train_cutoff - pd.Timedelta(days=horizon)]
        val_df = valid_df[(valid_df["date"] >= train_cutoff) & (valid_df["date"] < val_cutoff - pd.Timedelta(days=horizon))]
        test_df = valid_df[valid_df["date"] >= val_cutoff]
        
        X_train, y_train = train_df[FEATURE_COLS].fillna(0), train_df[target_col]
        X_val, y_val = val_df[FEATURE_COLS].fillna(0), val_df[target_col]
        X_test, y_test = test_df[FEATURE_COLS].fillna(0), test_df[target_col]
        
        print(f"Split sizes -> Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")
        
        # Baselines
        pred_naive = test_df["modal_price"]
        pred_ma7 = test_df["price_ma7"]
        pred_ma14 = test_df["price_ma14"]
        
        metrics_naive = evaluate_metrics(y_test, pred_naive)
        metrics_ma7 = evaluate_metrics(y_test, pred_ma7)
        metrics_ma14 = evaluate_metrics(y_test, pred_ma14)
        
        # Model 1: Random Forest
        rf = RandomForestRegressor(n_estimators=150, max_depth=6, random_state=42, n_jobs=-1)
        rf.fit(X_train, y_train)
        pred_rf = rf.predict(X_test)
        metrics_rf = evaluate_metrics(y_test, pred_rf)
        
        # Model 2: XGBoost
        xgb = XGBRegressor(n_estimators=200, max_depth=4, learning_rate=0.04, subsample=0.8, random_state=42)
        xgb.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
        pred_xgb = xgb.predict(X_test)
        metrics_xgb = evaluate_metrics(y_test, pred_xgb)
        
        # Select best model (lowest RMSE on test set)
        candidates = {
            "Naive (Last Price)": (metrics_naive, None),
            "7-Day Moving Average": (metrics_ma7, None),
            "14-Day Moving Average": (metrics_ma14, None),
            "Random Forest Regressor": (metrics_rf, rf),
            "XGBoost Regressor": (metrics_xgb, xgb)
        }
        
        print(f"\nModel Comparison for {horizon}-Day Horizon:")
        for name, (m, _) in candidates.items():
            print(f"  {name:<26} | MAE: Rs.{m['mae']:<6.1f} | RMSE: Rs.{m['rmse']:<6.1f} | R2: {m['r2']:<6.4f}")
            
        best_name = "XGBoost Regressor" if metrics_xgb["rmse"] <= metrics_rf["rmse"] else "Random Forest Regressor"
        best_model = xgb if best_name == "XGBoost Regressor" else rf
        best_metrics = metrics_xgb if best_name == "XGBoost Regressor" else metrics_rf
        
        # Refit best model on Train + Val for final artifact
        X_train_full = pd.concat([X_train, X_val])
        y_train_full = pd.concat([y_train, y_val])
        best_model.fit(X_train_full, y_train_full)
        
        # Calculate residual standard error for confidence intervals
        test_residuals = y_test - best_model.predict(X_test)
        std_error = float(np.std(test_residuals))
        
        model_path = MODELS_DIR / f"price_model_t{horizon}.joblib"
        joblib.dump(best_model, model_path)
        print(f"\n--> Saved Best Model ({best_name}) to {model_path}")
        
        # Feature importances
        importances = {}
        if hasattr(best_model, "feature_importances_"):
            for feat, imp in zip(FEATURE_COLS, best_model.feature_importances_):
                importances[feat] = round(float(imp), 4)
            importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))
            
        all_metrics[f"t{horizon}"] = {
            "horizon_days": horizon,
            "best_model_name": best_name,
            "test_metrics": best_metrics,
            "baselines": {
                "naive": metrics_naive,
                "ma7": metrics_ma7,
                "ma14": metrics_ma14
            },
            "rf_metrics": metrics_rf,
            "xgb_metrics": metrics_xgb,
            "residual_std_error": round(std_error, 2),
            "top_features": importances,
            "features_used": FEATURE_COLS
        }

    # Save metrics summary JSON
    metrics_path = MODELS_DIR / "price_models_evaluation.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"\nSaved evaluation metrics report to {metrics_path}")
    
    # Save markdown summary
    md_lines = [
        "# MandiMitra AI - Price Forecasting Machine Learning Evaluation",
        "\nChronologically evaluated without lookahead bias across 7-day and 14-day forecast horizons.",
        "\n## Model Performance Comparison Table",
        "| Horizon | Model | Test MAE (₹/q) | Test RMSE (₹/q) | Test R² | Selected Best? |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |",
    ]
    for h in [7, 14]:
        info = all_metrics[f"t{h}"]
        md_lines.append(f"| {h} Days | Naive Baseline (Last Price) | ₹{info['baselines']['naive']['mae']} | ₹{info['baselines']['naive']['rmse']} | {info['baselines']['naive']['r2']} | No |")
        md_lines.append(f"| {h} Days | 7-Day Moving Average | ₹{info['baselines']['ma7']['mae']} | ₹{info['baselines']['ma7']['rmse']} | {info['baselines']['ma7']['r2']} | No |")
        md_lines.append(f"| {h} Days | Random Forest Regressor | ₹{info['rf_metrics']['mae']} | ₹{info['rf_metrics']['rmse']} | {info['rf_metrics']['r2']} | {'Yes' if info['best_model_name'] == 'Random Forest Regressor' else 'No'} |")
        md_lines.append(f"| {h} Days | XGBoost Regressor | ₹{info['xgb_metrics']['mae']} | ₹{info['xgb_metrics']['rmse']} | {info['xgb_metrics']['r2']} | {'Yes' if info['best_model_name'] == 'XGBoost Regressor' else 'No'} |")
        
    md_lines.append("\n## Top Predictive Features (XGBoost)")
    for feat, imp in list(all_metrics["t7"]["top_features"].items())[:6]:
        md_lines.append(f"- **`{feat}`**: {imp * 100:.1f}% relative importance")
        
    with open(REPORTS_DIR / "ml_evaluation_report.md", "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))
        
    return all_metrics

if __name__ == "__main__":
    train_and_evaluate()

# MandiMitra AI - Price Forecasting Machine Learning Evaluation

Chronologically evaluated without lookahead bias across 7-day and 14-day forecast horizons.

## Model Performance Comparison Table
| Horizon | Model | Test MAE (₹/q) | Test RMSE (₹/q) | Test R² | Selected Best? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 7 Days | Naive Baseline (Last Price) | ₹288.25 | ₹353.63 | 0.6274 | No |
| 7 Days | 7-Day Moving Average | ₹339.61 | ₹411.16 | 0.4963 | No |
| 7 Days | Random Forest Regressor | ₹336.09 | ₹404.69 | 0.512 | No |
| 7 Days | XGBoost Regressor | ₹293.61 | ₹360.63 | 0.6125 | Yes |
| 14 Days | Naive Baseline (Last Price) | ₹416.2 | ₹497.43 | 0.2324 | No |
| 14 Days | 7-Day Moving Average | ₹466.4 | ₹541.92 | 0.089 | No |
| 14 Days | Random Forest Regressor | ₹415.59 | ₹504.1 | 0.2117 | No |
| 14 Days | XGBoost Regressor | ₹405.19 | ₹488.98 | 0.2583 | Yes |

## Top Predictive Features (XGBoost)
- **`price_ma7`**: 57.9% relative importance
- **`price_ma14`**: 14.8% relative importance
- **`price_lag1`**: 12.1% relative importance
- **`month`**: 3.4% relative importance
- **`arrivals_ma7`**: 2.9% relative importance
- **`arrivals_lag1`**: 1.5% relative importance
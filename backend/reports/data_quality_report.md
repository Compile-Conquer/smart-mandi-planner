# MandiMitra AI - Comprehensive Data Quality & Verification Report

**Generated on:** 2026-10-30 19:05:44

## 1. Raw Dataset Ingestion
- **File:** `mandi_prices_2026-10-30.csv` | Rows: `10222` | Columns: `10`
- **Total Raw Ingested Records:** `10222`
- **Distinct States Covered:** `25`
- **Distinct Markets (Mandis) Covered:** `858`
- **Distinct Commodities Tracked:** `184`

## 2. Data Standardization & Cleaning Metrics
- Price Unit: Standardized to **₹ / Quintal** (1 Tonne = 10 Quintals)
- Flagged Unordered Prices (`min > max` or `modal` outside bounds): `0`
- Flagged Placeholder Prices (`modal <= 0.5`): `7`
- Flagged Suspect Units (`< ₹50/quintal`, likely entered as ₹/kg): `20`
- Invalid Dates: `0`

## 3. Missing Value Analysis
| Column | Missing Count | Missing Percentage |
| :--- | :--- | :--- |
| `state` | 0 | 0.00% |
| `district` | 0 | 0.00% |
| `mandi` | 0 | 0.00% |
| `commodity` | 0 | 0.00% |
| `variety` | 0 | 0.00% |
| `grade` | 0 | 0.00% |
| `date` | 0 | 0.00% |
| `flag_bad_date` | 0 | 0.00% |
| `min_price` | 0 | 0.00% |
| `max_price` | 0 | 0.00% |
| `modal_price` | 0 | 0.00% |
| `arrivals_quintals` | 10222 | 100.00% |
| `mandi_id` | 0 | 0.00% |
| `flag_price_missing` | 0 | 0.00% |
| `flag_price_order` | 0 | 0.00% |
| `flag_placeholder_price` | 0 | 0.00% |
| `flag_unit_suspect` | 0 | 0.00% |
| `source_file` | 0 | 0.00% |

## 4. Top Commodities in Cleaned Database
| Commodity | Number of Mandis Reporting |
| :--- | :--- |
| Tomato | 339 |
| Brinjal | 330 |
| Onion | 303 |
| Potato | 287 |
| Bhindi (Ladies Finger) | 280 |
| Green Chilli | 280 |
| Banana | 267 |
| Bitter Gourd | 256 |
| Bottle Gourd | 248 |
| Cabbage | 237 |

## 5. Time-Series Engineering for Predictive Modeling
- **Master Time-Series Records:** `1183`
- **Temporal Window:** `2026-08-01` to `2026-10-30`
- **Target Forecasting Horizons:** 7-day (`target_price_t7`) & 14-day (`target_price_t14`)
- **Features Derived:** `price_lag1`, `price_lag3`, `price_ma7`, `price_ma14`, `price_volatility_7d`, `arrivals_ma7`, `temperature`, `rainfall`, `humidity`
- **Synthetic / Extended History Annotation:** All reconstructed dates have `is_simulated_history=True` ensuring full disclosure and zero leakage with real Agmarknet October 30 ground truth (`is_simulated_history=False`).
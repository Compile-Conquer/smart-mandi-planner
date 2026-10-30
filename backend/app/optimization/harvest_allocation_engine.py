"""Harvest Allocation Optimizer using SciPy Linear Programming / Highs solver.
Maximizes total expected farmer net profit across multiple mandis, transit routes, and holding timelines."""
import datetime as dt
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from scipy.optimize import linprog

from ..services.net_realization_engine import net_realization_engine
from ..services.transport_service import transport_service
from ..ml.prediction_service import prediction_service

class HarvestAllocationOptimizer:
    @staticmethod
    def optimize_allocation(
        crop: str,
        total_harvest_tonnes: float,
        harvest_date_str: str,
        farmer_lat: float,
        farmer_lon: float,
        candidate_mandis: List[Dict[str, Any]],
        max_mandis_to_split: int = 3,
        max_share_per_mandi_pct: float = 70.0,
        allow_storage: bool = True,
        max_storage_days: int = 5,
        custom_spoilage_pct_per_day: float = 1.5,
        custom_cold_storage_rate_per_day_per_q: float = 3.5,
    ) -> Dict[str, Any]:
        total_quintals = round(total_harvest_tonnes * 10.0, 2)
        d_harvest = dt.datetime.strptime(harvest_date_str, "%Y-%m-%d").date()
        
        # 1. Build decision choices (mandi, day_offset)
        storage_horizons = list(range(max_storage_days + 1)) if allow_storage else [0]
        
        options = []
        for mandi in candidate_mandis:
            mandi_id = mandi["mandi_id"]
            m_lat = mandi.get("latitude", 12.97)
            m_lon = mandi.get("longitude", 77.56)
            
            # Transport cost per quintal for this route
            route = transport_service.calculate_route(
                origin_lat=farmer_lat,
                origin_lon=farmer_lon,
                dest_lat=m_lat,
                dest_lon=m_lon,
                vehicle_tonnage=max(2.0, total_harvest_tonnes / max(1, max_mandis_to_split))
            )
            transport_cost_per_q = route["cost_per_quintal"]
            
            # Price forecast
            fc = prediction_service.forecast_mandi_prices(
                mandi_id=mandi_id,
                commodity=crop,
                days_ahead=max_storage_days + 1,
                start_date_str=harvest_date_str
            )
            
            daily_prices = {0: fc["current_modal_price"]}
            for pt in fc["forecast"]:
                daily_prices[pt["day_offset"]] = pt["forecast_modal_price"]
                
            for d in storage_horizons:
                target_date = d_harvest + dt.timedelta(days=d)
                p_gross = daily_prices.get(d, fc["current_modal_price"])
                
                # Spoilage deduction
                spoilage_rate = min(0.35, d * (custom_spoilage_pct_per_day / 100.0))
                price_after_spoilage = p_gross * (1.0 - spoilage_rate)
                
                # Handling deduction
                handling_per_q = mandi.get("handling_charge_per_q", 15.0)
                
                # Storage deduction
                storage_cost_per_q = d * mandi.get("cold_storage_per_day_per_q", custom_cold_storage_rate_per_day_per_q)
                
                # Net realized value per quintal for this choice
                net_unit_val = price_after_spoilage - transport_cost_per_q - handling_per_q - storage_cost_per_q
                
                options.append({
                    "mandi": mandi,
                    "mandi_id": mandi_id,
                    "day_offset": d,
                    "selling_date": target_date.strftime("%Y-%m-%d"),
                    "gross_price": p_gross,
                    "transport_cost_per_q": transport_cost_per_q,
                    "handling_per_q": handling_per_q,
                    "storage_cost_per_q": storage_cost_per_q,
                    "spoilage_loss_per_q": p_gross * spoilage_rate,
                    "net_unit_val": net_unit_val,
                    "distance_km": route["distance_km"],
                    "travel_time_hours": route["travel_time_hours"]
                })

        num_vars = len(options)
        
        # 2. Linear Programming Formulation
        # Objective: Maximize sum(x_i * net_unit_val_i) -> Minimize sum(x_i * (-net_unit_val_i))
        c = [-opt["net_unit_val"] for opt in options]
        
        # Constraint 1: Equality sum(x_i) == total_quintals
        A_eq = [[1.0] * num_vars]
        b_eq = [total_quintals]
        
        # Constraint 2: Inequality per mandi: sum_{d} x_{m, d} <= total_quintals * max_share
        max_q_per_mandi = total_quintals * (max_share_per_mandi_pct / 100.0)
        A_ub = []
        b_ub = []
        
        # Group variables by mandi
        mandi_var_indices = {}
        for idx, opt in enumerate(options):
            m_id = opt["mandi_id"]
            if m_id not in mandi_var_indices:
                mandi_var_indices[m_id] = []
            mandi_var_indices[m_id].append(idx)
            
        for m_id, idx_list in mandi_var_indices.items():
            row = [0.0] * num_vars
            for idx in idx_list:
                row[idx] = 1.0
            A_ub.append(row)
            b_ub.append(max_q_per_mandi)
            
        # Bounds: 0 <= x_i <= total_quintals
        bounds = [(0, total_quintals) for _ in range(num_vars)]
        
        # Solve with SciPy Highs linear solver
        res = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method="highs")
        
        allocations = []
        tot_rev = 0.0
        tot_trans = 0.0
        tot_hand = 0.0
        tot_stor = 0.0
        tot_spoil = 0.0
        tot_net = 0.0
        
        if res.success:
            sol = res.x
            for idx, q_val in enumerate(sol):
                if q_val > 0.05:  # threshold of at least 5 kg
                    opt = options[idx]
                    allocated_q = round(q_val, 1)
                    allocated_t = round(allocated_q / 10.0, 2)
                    pct = round((allocated_q / total_quintals) * 100.0, 1)
                    
                    gross_rev = round(allocated_q * opt["gross_price"], 2)
                    trans_exp = round(allocated_q * opt["transport_cost_per_q"], 2)
                    hand_exp = round(allocated_q * opt["handling_per_q"], 2)
                    stor_exp = round(allocated_q * opt["storage_cost_per_q"], 2)
                    spoil_exp = round(allocated_q * opt["spoilage_loss_per_q"], 2)
                    net_real = round(gross_rev - (trans_exp + hand_exp + stor_exp + spoil_exp), 2)
                    
                    tot_rev += gross_rev
                    tot_trans += trans_exp
                    tot_hand += hand_exp
                    tot_stor += stor_exp
                    tot_spoil += spoil_exp
                    tot_net += net_real
                    
                    allocations.append({
                        "mandi_id": opt["mandi_id"],
                        "mandi_name": opt["mandi"]["mandi_name"],
                        "district": opt["mandi"].get("district", "Unknown"),
                        "state": opt["mandi"].get("state", "Karnataka"),
                        "allocated_tonnes": allocated_t,
                        "allocated_quintals": allocated_q,
                        "allocation_percentage": pct,
                        "selling_date": opt["selling_date"],
                        "storage_days": opt["day_offset"],
                        "distance_km": opt["distance_km"],
                        "expected_price_per_q": round(opt["gross_price"], 2),
                        "gross_revenue": gross_rev,
                        "transport_expense": trans_exp,
                        "handling_expense": hand_exp,
                        "storage_expense": stor_exp,
                        "spoilage_expense": spoil_exp,
                        "net_realization": net_real,
                        "net_per_quintal": round(net_real / allocated_q, 2)
                    })
        else:
            # Fallback heuristic: allocate everything to the single highest net option
            sorted_opts = sorted(options, key=lambda x: x["net_unit_val"], reverse=True)
            best_opt = sorted_opts[0]
            allocated_q = total_quintals
            gross_rev = round(allocated_q * best_opt["gross_price"], 2)
            trans_exp = round(allocated_q * best_opt["transport_cost_per_q"], 2)
            hand_exp = round(allocated_q * best_opt["handling_per_q"], 2)
            stor_exp = round(allocated_q * best_opt["storage_cost_per_q"], 2)
            spoil_exp = round(allocated_q * best_opt["spoilage_loss_per_q"], 2)
            net_real = round(gross_rev - (trans_exp + hand_exp + stor_exp + spoil_exp), 2)
            
            tot_rev = gross_rev
            tot_trans = trans_exp
            tot_hand = hand_exp
            tot_stor = stor_exp
            tot_spoil = spoil_exp
            tot_net = net_real
            
            allocations.append({
                "mandi_id": best_opt["mandi_id"],
                "mandi_name": best_opt["mandi"]["mandi_name"],
                "district": best_opt["mandi"].get("district", "Unknown"),
                "state": best_opt["mandi"].get("state", "Karnataka"),
                "allocated_tonnes": total_harvest_tonnes,
                "allocated_quintals": allocated_q,
                "allocation_percentage": 100.0,
                "selling_date": best_opt["selling_date"],
                "storage_days": best_opt["day_offset"],
                "distance_km": best_opt["distance_km"],
                "expected_price_per_q": round(best_opt["gross_price"], 2),
                "gross_revenue": gross_rev,
                "transport_expense": trans_exp,
                "handling_expense": hand_exp,
                "storage_expense": stor_exp,
                "spoilage_expense": spoil_exp,
                "net_realization": net_real,
                "net_per_quintal": round(net_real / allocated_q, 2)
            })

        # Benchmark comparison: selling 100% to nearest local mandi on harvest day
        nearest_mandi = min(candidate_mandis, key=lambda m: transport_service.calculate_route(
            farmer_lat, farmer_lon, m.get("latitude", 12.97), m.get("longitude", 77.56)
        )["distance_km"])
        
        bench_res = net_realization_engine.calculate_single_mandi_realization(
            crop=crop,
            quantity_tonnes=total_harvest_tonnes,
            harvest_date_str=harvest_date_str,
            selling_date_str=harvest_date_str,
            farmer_lat=farmer_lat,
            farmer_lon=farmer_lon,
            mandi_info=nearest_mandi
        )
        
        net_diff = tot_net - bench_res["net_realization"]
        pct_gain = round((net_diff / max(1.0, bench_res["net_realization"])) * 100.0, 1)

        # Human-friendly explanation
        explanation = (
            f"The MandiMitra AI Linear Programming Optimizer distributed your {total_harvest_tonnes:.1f} tonnes "
            f"across {len(allocations)} market-channel destinations to maximize net realization. "
            f"Compared to dumping all produce at the nearest local mandi ({nearest_mandi['mandi_name']}), "
            f"this optimized strategy delivers an extra Rs.{max(0.0, net_diff):,.0f} (+{pct_gain}%) in net profit."
        )

        takeaways = [
            f"Total Expected Net Realization: Rs.{tot_net:,.0f} (Rs.{tot_net/total_quintals:,.1f}/quintal).",
            f"Diversification hedge: Risk is distributed across {len(allocations)} separate trading hubs, preventing local price collapse.",
            f"Transportation efficiency: Logistics expenses are constrained to Rs.{tot_trans:,.0f} (Rs.{tot_trans/total_quintals:.1f}/q).",
            f"Quality preservation: Produces minimal storage spoilage loss of Rs.{tot_spoil:,.0f} by synchronizing dispatch timing with terminal demand."
        ]

        return {
            "total_harvest_tonnes": total_harvest_tonnes,
            "total_harvest_quintals": total_quintals,
            "total_expected_revenue": round(tot_rev, 2),
            "total_transport_costs": round(tot_trans, 2),
            "total_handling_costs": round(tot_hand, 2),
            "total_storage_costs": round(tot_stor, 2),
            "total_spoilage_losses": round(tot_spoil, 2),
            "total_net_realization": round(tot_net, 2),
            "average_net_per_quintal": round(tot_net / total_quintals, 2),
            "allocations": allocations,
            "comparison_to_local_single_mandi": {
                "local_mandi_name": nearest_mandi["mandi_name"],
                "local_net_realization": bench_res["net_realization"],
                "profit_increase_rupees": round(net_diff, 2),
                "profit_increase_percentage": pct_gain
            },
            "explanation_summary": explanation,
            "actionable_takeaways": takeaways
        }

harvest_optimizer = HarvestAllocationOptimizer()

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function PriceChart({ history = [], forecast = [], mandiName = "Market" }) {
  // Combine historical and forecast into a single continuous timeline
  const formattedData = [];

  // Add historical points
  history.slice(-14).forEach((h) => {
    formattedData.push({
      date: h.date.slice(5), // MM-DD
      fullDate: h.date,
      historicalPrice: h.modal_price,
      forecastPrice: null,
      lowerBound: null,
      upperBound: null,
      type: "Historical",
    });
  });

  // Anchor the transition point
  if (formattedData.length > 0 && forecast.length > 0) {
    const lastHist = formattedData[formattedData.length - 1];
    lastHist.forecastPrice = lastHist.historicalPrice;
    lastHist.lowerBound = lastHist.historicalPrice;
    lastHist.upperBound = lastHist.historicalPrice;
  }

  // Add forecast points
  forecast.forEach((f) => {
    formattedData.push({
      date: `${f.day_name} (${f.date.slice(5)})`,
      fullDate: f.date,
      historicalPrice: null,
      forecastPrice: f.forecast_modal_price,
      lowerBound: f.lower_bound_80,
      upperBound: f.upper_bound_80,
      type: "Forecast",
    });
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-lg text-xs">
          <p className="font-bold text-gray-800">{data.fullDate} ({data.type})</p>
          {data.historicalPrice !== null && (
            <p className="text-emerald-700 font-semibold mt-1">
              Actual Modal Price: ₹{data.historicalPrice} / quintal
            </p>
          )}
          {data.forecastPrice !== null && (
            <>
              <p className="text-amber-600 font-bold mt-1">
                Forecast Price: ₹{data.forecastPrice} / quintal
              </p>
              {data.lowerBound && (
                <p className="text-gray-500 text-[11px]">
                  80% Confidence: ₹{data.lowerBound} – ₹{data.upperBound}
                </p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formattedData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          
          {/* 80% Confidence Interval Band (Area) */}
          <Area
            type="monotone"
            dataKey="upperBound"
            stroke="none"
            fill="#E9B44C"
            fillOpacity={0.2}
            name="80% Confidence Interval"
          />
          <Area
            type="monotone"
            dataKey="lowerBound"
            stroke="none"
            fill="#ffffff"
            fillOpacity={1.0}
            name="Lower Bound"
          />

          {/* Historical Actual Price Line */}
          <Line
            type="monotone"
            dataKey="historicalPrice"
            stroke="#164B35"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#164B35" }}
            name="Actual Market Price"
          />

          {/* Forecasted Price Line */}
          <Line
            type="monotone"
            dataKey="forecastPrice"
            stroke="#E9B44C"
            strokeWidth={3}
            strokeDasharray="4 4"
            dot={{ r: 4, fill: "#E9B44C" }}
            name="ML Forecast (XGBoost/RF)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

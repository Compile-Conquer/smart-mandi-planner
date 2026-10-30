import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';

export default function ArrivalChart({ arrivals = [], averageArrival = 650 }) {
  const chartData = arrivals.map((a) => ({
    date: `${a.day_name || ''} ${a.date.slice(5)}`,
    fullDate: a.date,
    arrivals: a.forecast_arrivals_quintals || a.arrivals_quintals || 0,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2.5 border border-gray-200 rounded-xl shadow-lg text-xs">
          <p className="font-bold text-gray-800">{data.fullDate}</p>
          <p className="text-blue-700 font-semibold mt-1">
            Arrivals: {data.arrivals.toLocaleString()} Quintals
          </p>
          <p className="text-gray-500 text-[10px]">
            {data.arrivals > averageArrival ? 'Higher than normal supply' : 'Moderate / tight supply'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${val} q`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          <ReferenceLine y={averageArrival} stroke="#E9B44C" strokeDasharray="3 3" label={{ value: 'Normal Supply Avg', fill: '#92400e', fontSize: 11 }} />
          <Bar dataKey="arrivals" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Market Arrivals (Quintals)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

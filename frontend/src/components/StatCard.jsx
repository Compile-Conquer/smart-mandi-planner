import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, badge, color = "emerald" }) {
  const colorMap = {
    emerald: {
      bg: "bg-emerald-50",
      text: "text-[#164B35]",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100 text-[#164B35]"
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-900",
      border: "border-amber-200",
      iconBg: "bg-amber-100 text-amber-800"
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-900",
      border: "border-blue-200",
      iconBg: "bg-blue-100 text-blue-800"
    },
    forest: {
      bg: "bg-[#164B35]",
      text: "text-white",
      border: "border-[#1b583e]",
      iconBg: "bg-[#E9B44C] text-[#164B35]"
    }
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div className={`rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md ${scheme.bg} ${scheme.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            {title}
          </p>
          <h3 className={`text-2xl font-black tracking-tight ${scheme.text}`}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-600 mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl shadow-inner ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {badge && (
        <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center text-xs">
          {badge}
        </div>
      )}
    </div>
  );
}

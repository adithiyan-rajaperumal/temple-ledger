import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const EXPENSE_COLORS = [
  '#ef4444', // Red / Rose (Materials)
  '#f97316', // Orange (Labour Wages)
  '#8b5cf6', // Violet (Contractor)
  '#eab308', // Amber (Travel/Food)
  '#0284c7', // Sky Blue (Pooja/Rituals)
  '#64748b', // Slate (Misc)
  '#10b981', // Emerald
  '#ec4899', // Pink
];

function CustomTooltip({ active, payload, total }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentage = total > 0 ? (data.value / total) * 100 : (data.payload?.percentage || 0);

    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs">
        <p className="font-semibold text-slate-100">{data.name}</p>
        <p className="text-rose-400 font-bold mt-0.5 text-sm">
          {formatCurrency(data.value)}
        </p>
        <p className="text-slate-400 mt-0.5">
          {formatPercentage(percentage)} of total expenses
        </p>
      </div>
    );
  }
  return null;
}

export default function ExpensePieChart({ data = [], loading = false, height = 300 }) {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  if (loading) {
    return (
      <div
        style={{ height }}
        className="w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 animate-pulse"
      >
        <div className="w-10 h-10 rounded-full bg-slate-200 mb-2" />
        <div className="w-32 h-4 rounded bg-slate-200" />
      </div>
    );
  }

  // Filter valid items with positive amounts
  const validItems = (data || []).filter(
    (item) => item && Number(item.amount) > 0
  );

  const totalAmount = validItems.reduce((acc, item) => acc + Number(item.amount || 0), 0);

  if (!validItems.length || totalAmount <= 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 p-6 text-center"
      >
        <PieIcon className="w-10 h-10 text-slate-300 mb-2 stroke-[1.5]" />
        <p className="text-sm font-medium text-slate-500">
          {t('dashboard.noExpenseData') || 'No expense records logged yet'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {isTa ? 'செலவுகள் பதிவு செய்யப்பட்டவுடன் விளக்கப்படம் தோன்றும்' : 'Chart will populate as expenses are recorded'}
        </p>
      </div>
    );
  }

  const chartData = validItems.map((item) => {
    const localizedName = isTa
      ? (item.labelTa || item.labelEn || item.category)
      : (item.labelEn || item.labelTa || item.category);

    return {
      name: localizedName,
      value: Number(item.amount),
      percentage: Number(item.percentage || 0),
    };
  });

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip total={totalAmount} />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }}
            formatter={(value) => (
              <span className="text-xs text-slate-700 font-medium">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const isPositive = item.amount >= 0;

    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs">
        <p className="font-semibold text-slate-100">{item.name}</p>
        <p className={`font-bold mt-0.5 text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatCurrency(item.amount)}
        </p>
        <p className="text-slate-400 text-[10px] mt-0.5 uppercase tracking-wider">
          {item.badge}
        </p>
      </div>
    );
  }
  return null;
}

export default function CashFlowComparisonChart({
  data = { totalInflows: 0, totalOutflows: 0, netBalance: 0 },
  loading = false,
  height = 300,
}) {
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

  const inflows = Number(data?.totalInflows || 0);
  const outflows = Number(data?.totalOutflows || 0);
  const net = Number(data?.netBalance || 0);

  const hasData = inflows > 0 || outflows > 0 || net !== 0;

  if (!hasData) {
    return (
      <div
        style={{ height }}
        className="w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 p-6 text-center"
      >
        <BarChart3 className="w-10 h-10 text-slate-300 mb-2 stroke-[1.5]" />
        <p className="text-sm font-medium text-slate-500">
          {t('dashboard.noDataAvailable') || 'No cash flow records logged yet'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {isTa
            ? 'நிதி வரவு மற்றும் செலவு பதிவுகள் ஏற்பட்டவுடன் இங்கு ஒப்பிடப்படும்'
            : 'Inflows and outflows comparison will appear here as transactions occur'}
        </p>
      </div>
    );
  }

  const chartItems = [
    {
      key: 'inflows',
      name: isTa ? 'மொத்த வரவு' : 'Total Inflow',
      amount: inflows,
      fill: '#059669', // Emerald
      badge: isTa ? 'வரவு' : 'Inflow',
    },
    {
      key: 'outflows',
      name: isTa ? 'மொத்த செலவு' : 'Total Outflow',
      amount: outflows,
      fill: '#e11d48', // Rose
      badge: isTa ? 'செலவு' : 'Outflow',
    },
    {
      key: 'net',
      name: isTa ? 'நிகர கையிருப்பு' : 'Net Liquid Balance',
      amount: net,
      fill: net >= 0 ? '#2563eb' : '#dc2626', // Blue or Red
      badge: isTa ? 'இருப்பு' : 'Balance',
    },
  ];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartItems}
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#475569' }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(val) => formatCurrency(val, { compact: true })}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Bar
            dataKey="amount"
            radius={[6, 6, 0, 0]}
            maxBarSize={64}
          >
            {chartItems.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

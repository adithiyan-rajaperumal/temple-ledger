import React from 'react';
import { formatCurrency } from '../utils/formatters';

const COLOR_VARIANTS = {
  emerald: {
    border: 'border-emerald-200 hover:border-emerald-400',
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accentBar: 'bg-emerald-500',
    valueColor: 'text-slate-900',
  },
  blue: {
    border: 'border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    accentBar: 'bg-blue-500',
    valueColor: 'text-slate-900',
  },
  rose: {
    border: 'border-rose-200 hover:border-rose-400',
    iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    accentBar: 'bg-rose-500',
    valueColor: 'text-slate-900',
  },
  amber: {
    border: 'border-amber-200 hover:border-amber-400',
    iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    accentBar: 'bg-amber-500',
    valueColor: 'text-slate-900',
  },
  indigo: {
    border: 'border-indigo-200 hover:border-indigo-400',
    iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    accentBar: 'bg-indigo-500',
    valueColor: 'text-slate-900',
  },
  purple: {
    border: 'border-purple-200 hover:border-purple-400',
    iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    accentBar: 'bg-purple-500',
    valueColor: 'text-slate-900',
  },
};

/**
 * MetricCard Component
 * Displays a single KPI card with icon, badge, formatted Indian Rupee amount, and contextual description.
 */
export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  badge,
  loading = false,
}) {
  const variant = COLOR_VARIANTS[color] || COLOR_VARIANTS.blue;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs animate-pulse">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-lg bg-slate-200" />
          <div className="w-16 h-5 rounded-md bg-slate-200" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="w-28 h-4 rounded bg-slate-200" />
          <div className="w-36 h-8 rounded bg-slate-200" />
          <div className="w-44 h-3 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  // Format amount if numerical or raw number string
  const formattedValue =
    typeof value === 'number' || (!isNaN(Number(value)) && value !== null && value !== '')
      ? formatCurrency(value)
      : value || '₹0';

  return (
    <div
      className={`relative overflow-hidden bg-white rounded-xl p-5 border ${variant.border} shadow-2xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between`}
    >
      {/* Subtle top indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${variant.accentBar}`} />

      <div>
        <div className="flex items-center justify-between">
          <div className={`p-2.5 rounded-lg border ${variant.iconBg} group-hover:scale-105 transition-transform duration-200`}>
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          {badge && (
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${variant.badge}`}>
              {badge}
            </span>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider line-clamp-1">
            {title}
          </p>
          <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 ${variant.valueColor}`}>
            {formattedValue}
          </p>
        </div>
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 line-clamp-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';

import { getDashboardSummary, getChartData } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import MetricCard from '../components/MetricCard';
import IncomePieChart from '../components/IncomePieChart';
import ExpensePieChart from '../components/ExpensePieChart';
import CashFlowComparisonChart from '../components/CashFlowComparisonChart';

export default function PublicDashboard() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [summaryRes, chartsRes] = await Promise.all([
        getDashboardSummary(),
        getChartData(),
      ]);
      setSummary(summaryRes);
      setChartData(chartsRes);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || t('dashboard.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Total active commitments = uncollected family drive targets + remaining contractor liabilities
  const totalCommitments =
    summary
      ? Number(summary.pendingFamilyDriveBalance || 0) +
        Number(summary.pendingContractorLiabilities || 0)
      : 0;

  const commitmentsSubtitle = summary
    ? `${t('dashboard.pledgesDue')}: ${formatCurrency(summary.pendingFamilyDriveBalance || 0)} | ${t('dashboard.contractorDues')}: ${formatCurrency(summary.pendingContractorLiabilities || 0)}`
    : t('metrics.pendingBalanceDesc');

  return (
    <div className="space-y-8">
      {/* Hero Welcome & Transparency Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{t('dashboard.verifiedAudit')}</span>
              <span className="text-amber-200">•</span>
              <span>{formatDate(lastUpdated, isTa ? 'ta-IN' : 'en-IN')}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {t('receipt.title')}
            </h1>

            <p className="text-amber-100 text-sm sm:text-base leading-relaxed">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={() => loadData(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-medium text-xs sm:text-sm border border-white/20 shadow-xs transition-all disabled:opacity-50"
              title={t('dashboard.refresh')}
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              <span>{refreshing ? t('common.loading') : t('dashboard.refresh')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Network Error Alert with Retry */}
      {error && (
        <div className="p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">{t('common.error')}</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadData(false)}
            className="self-start sm:self-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0"
          >
            {t('dashboard.retry')}
          </button>
        </div>
      )}

      {/* 5 Real-Time KPI Metric Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <span>{t('dashboard.liveDashboard')}</span>
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('dashboard.verifiedAudit')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* 1. Spendable Cash & Bank Balance (Emerald) */}
          <MetricCard
            title={t('metrics.spendableCash')}
            value={summary?.spendableCashAndBankBalance}
            subtitle={t('metrics.spendableCashDesc')}
            icon={Wallet}
            color="emerald"
            badge={isTa ? 'ரொக்கம் + வங்கி' : 'Cash + Bank'}
            loading={loading}
          />

          {/* 2. Total Monetary Collections (Blue) */}
          <MetricCard
            title={t('metrics.totalIncome')}
            value={summary?.totalMonetaryInflow}
            subtitle={t('metrics.totalCollections')}
            icon={ArrowDownLeft}
            color="blue"
            badge={isTa ? 'வரவு' : 'Inflow'}
            loading={loading}
          />

          {/* 3. Total Monetary Outflow (Rose) */}
          <MetricCard
            title={t('metrics.totalExpense')}
            value={summary?.totalMonetaryOutflow}
            subtitle={t('metrics.totalOutflows')}
            icon={ArrowUpRight}
            color="rose"
            badge={isTa ? 'செலவு' : 'Outflow'}
            loading={loading}
          />

          {/* 4. In-Kind Materials Value (Amber) */}
          <MetricCard
            title={t('metrics.inKindValue')}
            value={summary?.totalInKindValuation}
            subtitle={t('metrics.inKindDesc')}
            icon={Package}
            color="amber"
            badge={isTa ? 'பொருட்கள்' : 'Materials'}
            loading={loading}
          />

          {/* 5. Active Commitments Balance (Indigo) */}
          <MetricCard
            title={t('metrics.pendingBalance')}
            value={totalCommitments}
            subtitle={commitmentsSubtitle}
            icon={Clock}
            color="indigo"
            badge={isTa ? 'நிலுவை' : 'Commitments'}
            loading={loading}
          />
        </div>
      </section>

      {/* Visual Charts Grid (Income Pie, Expense Pie, Cash Flow Bar) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <span>{t('dashboard.visualBreakdown')}</span>
          </h2>
        </div>

        {/* 2 Pie Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Pie Chart */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {t('dashboard.inflowsBreakdown')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isTa ? 'நன்கொடை & பொருள் வரவு பிரிவு' : 'Donations & In-Kind Contributions'}
                  </p>
                </div>
              </div>
            </div>
            <IncomePieChart
              data={chartData?.incomeCategories || []}
              loading={loading}
              height={300}
            />
          </div>

          {/* Expense Pie Chart */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {t('dashboard.outflowsBreakdown')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isTa ? 'பொருட்கள், கூலி & இதர செலவினங்கள்' : 'Materials, Labour & Contractor Disbursements'}
                  </p>
                </div>
              </div>
            </div>
            <ExpensePieChart
              data={chartData?.expenseCategories || []}
              loading={loading}
              height={300}
            />
          </div>
        </div>

        {/* Cash Flow Comparison Bar Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {t('dashboard.cashFlowComparison')}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTa
                    ? 'மொத்த வரவு, செலவு மற்றும் நிகர கையிருப்பு ஒப்பீடு'
                    : 'Comparison of Total Inflows, Outflows, and Net Liquid Balance'}
                </p>
              </div>
            </div>
          </div>
          <CashFlowComparisonChart
            data={
              chartData?.inflowVsOutflow || {
                totalInflows: summary?.totalMonetaryInflow || 0,
                totalOutflows: summary?.totalMonetaryOutflow || 0,
                netBalance:
                  Number(summary?.totalMonetaryInflow || 0) -
                  Number(summary?.totalMonetaryOutflow || 0),
              }
            }
            loading={loading}
            height={320}
          />
        </div>
      </section>

      {/* Quick Action Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Link
          to="/drives"
          className="group block p-6 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  {t('dashboard.viewFamilyDrives')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {t('dashboard.viewFamilyDrivesDesc')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </div>
        </Link>

        <Link
          to="/transactions"
          className="group block p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {t('dashboard.browseTransactions')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {t('dashboard.browseTransactionsDesc')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </div>
        </Link>
      </section>
    </div>
  );
}

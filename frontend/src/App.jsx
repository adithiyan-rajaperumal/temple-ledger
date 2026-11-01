import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Package, 
  Clock, 
  CheckCircle2, 
  Building2, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import Navbar from './components/Navbar';

// Dashboard Placeholder View with Bilingual KPI Preview
function DashboardView() {
  const { t, i18n } = useTranslation();

  const previewMetrics = [
    {
      title: t('metrics.spendableCash'),
      amount: '₹3,75,000',
      desc: t('metrics.spendableCashDesc'),
      icon: Wallet,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'Cash + Bank'
    },
    {
      title: t('metrics.totalIncome'),
      amount: '₹7,25,000',
      desc: t('metrics.totalCollections'),
      icon: ArrowDownLeft,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      badge: 'Inflow'
    },
    {
      title: t('metrics.totalExpense'),
      amount: '₹3,50,000',
      desc: t('metrics.totalOutflows'),
      icon: ArrowUpRight,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      badge: 'Outflow'
    },
    {
      title: t('metrics.inKindValue'),
      amount: '₹1,80,000',
      desc: t('metrics.inKindDesc'),
      icon: Package,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      badge: 'Materials'
    },
    {
      title: t('metrics.pendingBalance'),
      amount: '₹4,75,000',
      desc: t('metrics.pendingBalanceDesc'),
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: 'Commitments'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Card */}
      <section className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>{t('common.portalBadge')} • {i18n.language === 'ta' ? 'தமிழ் பதிப்பு' : 'English Edition'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {t('dashboard.title')}
          </h1>
          <p className="mt-2 text-amber-100 text-sm sm:text-base leading-relaxed">
            {t('dashboard.subtitle')}
          </p>
        </div>
      </section>

      {/* KPI Summary Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            {t('dashboard.inflowsBreakdown')} & {t('dashboard.outflowsBreakdown')}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Live Double-Entry Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {previewMetrics.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index} 
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-lg border ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {item.badge}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {item.title}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {item.amount}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Link
          to="/drives"
          className="group block p-6 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  {t('nav.drives')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('tables.allDrives')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/transactions"
          className="group block p-6 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {t('nav.transactions')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('dashboard.viewAll')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </section>
    </div>
  );
}

// Drives Placeholder View
function DrivesView() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
      <h1 className="text-2xl font-bold text-slate-900">{t('nav.drives')}</h1>
      <p className="mt-2 text-slate-600">{t('tables.allDrives')}</p>
      <div className="mt-6 p-6 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
        <p className="font-medium">
          Ready for Task 11: Public Family Drive Status Board & Multi-Drive Installment Grid.
        </p>
      </div>
    </div>
  );
}

// Transactions Placeholder View
function TransactionsView() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
      <h1 className="text-2xl font-bold text-slate-900">{t('nav.transactions')}</h1>
      <p className="mt-2 text-slate-600">{t('dashboard.recentTransactions')}</p>
      <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200 text-blue-900">
        <p className="font-medium">
          Ready for Task 11: Master Filterable Transaction Data Grid with CSV/PDF Export.
        </p>
      </div>
    </div>
  );
}

// Login Placeholder View
function LoginView() {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl p-8 border border-slate-200 shadow-md">
      <h1 className="text-2xl font-bold text-slate-900 text-center">{t('nav.login')}</h1>
      <p className="mt-2 text-slate-500 text-center text-sm">{t('nav.adminPortal')}</p>
      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-sm">
        <p className="font-medium text-center">
          Ready for Task 12: Admin & Data Entry Authentication and Bilingual Entry Forms.
        </p>
      </div>
    </div>
  );
}

// Admin Placeholder View
function AdminView() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
      <h1 className="text-2xl font-bold text-slate-900">{t('nav.adminPortal')}</h1>
      <p className="mt-2 text-slate-600">{t('common.portalBadge')}</p>
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/drives" element={<DrivesView />} />
            <Route path="/transactions" element={<TransactionsView />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/admin" element={<AdminView />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {t('receipt.title')} • {t('nav.appTitle')}</p>
          <p className="mt-1 text-slate-400">{t('dashboard.subtitle')}</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

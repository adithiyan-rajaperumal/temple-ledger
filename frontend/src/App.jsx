import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import PublicDashboard from './pages/PublicDashboard';

// Drives Placeholder View (To be implemented in Task 11)
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

// Transactions Placeholder View (To be implemented in Task 11)
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

// Login Placeholder View (To be implemented in Task 12)
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

// Admin Placeholder View (To be implemented in Task 12)
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
            <Route path="/" element={<PublicDashboard />} />
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

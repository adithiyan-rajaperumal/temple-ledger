import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import PublicDashboard from './pages/PublicDashboard';
import DriveProgressBoard from './pages/DriveProgressBoard';
import MasterDataGrid from './pages/MasterDataGrid';
import IncomeLedger from './pages/IncomeLedger';
import ExpenseLedger from './pages/ExpenseLedger';
import ReceiptModal from './components/ReceiptModal';

import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './pages/admin/AdminLayout';
import DonationEntry from './pages/admin/DonationEntry';
import ExpenseEntry from './pages/admin/ExpenseEntry';
import PledgeManagement from './pages/admin/PledgeManagement';
import DriveConfiguration from './pages/admin/DriveConfiguration';
import ContractorManagement from './pages/admin/ContractorManagement';
import UserManagement from './pages/admin/UserManagement';
import AuditTrailViewer from './pages/admin/AuditTrailViewer';

// Dedicated Public Receipt Page for direct verification links (e.g. from WhatsApp)
function PublicReceiptPage() {
  const { receiptNo } = useParams();
  const navigate = useNavigate();

  return (
    <ReceiptModal
      isOpen={true}
      receiptNo={receiptNo}
      onClose={() => navigate('/transactions')}
    />
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
            {/* Public Routes */}
            <Route path="/" element={<PublicDashboard />} />
            <Route path="/income" element={<IncomeLedger />} />
            <Route path="/expenses" element={<ExpenseLedger />} />
            <Route path="/drives" element={<DriveProgressBoard />} />
            <Route path="/transactions" element={<MasterDataGrid />} />
            <Route path="/receipts/:receiptNo" element={<PublicReceiptPage />} />
            <Route path="/login" element={<Login />} />

            {/* Authenticated Admin Portal Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/donations" replace />} />
              <Route path="donations" element={<DonationEntry />} />
              <Route path="expenses" element={<ExpenseEntry />} />
              <Route path="pledges" element={<PledgeManagement />} />
              <Route path="drives" element={<DriveConfiguration />} />
              <Route path="contractors" element={<ContractorManagement />} />

              {/* Super Admin Only Sub-Routes */}
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredRole="ROLE_SUPER_ADMIN">
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit"
                element={
                  <ProtectedRoute requiredRole="ROLE_SUPER_ADMIN">
                    <AuditTrailViewer />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
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

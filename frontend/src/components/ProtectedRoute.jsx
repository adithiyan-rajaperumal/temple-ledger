import React from 'react';
import { Navigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { isAuthenticated, getCurrentUser } from '../services/auth';

export default function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();
  const { t } = useTranslation();
  const authed = isAuthenticated();
  const currentUser = getCurrentUser();

  if (!authed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && currentUser?.role !== requiredRole) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl p-8 border border-red-200 shadow-sm text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {t('admin.unauthorizedTitle', 'Access Restricted / அனுமதி மறுக்கப்பட்டது')}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {t(
            'admin.unauthorizedMessage',
            'Super Admin privileges are required to view this configuration page. Your current role is'
          )}{' '}
          <span className="font-semibold text-slate-800">
            {currentUser?.role || 'ROLE_DATA_ENTRY'}
          </span>
          .
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/admin/donations"
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('admin.backToDonations', 'Go to Record Donation / நன்கொடை பதிவு')}
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            <Lock className="w-4 h-4 mr-2 text-slate-400" />
            {t('admin.switchAccount', 'Switch Account / கணக்கு மாற')}
          </Link>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
}

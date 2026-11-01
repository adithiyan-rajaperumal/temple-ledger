import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FilePlus,
  Receipt,
  HeartHandshake,
  Flag,
  HardHat,
  Users2,
  History,
  ShieldCheck,
  UserCheck,
  LogOut,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { getCurrentUser, isSuperAdmin, logout } from '../../services/auth';

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [superAdmin, setSuperAdmin] = useState(isSuperAdmin());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
      setSuperAdmin(isSuperAdmin());
    };
    window.addEventListener('temple-ledger-auth-change', handleAuthChange);
    return () => window.removeEventListener('temple-ledger-auth-change', handleAuthChange);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/admin/donations',
      icon: FilePlus,
      labelKey: 'admin.recordDonation',
      defaultLabel: 'Record Donation',
      subLabel: 'நன்கொடை பதிவு',
    },
    {
      to: '/admin/expenses',
      icon: Receipt,
      labelKey: 'admin.recordExpense',
      defaultLabel: 'Record Expense',
      subLabel: 'செலவு பதிவு',
    },
    {
      to: '/admin/pledges',
      icon: HeartHandshake,
      labelKey: 'admin.pledges',
      defaultLabel: 'Devotee Pledges',
      subLabel: 'உறுதிமொழிகள்',
    },
    {
      to: '/admin/drives',
      icon: Flag,
      labelKey: 'admin.drives',
      defaultLabel: 'Drive Configuration',
      subLabel: 'நிதி திரட்டல்',
    },
    {
      to: '/admin/contractors',
      icon: HardHat,
      labelKey: 'admin.contractors',
      defaultLabel: 'Contractors',
      subLabel: 'ஒப்பந்ததாரர்கள்',
    },
    ...(superAdmin
      ? [
          {
            to: '/admin/users',
            icon: Users2,
            labelKey: 'admin.userManagement',
            defaultLabel: 'Operators',
            subLabel: 'பயனர்கள்',
            badge: 'Admin',
          },
          {
            to: '/admin/audit',
            icon: History,
            labelKey: 'admin.auditTrail',
            defaultLabel: 'Audit Trail',
            subLabel: 'தணிக்கை பதிவு',
            badge: 'Admin',
          },
        ]
      : []),
  ];

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-amber-600 text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <div className="space-y-6">
      {/* Top Banner with User Status & Mobile Toggle */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            {superAdmin ? <ShieldCheck className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">
                {currentUser?.fullName || currentUser?.username || 'Operator'}
              </span>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  superAdmin
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {superAdmin ? 'Super Admin' : 'Data Entry'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {t('admin.portalSubtitle', 'Authenticated Management & Data Entry Portal')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            target="_blank"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span className="hidden sm:inline">{t('admin.viewPublic', 'Public Portal')}</span>
            <span className="sm:hidden">Public</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            <span>{t('nav.logout', 'Logout')}</span>
          </button>

          {/* Mobile navigation toggle */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 md:hidden rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle admin menu"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Container: Sidebar + Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-start">
        {/* Navigation - Desktop Sidebar & Mobile Dropdown */}
        <aside
          className={`md:col-span-1 bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-1 ${
            mobileNavOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t('admin.operations', 'Operations')}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={navLinkClass}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 flex flex-col leading-tight overflow-hidden">
                  <span className="truncate">{t(item.labelKey, item.defaultLabel)}</span>
                  <span className="text-[10px] opacity-75 font-normal truncate">
                    {item.subLabel}
                  </span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-700 font-bold px-1.5 py-0.2 rounded">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </aside>

        {/* Content Outlet */}
        <main className="md:col-span-3 lg:col-span-4 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

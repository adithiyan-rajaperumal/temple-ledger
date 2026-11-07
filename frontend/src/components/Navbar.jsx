import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Landmark, 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Lock, 
  Menu, 
  X,
  Globe,
  LogOut,
  ShieldCheck,
  UserCheck,
  KeyRound,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { changeLanguage } from '../i18n';
import { isAuthenticated, getCurrentUser, isSuperAdmin, logout } from '../services/auth';
import ChangePasswordModal from './ChangePasswordModal';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const isTamil = currentLang === 'ta';

  const [authed, setAuthed] = useState(isAuthenticated());
  const [user, setUser] = useState(getCurrentUser());
  const [superAdmin, setSuperAdmin] = useState(isSuperAdmin());

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthed(isAuthenticated());
      setUser(getCurrentUser());
      setSuperAdmin(isSuperAdmin());
    };

    window.addEventListener('temple-ledger-auth-change', handleAuthChange);
    return () => window.removeEventListener('temple-ledger-auth-change', handleAuthChange);
  }, []);

  const handleLanguageSwitch = (lang) => {
    changeLanguage(lang);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
      isActive
        ? 'bg-amber-100 text-amber-900 font-semibold shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center px-3 py-2 rounded-md text-base font-medium ${
      isActive
        ? 'bg-amber-100 text-amber-900 font-semibold'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Landmark className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight leading-tight group-hover:text-amber-700 transition-colors">
                {t('appTitle')}
              </span>
              <span className="text-xs text-amber-700 font-medium tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t('nav.appSubtitle')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5 lg:space-x-2">
            <NavLink to="/" end className={navLinkClass}>
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              {t('nav.dashboard')}
            </NavLink>
            <NavLink to="/income" className={navLinkClass}>
              <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span>{isTamil ? 'வரவுகள்' : 'Income'}</span>
            </NavLink>
            <NavLink to="/expenses" className={navLinkClass}>
              <TrendingDown className="w-4 h-4 mr-1.5 text-rose-600" />
              <span>{isTamil ? 'செலவுகள்' : 'Expenses'}</span>
            </NavLink>
            <NavLink to="/drives" className={navLinkClass}>
              <Users className="w-4 h-4 mr-1.5 text-amber-600" />
              {t('nav.drives')}
            </NavLink>
            <NavLink to="/transactions" className={navLinkClass}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>{isTamil ? 'முழு கணக்கு' : 'Ledger'}</span>
            </NavLink>

            {/* Authenticated Admin Tab */}
            {authed && (
              <NavLink to="/admin" className={navLinkClass}>
                {superAdmin ? (
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-600" />
                ) : (
                  <UserCheck className="w-4 h-4 mr-1.5 text-blue-600" />
                )}
                <span>{t('nav.adminPortal', 'Admin Portal')}</span>
              </NavLink>
            )}
          </nav>

          {/* Desktop Right Actions: Language Toggle & User Status / Admin Login */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Bilingual Toggle Button (EN | தமிழ்) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Globe className="w-4 h-4 text-slate-500 ml-1.5 mr-1" />
              <button
                type="button"
                onClick={() => handleLanguageSwitch('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  currentLang === 'en'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                aria-label="Switch to English"
              >
                EN
              </button>
              <span className="text-slate-300 mx-0.5">|</span>
              <button
                type="button"
                onClick={() => handleLanguageSwitch('ta')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all font-tamil ${
                  currentLang === 'ta'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                aria-label="தமிழுக்கு மாறுங்கள்"
              >
                தமிழ்
              </button>
            </div>

            {/* User Profile or Admin Login Button */}
            {authed ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {user?.fullName || user?.username}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {superAdmin ? 'Super Admin' : 'Operator'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(true)}
                  title={t('auth.changePassword', 'Change Password')}
                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-3.5 py-1.5 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
              >
                <Lock className="w-4 h-4 mr-1.5 text-slate-500" />
                {t('nav.login')}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-2">
            {/* Quick Language Toggle on Mobile */}
            <button
              type="button"
              onClick={() => handleLanguageSwitch(currentLang === 'en' ? 'ta' : 'en')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs"
            >
              {currentLang === 'en' ? 'தமிழ்' : 'EN'}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            <LayoutDashboard className="w-5 h-5 mr-3 text-slate-500" />
            {t('nav.dashboard')}
          </NavLink>
          <NavLink
            to="/income"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            <TrendingUp className="w-5 h-5 mr-3 text-emerald-600" />
            <span>{isTamil ? 'வரவுகள் பேரேடு' : 'Income Ledger'}</span>
          </NavLink>
          <NavLink
            to="/expenses"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            <TrendingDown className="w-5 h-5 mr-3 text-rose-600" />
            <span>{isTamil ? 'செலவுகள் பேரேடு' : 'Expenses Ledger'}</span>
          </NavLink>
          <NavLink
            to="/drives"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            <Users className="w-5 h-5 mr-3 text-amber-600" />
            {t('nav.drives')}
          </NavLink>
          <NavLink
            to="/transactions"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            <FileSpreadsheet className="w-5 h-5 mr-3 text-slate-500" />
            <span>{isTamil ? 'முழு வரவு செலவு கணக்கு' : 'Complete Ledger'}</span>
          </NavLink>

          {authed && (
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              {superAdmin ? (
                <ShieldCheck className="w-5 h-5 mr-3 text-amber-600" />
              ) : (
                <UserCheck className="w-5 h-5 mr-3 text-blue-600" />
              )}
              {t('nav.adminPortal', 'Admin Portal')}
            </NavLink>
          )}

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {authed ? (
              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {user?.fullName || user?.username}
                    </div>
                    <div className="text-xs text-slate-500">
                      {superAdmin ? 'Super Admin' : 'Data Entry Operator'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('nav.logout', 'Logout')}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPasswordModalOpen(true);
                  }}
                  className="w-full mt-1 py-2 px-3 text-xs font-bold text-amber-900 bg-amber-100/70 hover:bg-amber-200/70 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t('auth.changePassword', 'Change Password')}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100"
              >
                <Lock className="w-4 h-4 mr-2 text-slate-500" />
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Self-service change password modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </header>
  );
}

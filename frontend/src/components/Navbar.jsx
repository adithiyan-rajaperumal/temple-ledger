import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Lock, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { changeLanguage } from '../i18n';
import { isAuthenticated, getCurrentUser, isSuperAdmin, logout } from '../services/auth';
import ChangePasswordModal from './ChangePasswordModal';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    if (drawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const handleLanguageSwitch = (lang) => {
    changeLanguage(lang);
  };

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/');
  };

  const navMenuItems = [
    {
      to: '/',
      end: true,
      icon: LayoutDashboard,
      iconColor: 'text-amber-600 bg-amber-50',
      titleEn: 'Transparency Dashboard',
      titleTa: 'வெளிப்படைத்தன்மை பலகை',
      descEn: 'Cash balance, live inflow & expense charts',
      descTa: 'நிதி நிலவரம் & நேரலை வரைபடங்கள்',
    },
    {
      to: '/income',
      icon: TrendingUp,
      iconColor: 'text-emerald-600 bg-emerald-50',
      titleEn: 'Income & Inflows',
      titleTa: 'வரவுகள் விவரம்',
      descEn: 'Devotee donations, GPay & in-kind materials',
      descTa: 'பக்தர் நன்கொடைகள், ஜிபே & பொருள் வரவு',
    },
    {
      to: '/expenses',
      icon: TrendingDown,
      iconColor: 'text-rose-600 bg-rose-50',
      titleEn: 'Expenses & Outflows',
      titleTa: 'செலவுகள் விவரம்',
      descEn: 'Materials, labour wages & contractor payouts',
      descTa: 'பொருட்கள், கூலி & ஒப்பந்த கொடுப்பனவு',
    },
    {
      to: '/drives',
      icon: Users,
      iconColor: 'text-amber-600 bg-amber-50',
      titleEn: 'Village Family Contribution',
      titleTa: 'கிராம குடும்ப பங்களிப்பு',
      descEn: 'Drive commitments, target progress & receipts',
      descTa: 'திருப்பணி திட்ட குடும்ப நிலவரம்',
    },
    {
      to: '/transactions',
      icon: FileSpreadsheet,
      iconColor: 'text-indigo-600 bg-indigo-50',
      titleEn: 'Complete Community Ledger',
      titleTa: 'முழு வரவு செலவு கணக்கு',
      descEn: 'Searchable audit ledger with Excel filters',
      descTa: 'வடிகட்டி வசதியுடன் தணிக்கை கணக்கு',
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Temple Brand Logo & Title */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 flex-1 mr-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-0.5 border border-amber-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/assets/images/jain_symbol.jpg"
                  alt="1008 Sri Vrishabhanatha Jinalayam"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/jain_symbol.jpg';
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="font-bold text-slate-900 text-xs sm:text-base md:text-lg leading-tight truncate group-hover:text-amber-700 transition-colors">
                  {t('appTitle')}
                </span>
                <span className="text-[10px] sm:text-xs text-amber-700 font-medium flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="truncate">{t('nav.appSubtitle')}</span>
                </span>
              </div>
            </Link>

            {/* Right Action Controls: Language Toggle, User Pill, and 3-Line Menu Button */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* Language Switcher (EN | த on mobile, EN | தமிழ் on desktop) */}
              <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleLanguageSwitch('en')}
                  className={`px-1.5 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    currentLang === 'en'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Switch to English"
                >
                  EN
                </button>
                <span className="text-slate-300 mx-0.5">|</span>
                <button
                  type="button"
                  onClick={() => handleLanguageSwitch('ta')}
                  className={`px-1.5 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition-all font-tamil ${
                    currentLang === 'ta'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="தமிழுக்கு மாறுங்கள்"
                >
                  <span className="sm:hidden">த</span>
                  <span className="hidden sm:inline">தமிழ்</span>
                </button>
              </div>

              {/* Authenticated Operator Status Badge (if logged in) */}
              {authed && (
                <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <div className="flex flex-col text-right leading-tight">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {user?.fullName || user?.username}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {superAdmin ? 'Super Admin' : 'Operator'}
                    </span>
                  </div>
                </div>
              )}

              {/* Universal 3-Lines Navbar Menu Button (Laptop & Mobile) */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-slate-800 bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 shadow-2xs transition font-bold text-xs sm:text-sm active:scale-95"
                aria-label="Open Navigation Menu"
                title={isTamil ? 'மெனுவை திறக்குக' : 'Open Menu'}
              >
                <Menu className="w-5 h-5 text-slate-700" />
                <span className="hidden sm:inline">
                  {isTamil ? 'மெனு' : 'Menu'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-Over Navigation Drawer for Laptop & Mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dimmed Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <aside
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-slate-200"
              role="dialog"
              aria-modal="true"
              aria-label="Site Navigation"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/70 to-orange-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-amber-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src="/assets/images/jain_symbol.jpg"
                      alt="1008 Sri Vrishabhanatha Jinalayam"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/jain_symbol.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                      {t('appTitle')}
                    </h2>
                    <p className="text-xs text-amber-800 font-medium mt-0.5">
                      {t('nav.appSubtitle')} • othalavadi-jinalayam.in
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 border border-transparent hover:border-slate-200 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items List */}
              <div className="p-4 sm:p-5 space-y-2 flex-1 overflow-y-auto">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isTamil ? 'பக்கங்கள்' : 'Navigation Menu'}
                </div>

                {navMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between p-3 rounded-2xl transition group ${
                          isActive
                            ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300/80 shadow-xs'
                            : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${item.iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-sm font-bold truncate">
                            {isTamil ? item.titleTa : item.titleEn}
                          </p>
                          <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                            {isTamil ? item.descTa : item.descEn}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </NavLink>
                  );
                })}

                {/* Authenticated Admin Portal Item */}
                {authed && (
                  <NavLink
                    to="/admin"
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between p-3 rounded-2xl transition group mt-3 ${
                        isActive
                          ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300/80 shadow-xs'
                          : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                        {superAdmin ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : (
                          <UserCheck className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-bold truncate">
                          {t('nav.adminPortal', 'Admin Portal')}
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                          {isTamil ? 'குடும்ப வரி, செலவு & நிர்வாக பதிவு' : 'Family quotas & management'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 shrink-0">
                      {superAdmin ? 'Super Admin' : 'Operator'}
                    </span>
                  </NavLink>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                {authed ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {user?.fullName || user?.username}
                        </div>
                        <div className="text-xs text-slate-500">
                          {superAdmin ? 'Super Administrator' : 'Data Entry Operator'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded-xl flex items-center gap-1.5 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('nav.logout', 'Logout')}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDrawerOpen(false);
                        setPasswordModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <KeyRound className="w-4 h-4 text-amber-700" />
                      <span>{t('auth.changePassword', 'Change Password')}</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-3 border border-slate-300 rounded-2xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 transition shadow-2xs"
                  >
                    <Lock className="w-4 h-4 mr-2 text-slate-500" />
                    <span>{t('nav.login')}</span>
                  </Link>
                )}

                <div className="pt-2 text-center text-[11px] text-slate-400">
                  <a
                    href="https://othalavadi-jinalayam.in"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-amber-700 hover:underline"
                  >
                    <span>othalavadi-jinalayam.in</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Self-service change password modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
}

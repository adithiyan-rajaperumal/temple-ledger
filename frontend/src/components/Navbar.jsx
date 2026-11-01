import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Landmark, 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Lock, 
  Menu, 
  X,
  Globe
} from 'lucide-react';
import { changeLanguage } from '../i18n';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en';

  const handleLanguageSwitch = (lang) => {
    changeLanguage(lang);
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
          <nav className="hidden md:flex items-center space-x-2">
            <NavLink to="/" end className={navLinkClass}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              {t('nav.dashboard')}
            </NavLink>
            <NavLink to="/drives" className={navLinkClass}>
              <Users className="w-4 h-4 mr-2" />
              {t('nav.drives')}
            </NavLink>
            <NavLink to="/transactions" className={navLinkClass}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {t('nav.transactions')}
            </NavLink>
          </nav>

          {/* Desktop Right Actions: Language Toggle & Admin Login */}
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

            {/* Admin Login Button */}
            <Link
              to="/login"
              className="inline-flex items-center px-3.5 py-1.5 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
            >
              <Lock className="w-4 h-4 mr-1.5 text-slate-500" />
              {t('nav.login')}
            </Link>
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
            to="/drives"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            <Users className="w-5 h-5 mr-3 text-slate-500" />
            {t('nav.drives')}
          </NavLink>
          <NavLink
            to="/transactions"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            <FileSpreadsheet className="w-5 h-5 mr-3 text-slate-500" />
            {t('nav.transactions')}
          </NavLink>
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100"
            >
              <Lock className="w-4 h-4 mr-2 text-slate-500" />
              {t('nav.login')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

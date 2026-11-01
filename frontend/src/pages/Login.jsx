import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Landmark, Lock, User, Eye, EyeOff, LogIn, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { login, isAuthenticated } from '../services/auth';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated()) {
      const dest = location.state?.from?.pathname || '/admin/donations';
      navigate(dest, { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t('auth.enterCredentials', 'Please enter both username and password'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username.trim(), password);
      const dest = location.state?.from?.pathname || '/admin/donations';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(
        err.message ||
          t('auth.loginFailed', 'Invalid credentials or connection error. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-14 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
        {/* Header Branding */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg mb-4">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('nav.login', 'Admin Login')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('nav.adminPortal', 'Data Entry & Management Portal')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              {t('auth.username', 'Username')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / operator1"
                required
                autoComplete="username"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              {t('auth.password', 'Password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl shadow-md hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{t('auth.submit', 'Sign In / உள்நுழைக')}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('auth.demoHint', 'Quick Demo Access')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-left transition"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Super Admin</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">admin / admin123</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('operator1', 'operator123')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-left transition"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Data Entry</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">operator1 / operator123</div>
            </button>
          </div>
        </div>

        {/* Back to Public Dashboard */}
        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-amber-700 font-medium transition"
          >
            ← {t('auth.backToPublic', 'Back to Public Transparency Dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}

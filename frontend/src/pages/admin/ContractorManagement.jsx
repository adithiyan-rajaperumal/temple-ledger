import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HardHat,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Phone,
  Briefcase,
  X,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { getContractors, createContractor } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export default function ContractorManagement() {
  const { t } = useTranslation();

  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form
  const [contractorName, setContractorName] = useState('');
  const [trade, setTrade] = useState('MASONRY');
  const [phone, setPhone] = useState('');
  const [totalAgreedAmount, setTotalAgreedAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Notifications
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadContractors = async () => {
    setLoading(true);
    try {
      const data = await getContractors();
      if (Array.isArray(data)) {
        setContractors(data);
      }
    } catch (err) {
      console.error('Failed to load contractors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractors();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!contractorName.trim()) {
      setErrorMessage('Contractor name is mandatory');
      return;
    }

    const agreed = parseFloat(totalAgreedAmount);
    if (!agreed || agreed <= 0) {
      setErrorMessage('Total agreed amount must be greater than zero');
      return;
    }

    try {
      await createContractor({
        contractorName: contractorName.trim(),
        trade: trade.trim().toUpperCase(),
        phone: phone.trim() || undefined,
        totalAgreedAmount: agreed,
        status: 'ACTIVE',
        notes: notes.trim() || undefined,
      });

      setSuccessMessage(`Contractor ${contractorName} registered successfully!`);
      setShowCreateModal(false);

      // Reset
      setContractorName('');
      setPhone('');
      setTotalAgreedAmount('');
      setNotes('');

      await loadContractors();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to register contractor');
    }
  };

  const filteredContractors = contractors.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.contractorName?.toLowerCase().includes(q) ||
      c.trade?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HardHat className="w-6 h-6 text-blue-600" />
            <span>{t('admin.contractorsTitle', 'Contractors & Service Profiles')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t(
              'admin.contractorsSubtitle',
              'Register temple construction and artisan contracts, track cumulative milestone payouts and remaining retention balances.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{t('contractor.registerNew', 'Register Contractor')}</span>
        </button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-xs font-bold text-emerald-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-red-900 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-xs font-bold text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search contractor or trade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
        />
      </div>

      {/* Contractor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContractors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            {loading ? 'Loading contractors...' : 'No contractors registered yet.'}
          </div>
        ) : (
          filteredContractors.map((c) => {
            const agreed = Number(c.totalAgreedAmount || 0);
            const paid = Number(c.paidToDate || 0);
            const remaining = Number(
              c.remainingRetentionBalance != null ? c.remainingRetentionBalance : agreed - paid
            );
            const pct = agreed > 0 ? Math.min(100, Math.round((paid / agreed) * 100)) : 0;

            return (
              <div
                key={c.contractorId || c.id}
                className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      {c.trade}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {c.status || 'ACTIVE'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {c.contractorName}
                  </h3>
                  {c.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{c.phone}</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Payout Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Agreed</div>
                    <div className="font-bold text-slate-800 truncate">
                      {formatCurrency(agreed)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Paid</div>
                    <div className="font-bold text-emerald-700 truncate">
                      {formatCurrency(paid)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Retention</div>
                    <div className="font-bold text-rose-700 truncate">
                      {formatCurrency(remaining)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Register New Contractor
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contractor / Firm Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Murugan Masonry Works"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trade / Specialization *
                  </label>
                  <select
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    <option value="MASONRY">MASONRY (கட்டுமானம்)</option>
                    <option value="PAINTING">PAINTING (வர்ணம்)</option>
                    <option value="ELECTRICAL">ELECTRICAL (மின்சாரம்)</option>
                    <option value="CARPENTRY">CARPENTRY (மரவேலை)</option>
                    <option value="PLUMBING">PLUMBING (குழாய்)</option>
                    <option value="OTHER">OTHER (இதர)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Agreed Contract Value (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="150000"
                  value={totalAgreedAmount}
                  onChange={(e) => setTotalAgreedAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contract Notes / Milestones
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50% foundation, 30% lintel, 20% finishing"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

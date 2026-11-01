import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HeartHandshake,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Package,
  X,
  Sparkles
} from 'lucide-react';
import { getPledges, createPledge, getPublicDrives } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export default function PledgeManagement() {
  const { t } = useTranslation();

  const [pledges, setPledges] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Notifications
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [pledgeCode, setPledgeCode] = useState('');
  const [pledgeDate, setPledgeDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [pledgeType, setPledgeType] = useState('MONETARY');
  const [donorName, setDonorName] = useState('');
  const [donorNameTa, setDonorNameTa] = useState('');
  const [village, setVillage] = useState('Main Village');
  const [phone, setPhone] = useState('');
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [targetMonetaryAmount, setTargetMonetaryAmount] = useState('');
  const [targetMaterialDesc, setTargetMaterialDesc] = useState('');
  const [targetMaterialQty, setTargetMaterialQty] = useState('');
  const [targetMaterialUnit, setTargetMaterialUnit] = useState('BAGS');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pledgesData, drivesData] = await Promise.allSettled([
        getPledges(),
        getPublicDrives(),
      ]);

      if (pledgesData.status === 'fulfilled' && Array.isArray(pledgesData.value)) {
        setPledges(pledgesData.value);
      }
      if (drivesData.status === 'fulfilled' && Array.isArray(drivesData.value)) {
        setDrives(drivesData.value);
      }
    } catch (err) {
      console.error('Failed to load pledges', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!donorName.trim()) {
      setErrorMessage('Donor / Sponsor name is required');
      return;
    }

    try {
      const generatedCode =
        pledgeCode.trim() ||
        `PLG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        pledgeCode: generatedCode,
        pledgeDate,
        pledgeType,
        donorName: donorName.trim(),
        donorNameTa: donorNameTa.trim() || undefined,
        village: village.trim() || undefined,
        phone: phone.trim() || undefined,
        driveId: selectedDriveId || undefined,
        notes: notes.trim() || undefined,
      };

      if (pledgeType === 'MONETARY') {
        payload.targetMonetaryAmount = parseFloat(targetMonetaryAmount) || 0;
      } else {
        payload.targetMaterialDesc = targetMaterialDesc.trim();
        payload.targetMaterialQty = parseFloat(targetMaterialQty) || 0;
        payload.targetMaterialUnit = targetMaterialUnit;
      }

      await createPledge(payload);
      setSuccessMessage(`Devotee pledge ${generatedCode} successfully registered!`);
      setShowCreateModal(false);

      // Reset
      setPledgeCode('');
      setDonorName('');
      setDonorNameTa('');
      setPhone('');
      setTargetMonetaryAmount('');
      setTargetMaterialDesc('');
      setTargetMaterialQty('');
      setNotes('');

      await loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create pledge');
    }
  };

  const filteredPledges = pledges.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.pledgeCode?.toLowerCase().includes(q) ||
      p.donorName?.toLowerCase().includes(q) ||
      (p.donorNameTa && p.donorNameTa.includes(searchQuery)) ||
      p.village?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-rose-600" />
            <span>{t('admin.pledgesTitle', 'Devotee Pledges & Major Commitments')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t(
              'admin.pledgesSubtitle',
              'Record and track community pledges for monetary contributions or physical materials (cement, doors, steel).'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{t('pledge.recordNew', 'Record Devotee Pledge')}</span>
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

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search pledge code or donor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Pledge Code</th>
              <th className="px-4 py-3">Devotee / Sponsor</th>
              <th className="px-4 py-3">Village / Phone</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Target Commitment</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPledges.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {loading ? 'Loading devotee pledges...' : 'No pledges registered yet.'}
                </td>
              </tr>
            ) : (
              filteredPledges.map((p) => {
                const isMonetary = p.pledgeType === 'MONETARY';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {p.pledgeCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{p.donorName}</div>
                      {p.donorNameTa && (
                        <div className="text-[11px] text-slate-500 font-tamil">
                          {p.donorNameTa}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{p.village || 'Main Village'}</div>
                      {p.phone && <div className="text-[11px] text-slate-400">{p.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isMonetary
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {p.pledgeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {isMonetary ? (
                        formatCurrency(p.targetMonetaryAmount || 0)
                      ) : (
                        <span>
                          {p.targetMaterialQty} {p.targetMaterialUnit} ({p.targetMaterialDesc})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'PARTIALLY_FULFILLED' || p.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {p.pledgeDate || 'N/A'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Register New Devotee Pledge
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pledge Code
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={pledgeCode}
                    onChange={(e) => setPledgeCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pledge Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={pledgeDate}
                    onChange={(e) => setPledgeDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pledge Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPledgeType('MONETARY')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      pledgeType === 'MONETARY'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Monetary Fund (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPledgeType('IN_KIND_MATERIAL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      pledgeType === 'IN_KIND_MATERIAL'
                        ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    In-Kind Materials
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Devotee Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S. Ramanathan"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    பெயர் (தமிழ்)
                  </label>
                  <input
                    type="text"
                    placeholder="எ.கா. சு. ராமநாதன்"
                    value={donorNameTa}
                    onChange={(e) => setDonorNameTa(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-tamil"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Village / Town
                  </label>
                  <input
                    type="text"
                    placeholder="Main Village"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              {pledgeType === 'MONETARY' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Monetary Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="50000"
                    value={targetMonetaryAmount}
                    onChange={(e) => setTargetMonetaryAmount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900"
                  />
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-purple-50/50 rounded-2xl border border-purple-200">
                  <div>
                    <label className="block text-xs font-semibold text-purple-950 mb-1">
                      Material Item Description *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 100 bags Ultratech Cement or 4 Teak Wood Doors"
                      value={targetMaterialDesc}
                      onChange={(e) => setTargetMaterialDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-purple-950 mb-1">
                        Committed Quantity *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        placeholder="100"
                        value={targetMaterialQty}
                        onChange={(e) => setTargetMaterialQty(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-950 mb-1">
                        Unit *
                      </label>
                      <select
                        value={targetMaterialUnit}
                        onChange={(e) => setTargetMaterialUnit(e.target.value)}
                        className="w-full p-2 bg-white border border-purple-300 rounded-xl text-sm font-semibold"
                      >
                        <option value="BAGS">BAGS</option>
                        <option value="LOADS">LOADS</option>
                        <option value="PIECES">PIECES</option>
                        <option value="METERS">METERS</option>
                        <option value="TONS">TONS</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                >
                  Save Pledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

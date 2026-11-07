import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  Banknote,
  Smartphone,
  Calendar,
  FileText,
  Phone,
  MapPin,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  Receipt,
  Check
} from 'lucide-react';
import {
  getPublicDrives,
  getDriveFamilyProgress,
  recordDonation
} from '../../services/api';
import ReceiptModal from '../../components/ReceiptModal';
import { formatCurrency } from '../../utils/formatters';

export default function FamilyContributionEntry() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language?.startsWith('ta');

  // Drives and Families State
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [families, setFamilies] = useState([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);

  // Selected Family
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [familySearch, setFamilySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form Fields
  const [paymentMode, setPaymentMode] = useState('CASH'); // CASH | GPAY_ONLINE
  const [amount, setAmount] = useState('');
  const [gpayTransactionId, setGpayTransactionId] = useState('');
  const [donationDate, setDonationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // UI & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Load drives on mount
  useEffect(() => {
    async function fetchDrives() {
      try {
        const data = await getPublicDrives();
        if (Array.isArray(data) && data.length > 0) {
          setDrives(data);
          const firstId = data[0].id || data[0].driveId;
          setSelectedDriveId(firstId);
        }
      } catch (err) {
        console.error('Failed to load drives', err);
        setErrorMessage(err.message || 'Failed to load drives');
      }
    }
    fetchDrives();
  }, []);

  // Load families whenever drive changes
  const loadDriveFamilies = async (driveId) => {
    if (!driveId) return;
    setLoadingFamilies(true);
    try {
      const res = await getDriveFamilyProgress(driveId);
      if (res && Array.isArray(res.families)) {
        setFamilies(res.families);
        // If a family is currently selected, update its metrics
        if (selectedFamily) {
          const updated = res.families.find(
            (f) => (f.familyId || f.id) === (selectedFamily.familyId || selectedFamily.id)
          );
          if (updated) {
            setSelectedFamily(updated);
          }
        }
      } else {
        setFamilies([]);
      }
    } catch (err) {
      console.error('Failed to load drive families', err);
    } finally {
      setLoadingFamilies(false);
    }
  };

  useEffect(() => {
    if (selectedDriveId) {
      loadDriveFamilies(selectedDriveId);
    }
  }, [selectedDriveId]);

  // Filtered families for live search and status filter
  const filteredFamilies = useMemo(() => {
    const q = familySearch.trim().toLowerCase();
    return families.filter((f) => {
      const matchSearch =
        !q ||
        (f.familyCode && f.familyCode.toLowerCase().includes(q)) ||
        (f.headName && f.headName.toLowerCase().includes(q)) ||
        (f.headNameTa && f.headNameTa.includes(q)) ||
        (f.street && f.headName && f.street.toLowerCase().includes(q)) ||
        (f.doorNo && f.doorNo.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && (f.status === 'PENDING' || f.status === 'PARTIAL')) ||
        (statusFilter === 'PAID' && f.status === 'PAID') ||
        (statusFilter === 'OPTED_OUT' && (f.status === 'OPTED_OUT' || f.status === 'EXEMPTED'));

      return matchSearch && matchStatus;
    });
  }, [families, familySearch, statusFilter]);

  // Handler to pick a family
  const handleSelectFamily = (family) => {
    setSelectedFamily(family);
    setErrorMessage('');
    // Pre-fill amount with remaining balance if positive
    if (family.balanceAmount && Number(family.balanceAmount) > 0) {
      setAmount(String(family.balanceAmount));
    } else {
      setAmount('');
    }
  };

  // Quick fill amount
  const handleQuickAmount = (val) => {
    setAmount(String(val));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDriveId) {
      setErrorMessage(isTamil ? 'தயவுசெய்து நிதி திட்டத்தை தேர்ந்தெடுக்கவும்' : 'Please select a drive');
      return;
    }
    if (!selectedFamily) {
      setErrorMessage(isTamil ? 'தயவுசெய்து குடும்பத்தை தேர்ந்தெடுக்கவும்' : 'Please select a family');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage(isTamil ? 'செல்லுபடியாகும் தொகையை உள்ளிடவும்' : 'Please enter a valid donation amount');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        driveId: selectedDriveId,
        familyId: selectedFamily.familyId || selectedFamily.id,
        donorSource: 'VILLAGE_FAMILY_DRIVE',
        donorName: selectedFamily.headName,
        donorNameTa: selectedFamily.headNameTa || undefined,
        village: selectedFamily.village || 'ஓதலவாடி',
        area: selectedFamily.street || undefined,
        paymentMode: paymentMode,
        amount: numAmount,
        donationDate: donationDate,
        notes: notes.trim() || undefined,
        gpayTransactionId:
          paymentMode === 'GPAY_ONLINE' && gpayTransactionId.trim()
            ? gpayTransactionId.trim()
            : undefined,
      };

      const result = await recordDonation(payload);
      setSuccessReceipt(result);
      setShowReceiptModal(true);

      // Reset form fields
      setAmount('');
      setGpayTransactionId('');
      setNotes('');

      // Refresh families from drive
      await loadDriveFamilies(selectedDriveId);
    } catch (err) {
      console.error('Failed to record family contribution', err);
      setErrorMessage(err.message || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDrive = drives.find(
    (d) => (d.id || d.driveId) === selectedDriveId
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-amber-100 text-xs font-semibold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>{isTamil ? 'கிராம குடும்ப வரி வசூல்' : 'Village Family Contribution'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isTamil ? 'குடும்ப பங்களிப்பு பதிவு' : 'Family Drive Contribution'}
            </h1>
            <p className="text-amber-100/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {isTamil
                ? 'ஓதலவாடி கிராம குடும்பங்களுக்கான நிதி பங்களிப்பு பதிவு. ரசீது புத்தகம் அல்லது தாள் எண்கள் தேவையில்லை; நேரடி ரொக்கம் அல்லது GPay மூலம் செலுத்தலாம்.'
                : 'Log recurring village family contributions by selecting the drive and family. No physical donation book required.'}
            </p>
          </div>

          {/* Drive Selector Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 min-w-[240px]">
            <label className="block text-[11px] font-bold text-amber-200 uppercase tracking-wider mb-1">
              {isTamil ? 'திருப்பணி நிதி திட்டம்' : 'Active Drive'}
            </label>
            <select
              value={selectedDriveId}
              onChange={(e) => {
                setSelectedDriveId(e.target.value);
                setSelectedFamily(null);
              }}
              className="w-full bg-white text-slate-900 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-300"
            >
              {drives.map((d) => (
                <option key={d.id || d.driveId} value={d.id || d.driveId}>
                  {isTamil && d.driveNameTa ? d.driveNameTa : d.driveName} (₹{formatCurrency(d.targetPerFamily || 0)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Family Finder / Directory (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>{isTamil ? 'குடும்பத்தை தேர்வு செய்க' : 'Select Family'}</span>
              </h2>
              <span className="text-xs text-slate-500">
                {isTamil ? `${filteredFamilies.length} குடும்பங்கள்` : `${filteredFamilies.length} families found`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => loadDriveFamilies(selectedDriveId)}
              disabled={loadingFamilies}
              className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition"
              title={isTamil ? 'புதுப்பிக்க' : 'Refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${loadingFamilies ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={familySearch}
              onChange={(e) => setFamilySearch(e.target.value)}
              placeholder={isTamil ? 'குடும்ப எண், பெயர், தெரு மூலம் தேடுக...' : 'Search by code, name, street...'}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
            {familySearch && (
              <button
                type="button"
                onClick={() => setFamilySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
            {[
              { id: 'ALL', labelEn: 'All', labelTa: 'அனைத்தும்' },
              { id: 'PENDING', labelEn: 'Due / Partial', labelTa: 'நிலுவை' },
              { id: 'PAID', labelEn: 'Fully Paid', labelTa: 'செலுத்தியவை' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
                  statusFilter === f.id
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isTamil ? f.labelTa : f.labelEn}
              </button>
            ))}
          </div>

          {/* Families List Scroll Area */}
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
            {loadingFamilies ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600" />
                <span>{isTamil ? 'குடும்பங்கள் ஏற்றப்படுகின்றன...' : 'Loading families...'}</span>
              </div>
            ) : filteredFamilies.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>{isTamil ? 'குடும்பங்கள் எதுவும் பொருந்தவில்லை' : 'No matching families found'}</p>
              </div>
            ) : (
              filteredFamilies.map((fam) => {
                const isSelected =
                  selectedFamily &&
                  (selectedFamily.familyId || selectedFamily.id) ===
                    (fam.familyId || fam.id);
                const isPaid = fam.status === 'PAID';
                const isPartial = fam.status === 'PARTIAL';

                return (
                  <div
                    key={fam.familyId || fam.id}
                    onClick={() => handleSelectFamily(fam)}
                    className={`p-3 rounded-2xl cursor-pointer transition text-left my-1 ${
                      isSelected
                        ? 'bg-amber-50 border-2 border-amber-500 shadow-xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {fam.familyCode}
                          </span>
                          <span className="font-bold text-slate-900 text-sm truncate">
                            {fam.headNameTa || fam.headName}
                          </span>
                        </div>
                        {fam.headNameTa && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {fam.headName}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>
                            {[fam.doorNo, fam.street, fam.village || 'ஓதலவாடி']
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </p>
                      </div>

                      {/* Due / Status Badge */}
                      <div className="text-right shrink-0">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" />
                            {isTamil ? 'முழுதும்' : 'Paid'}
                          </span>
                        ) : (
                          <div>
                            <span className="block text-xs font-bold text-slate-900">
                              ₹{formatCurrency(fam.balanceAmount || 0)}
                            </span>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium ${
                                isPartial
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isTamil ? 'நிலுவை' : 'Due'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Family Contribution Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedFamily ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              {/* Selected Family Details Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/80">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900">
                        {selectedFamily.familyCode}
                      </span>
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedFamily.headNameTa || selectedFamily.headName}
                      </h3>
                    </div>
                    {selectedFamily.headNameTa && (
                      <p className="text-xs text-slate-600 font-medium">
                        {selectedFamily.headName}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        {[
                          selectedFamily.doorNo,
                          selectedFamily.street,
                          selectedFamily.village || 'ஓதலவாடி',
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </p>
                    {selectedFamily.phone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                        <Phone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{selectedFamily.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Financial Status Breakdown */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-amber-200/60 text-center">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">
                        {isTamil ? 'இலக்கு' : 'Target'}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        ₹{formatCurrency(selectedFamily.targetAmount || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-600 uppercase">
                        {isTamil ? 'செலுத்தியது' : 'Paid'}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-700">
                        ₹{formatCurrency(selectedFamily.paidAmount || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-rose-600 uppercase">
                        {isTamil ? 'நிலுவை' : 'Due'}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-rose-700">
                        ₹{formatCurrency(selectedFamily.balanceAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Payment Mode Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {isTamil ? 'கட்டண முறை' : 'Payment Mode'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('CASH')}
                      className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl font-bold text-sm border-2 transition ${
                        paymentMode === 'CASH'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <span>{isTamil ? 'ரொக்கம் (Cash)' : 'Cash'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('GPAY_ONLINE')}
                      className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl font-bold text-sm border-2 transition ${
                        paymentMode === 'GPAY_ONLINE'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-blue-600" />
                      <span>{isTamil ? 'GPay / UPI' : 'GPay / Online'}</span>
                    </button>
                  </div>
                </div>

                {/* Amount with Quick Fills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isTamil ? 'பங்களிப்பு தொகை (₹)' : 'Contribution Amount (₹)'}
                    </label>
                    {selectedFamily.balanceAmount > 0 && (
                      <span className="text-xs text-rose-600 font-semibold">
                        {isTamil ? 'நிலுவை தொகை:' : 'Remaining Due:'} ₹
                        {formatCurrency(selectedFamily.balanceAmount)}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 text-2xl font-black text-slate-900 focus:outline-hidden focus:border-amber-600 focus:ring-4 focus:ring-amber-100 transition"
                    />
                  </div>

                  {/* Quick Fill Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {isTamil ? 'விரைவு தேர்வு:' : 'Quick Fill:'}
                    </span>
                    {selectedFamily.balanceAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(selectedFamily.balanceAmount)}
                        className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                      >
                        {isTamil ? 'முழு நிலுவை' : 'Full Due'} (₹{formatCurrency(selectedFamily.balanceAmount)})
                      </button>
                    )}
                    {selectedFamily.balanceAmount > 2000 && (
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(Math.round(selectedFamily.balanceAmount / 2))}
                        className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        50% (₹{formatCurrency(Math.round(selectedFamily.balanceAmount / 2))})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(1000)}
                      className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      ₹1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(2000)}
                      className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      ₹2,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(5000)}
                      className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      ₹5,000
                    </button>
                  </div>
                </div>

                {/* GPay Transaction ID (if online) */}
                {paymentMode === 'GPAY_ONLINE' && (
                  <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200 space-y-1">
                    <label className="block text-xs font-bold text-blue-900">
                      {isTamil ? 'UPI குறிப்பு எண் / UTR (விரும்பினால்)' : 'UPI Reference / UTR Number (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={gpayTransactionId}
                      onChange={(e) => setGpayTransactionId(e.target.value)}
                      placeholder="e.g. 423987162534"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Date & Notes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isTamil ? 'தேதி' : 'Donation Date'}</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={donationDate}
                      onChange={(e) => setDonationDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isTamil ? 'குறிப்பு (விரும்பினால்)' : 'Notes / Remarks (Optional)'}</span>
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={isTamil ? 'எ.கா: மகன் மூலமாக செலுத்தியது' : 'e.g. Paid in cash at site'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Notice: No physical book required */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isTamil
                      ? 'கிராம குடும்ப பங்களிப்பிற்கு நேரடி கணினி ரசீது உடனடியாக உருவாக்கப்படும். ரசீது புத்தகம் / தாள் தேவையில்லை.'
                      : 'An instant digital receipt will be generated. No physical donation book required.'}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-base shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{isTamil ? 'பதிவாகிறது...' : 'Recording...'}</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-5 h-5" />
                      <span>
                        {isTamil
                          ? `வரி வசூல் பதிவு செய்க (₹${formatCurrency(amount || 0)})`
                          : `Record Contribution (₹${formatCurrency(amount || 0)})`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Empty State when no family selected */
            <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900">
                  {isTamil ? 'குடும்பத்தை தேர்வு செய்யவும்' : 'Select a Family to Begin'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isTamil
                    ? 'இடதுபுறம் உள்ள பட்டியலில் இருந்து குடும்ப எண், பெயர் அல்லது தெரு மூலம் தேடி தேர்ந்தெடுக்கவும்.'
                    : 'Choose a family from the directory on the left to record their recurring drive contribution.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instant Digital Receipt Modal */}
      {showReceiptModal && successReceipt && (
        <ReceiptModal
          isOpen={showReceiptModal}
          receiptData={successReceipt}
          onClose={() => {
            setShowReceiptModal(false);
            setSuccessReceipt(null);
          }}
        />
      )}
    </div>
  );
}

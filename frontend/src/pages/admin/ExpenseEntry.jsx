import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Receipt,
  Banknote,
  Smartphone,
  HardHat,
  Hammer,
  Truck,
  Flame,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { recordExpense, getContractors } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export default function ExpenseEntry() {
  const { t } = useTranslation();

  // Categories: MATERIAL_PURCHASE, LABOUR_WAGES, CONTRACT_PAYOUT, COLLECTION_FIELD_EXPENSE, TEMPLE_RITUAL_MISC
  const [category, setCategory] = useState('MATERIAL_PURCHASE');
  const [paymentMode, setPaymentMode] = useState('CASH');

  // Form inputs
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [invoiceBillNo, setInvoiceBillNo] = useState('');
  const [description, setDescription] = useState('');

  // Contractor Milestone payout specific
  const [contractors, setContractors] = useState([]);
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [contractMilestoneDesc, setContractMilestoneDesc] = useState('');

  // Volunteer Collection field expense specific
  const [volunteerName, setVolunteerName] = useState('');
  const [travelModeVehicle, setTravelModeVehicle] = useState('TWO_WHEELER');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successVoucher, setSuccessVoucher] = useState(null);

  // Fetch contractors on mount
  useEffect(() => {
    async function loadContractors() {
      try {
        const data = await getContractors();
        if (Array.isArray(data)) {
          setContractors(data);
          if (data.length > 0) {
            setSelectedContractorId(data[0].contractorId || data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load contractors', err);
      }
    }
    loadContractors();
  }, []);

  const selectedContractor = contractors.find(
    (c) => (c.contractorId || c.id) === selectedContractorId
  );

  const resetForm = () => {
    setAmount('');
    setPaidTo('');
    setInvoiceBillNo('');
    setDescription('');
    setContractMilestoneDesc('');
    setVolunteerName('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage(t('expense.enterValidAmount', 'Please enter a valid expense amount greater than zero'));
      return;
    }

    if (!paidTo.trim()) {
      setErrorMessage(t('expense.enterPaidTo', 'Paid To (Recipient / Vendor name) is required'));
      return;
    }

    if (!description.trim()) {
      setErrorMessage(t('expense.enterDescription', 'Description of expenditure is mandatory'));
      return;
    }

    if (category === 'CONTRACT_PAYOUT') {
      if (!selectedContractorId) {
        setErrorMessage(t('expense.selectContractor', 'Please select a registered contractor'));
        return;
      }
      if (selectedContractor) {
        const remaining = Number(selectedContractor.remainingRetentionBalance ?? selectedContractor.totalAgreedAmount);
        if (parsedAmount > remaining) {
          setErrorMessage(
            `Entered amount ₹${parsedAmount.toLocaleString('en-IN')} exceeds remaining contractor retention balance of ₹${remaining.toLocaleString('en-IN')}`
          );
          return;
        }
      }
    }

    if (category === 'COLLECTION_FIELD_EXPENSE' && !volunteerName.trim()) {
      setErrorMessage(t('expense.enterVolunteer', 'Volunteer name is required for field travel expenses'));
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        expenseDate,
        category,
        amount: parsedAmount,
        paymentMode,
        paidTo: paidTo.trim(),
        invoiceBillNo: invoiceBillNo.trim() || undefined,
        description: description.trim(),
      };

      if (category === 'CONTRACT_PAYOUT') {
        payload.contractorId = selectedContractorId;
        payload.contractMilestoneDesc = contractMilestoneDesc.trim() || undefined;
      } else if (category === 'COLLECTION_FIELD_EXPENSE') {
        payload.volunteerName = volunteerName.trim();
        payload.travelModeVehicle = travelModeVehicle;
      }

      const response = await recordExpense(payload);
      setSuccessVoucher(response);
      resetForm();

      // Refresh contractors to update live balances
      try {
        const freshContractors = await getContractors();
        if (Array.isArray(freshContractors)) setContractors(freshContractors);
      } catch {
        // ignore
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record expense voucher. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Title */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
          <Sparkles className="w-4 h-4" />
          <span>{t('admin.disbursementEntry', 'Authorized Outflow Voucher')}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {t('admin.expenseEntryTitle', 'Record Renovation Expense / திருப்பணி செலவு பதிவு')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t(
            'admin.expenseEntrySubtitle',
            'Issue audit-tracked expenditure vouchers for materials, wages, contractor milestone payouts, and travel.'
          )}
        </p>
      </div>

      {/* Success Banner */}
      {successVoucher && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-emerald-900">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">
                {t('expense.recordSuccess', 'Expense voucher successfully approved & recorded!')}
              </div>
              <div className="text-xs text-emerald-700">
                {t('receipt.voucherNumber')}:{' '}
                <span className="font-mono font-bold text-emerald-900">
                  {successVoucher.voucherNo}
                </span>{' '}
                • {successVoucher.paidTo} • {formatCurrency(successVoucher.amount)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessVoucher(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Category Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            1. {t('expense.selectCategory', 'Expenditure Category / செலவு வகை')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setCategory('MATERIAL_PURCHASE')}
              className={`p-3 rounded-2xl border text-left transition ${
                category === 'MATERIAL_PURCHASE'
                  ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <Hammer className="w-5 h-5 text-amber-600 mb-1" />
              <div className="text-xs font-bold truncate">
                {t('categories.renovationMaterials', 'Materials')}
              </div>
              <div className="text-[10px] text-slate-500 truncate">கட்டுமான பொருள்</div>
            </button>

            <button
              type="button"
              onClick={() => setCategory('LABOUR_WAGES')}
              className={`p-3 rounded-2xl border text-left transition ${
                category === 'LABOUR_WAGES'
                  ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <User className="w-5 h-5 text-emerald-600 mb-1" />
              <div className="text-xs font-bold truncate">
                {t('categories.labourWages', 'Labour Wages')}
              </div>
              <div className="text-[10px] text-slate-500 truncate">தொழிலாளர் கூலி</div>
            </button>

            <button
              type="button"
              onClick={() => setCategory('CONTRACT_PAYOUT')}
              className={`p-3 rounded-2xl border text-left transition ${
                category === 'CONTRACT_PAYOUT'
                  ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <HardHat className="w-5 h-5 text-blue-600 mb-1" />
              <div className="text-xs font-bold truncate">
                {t('categories.contractPayout', 'Contractor Release')}
              </div>
              <div className="text-[10px] text-slate-500 truncate">ஒப்பந்ததாரர் தவணை</div>
            </button>

            <button
              type="button"
              onClick={() => setCategory('COLLECTION_FIELD_EXPENSE')}
              className={`p-3 rounded-2xl border text-left transition ${
                category === 'COLLECTION_FIELD_EXPENSE'
                  ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <Truck className="w-5 h-5 text-purple-600 mb-1" />
              <div className="text-xs font-bold truncate">
                {t('categories.collectionTravel', 'Field Travel/Food')}
              </div>
              <div className="text-[10px] text-slate-500 truncate">களப்பயணம் / உணவு</div>
            </button>

            <button
              type="button"
              onClick={() => setCategory('TEMPLE_RITUAL_MISC')}
              className={`p-3 rounded-2xl border text-left transition ${
                category === 'TEMPLE_RITUAL_MISC'
                  ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <Flame className="w-5 h-5 text-orange-600 mb-1" />
              <div className="text-xs font-bold truncate">
                {t('categories.poojaRitual', 'Pooja & Misc')}
              </div>
              <div className="text-[10px] text-slate-500 truncate">பூஜை & இதர</div>
            </button>
          </div>
        </div>

        {/* Step 2: Contractor Milestone specifics (if CONTRACT_PAYOUT) */}
        {category === 'CONTRACT_PAYOUT' && (
          <div className="p-4 sm:p-5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-950 mb-1">
                  {t('expense.selectContractor', 'Select Contractor / ஒப்பந்ததாரர்')} *
                </label>
                <select
                  value={selectedContractorId}
                  onChange={(e) => {
                    setSelectedContractorId(e.target.value);
                    const c = contractors.find((item) => (item.contractorId || item.id) === e.target.value);
                    if (c && !paidTo) setPaidTo(c.contractorName);
                  }}
                  className="w-full p-2.5 bg-white border border-blue-300 rounded-xl text-sm font-semibold text-slate-900"
                >
                  <option value="">-- Choose Contractor ({contractors.length} registered) --</option>
                  {contractors.map((c) => (
                    <option key={c.contractorId || c.id} value={c.contractorId || c.id}>
                      {c.contractorName} ({c.trade}) - Agreed: ₹{Number(c.totalAgreedAmount).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-950 mb-1">
                  {t('expense.milestoneDesc', 'Work Milestone Completed / பணி மைல்கல்')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stage 2 Masonry & Plastering complete"
                  value={contractMilestoneDesc}
                  onChange={(e) => setContractMilestoneDesc(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm font-medium"
                />
              </div>
            </div>

            {/* Live Contractor Financial Status Card */}
            {selectedContractor && (
              <div className="p-3.5 bg-white rounded-xl border border-blue-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total Contract</div>
                  <div className="text-sm font-black text-slate-800">
                    {formatCurrency(selectedContractor.totalAgreedAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Paid to Date</div>
                  <div className="text-sm font-black text-emerald-700">
                    {formatCurrency(selectedContractor.paidToDate || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Remaining Retention</div>
                  <div className="text-sm font-black text-rose-700">
                    {formatCurrency(selectedContractor.remainingRetentionBalance ?? selectedContractor.totalAgreedAmount)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Volunteer Travel Details (if COLLECTION_FIELD_EXPENSE) */}
        {category === 'COLLECTION_FIELD_EXPENSE' && (
          <div className="p-4 sm:p-5 bg-purple-50/60 rounded-2xl border border-purple-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1">
                {t('expense.volunteerName', 'Volunteer Name / தன்னார்வலர் பெயர்')} *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. K. Arumugam"
                value={volunteerName}
                onChange={(e) => {
                  setVolunteerName(e.target.value);
                  if (!paidTo) setPaidTo(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1">
                {t('expense.travelMode', 'Travel Mode / Vehicle')}
              </label>
              <select
                value={travelModeVehicle}
                onChange={(e) => setTravelModeVehicle(e.target.value)}
                className="w-full p-2 bg-white border border-purple-300 rounded-xl text-sm font-semibold"
              >
                <option value="TWO_WHEELER">Two-Wheeler (இருசக்கர வாகனம் / பெட்ரோல்)</option>
                <option value="CAR">Car / Van (கார் / வேன்)</option>
                <option value="BUS">Bus / Public Transport (பேருந்து)</option>
                <option value="FOOD_ALLOWANCE">Volunteer Meal / Food (உணவுச் செலவு)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Amount & Recipient */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('expense.amountInr', 'Disbursement Amount (₹)')} *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-slate-500">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('expense.paymentMode', 'Payment Mode')} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMode === 'CASH'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('GPAY_ONLINE')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMode === 'GPAY_ONLINE'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-400'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>GPay</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('expense.paidTo', 'Paid To / பெற்றவர்')} *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sri Lakshmi Hardware / Mason Mani"
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('expense.invoiceBillNo', 'Bill / Voucher Reference No')}
            </label>
            <input
              type="text"
              placeholder="e.g. INV-9842 / BILL-014"
              value={invoiceBillNo}
              onChange={(e) => setInvoiceBillNo(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Step 5: Description & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('receipt.date', 'Expense Date')} *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('expense.description', 'Detailed Expenditure Description / விளக்கம்')} *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Purchased 40 bags of cement and sand for northern sanctum wall"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            {t('common.clearForm', 'Clear Form / மீட்டமை')}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 text-white text-sm font-bold shadow-md hover:from-rose-700 hover:to-orange-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                <span>{t('expense.submitVoucher', 'Approve & Post Expense Voucher / வவுச்சர் பதிவு')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

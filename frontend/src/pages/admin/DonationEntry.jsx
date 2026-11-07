import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Banknote,
  Smartphone,
  Package,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Phone,
  MapPin,
  Globe,
  FileText,
  Building,
  HeartHandshake,
  Printer,
  Sparkles
} from 'lucide-react';
import {
  recordDonation,
  searchDonors,
  searchAreas,
  getPublicDrives,
  getAdminFamilies,
  getPledges
} from '../../services/api';
import ReceiptModal from '../../components/ReceiptModal';
import { formatCurrency } from '../../utils/formatters';
import {
  getCountriesList,
  getStatesForCountry,
  DEFAULT_COUNTRY,
  DEFAULT_STATE
} from '../../utils/locationData';

export default function DonationEntry() {
  const { t, i18n } = useTranslation();

  // Mode: CASH | GPAY_ONLINE | IN_KIND
  const [paymentMode, setPaymentMode] = useState('CASH');

  // Source: GENERAL_PUBLIC | VILLAGE_FAMILY_DRIVE
  const [donorSource, setDonorSource] = useState('GENERAL_PUBLIC');

  // Form state
  const [donationDate, setDonationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [donorName, setDonorName] = useState('');
  const [donorNameTa, setDonorNameTa] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [state, setState] = useState(DEFAULT_STATE);
  const [area, setArea] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Autocomplete suggestions & dropdown visibility
  const [donorSuggestions, setDonorSuggestions] = useState([]);
  const [showDonorDropdown, setShowDonorDropdown] = useState(false);
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const donorDropdownRef = useRef(null);
  const areaDropdownRef = useRef(null);

  // Payment details
  const [amount, setAmount] = useState('');
  const [physicalBookReceiptNo, setPhysicalBookReceiptNo] = useState('');
  const [gpayTransactionId, setGpayTransactionId] = useState('');

  // In-Kind details
  const [itemCategory, setItemCategory] = useState('CEMENT');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('BAGS');
  const [approximateUnitRate, setApproximateUnitRate] = useState('');
  const [storageLocation, setStorageLocation] = useState('Temple Site Store');

  // Linked Drive / Family / Pledge
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [selectedPledgeId, setSelectedPledgeId] = useState('');

  // Lookups data
  const [drives, setDrives] = useState([]);
  const [families, setFamilies] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [familySearch, setFamilySearch] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Fetch drives, families, pledges on mount
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [drivesData, familiesData, pledgesData] = await Promise.allSettled([
          getPublicDrives(),
          getAdminFamilies(),
          getPledges(),
        ]);

        if (drivesData.status === 'fulfilled' && Array.isArray(drivesData.value)) {
          setDrives(drivesData.value);
          if (drivesData.value.length > 0) {
            setSelectedDriveId(drivesData.value[0].id || drivesData.value[0].driveId);
          }
        }
        if (familiesData.status === 'fulfilled' && Array.isArray(familiesData.value)) {
          setFamilies(familiesData.value);
        }
        if (pledgesData.status === 'fulfilled' && Array.isArray(pledgesData.value)) {
          setPledges(pledgesData.value);
        }
      } catch (err) {
        console.error('Failed to load lookup data', err);
      }
    }
    loadDropdowns();
  }, []);

  // Close autocomplete dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (donorDropdownRef.current && !donorDropdownRef.current.contains(event.target)) {
        setShowDonorDropdown(false);
      }
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target)) {
        setShowAreaDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cascading Country and State options
  const countries = useMemo(() => {
    return getCountriesList(i18n.language);
  }, [i18n.language]);

  const availableStates = useMemo(() => {
    return getStatesForCountry(country, i18n.language);
  }, [country, i18n.language]);

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    const states = getStatesForCountry(newCountry, i18n.language);
    if (states && states.length > 0) {
      setState(states[0].name);
    } else {
      setState('');
    }
  };

  // Debounced donor name search for autocomplete
  useEffect(() => {
    if (!donorName || donorName.trim().length < 2) {
      setDonorSuggestions([]);
      setShowDonorDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchDonors(donorName.trim());
        if (Array.isArray(results) && results.length > 0) {
          setDonorSuggestions(results);
          setShowDonorDropdown(true);
        } else {
          setDonorSuggestions([]);
          setShowDonorDropdown(false);
        }
      } catch (err) {
        console.error('Error searching donors:', err);
        setDonorSuggestions([]);
        setShowDonorDropdown(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [donorName]);

  const handleSelectDonorSuggestion = (suggestion) => {
    setDonorName(suggestion.donorName || '');
    if (suggestion.donorNameTa) setDonorNameTa(suggestion.donorNameTa);
    if (suggestion.phone) setPhone(suggestion.phone);
    if (suggestion.area || suggestion.village) {
      const loc = suggestion.area || suggestion.village;
      setArea(loc);
      setVillage(loc);
    }
    if (suggestion.country) {
      setCountry(suggestion.country);
      if (suggestion.state) {
        setState(suggestion.state);
      }
    } else if (suggestion.state) {
      setState(suggestion.state);
    }
    if (suggestion.familyId) {
      setSelectedFamilyId(suggestion.familyId);
      setDonorSource('VILLAGE_FAMILY_DRIVE');
    }
    setShowDonorDropdown(false);
  };

  // Debounced area search for autocomplete
  useEffect(() => {
    if (!area || area.trim().length < 1) {
      setAreaSuggestions([]);
      setShowAreaDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchAreas(area.trim());
        if (Array.isArray(results) && results.length > 0) {
          setAreaSuggestions(results);
          setShowAreaDropdown(true);
        } else {
          setAreaSuggestions([]);
          setShowAreaDropdown(false);
        }
      } catch (err) {
        console.error('Error searching areas:', err);
        setAreaSuggestions([]);
        setShowAreaDropdown(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [area]);

  const handleSelectAreaSuggestion = (selectedArea) => {
    setArea(selectedArea);
    setVillage(selectedArea);
    setShowAreaDropdown(false);
  };

  // Compute total for In-Kind
  const computedInKindTotal = useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(approximateUnitRate) || 0;
    return q * r;
  }, [quantity, approximateUnitRate]);

  // When family is picked, auto-populate head name & location
  const handleFamilySelect = (famId) => {
    setSelectedFamilyId(famId);
    const fam = families.find((f) => f.id === famId);
    if (fam) {
      if (!donorName) setDonorName(fam.headName);
      if (!donorNameTa && fam.headNameTa) setDonorNameTa(fam.headNameTa);
      const loc = fam.area || fam.village;
      if (loc) {
        setArea(loc);
        setVillage(loc);
      }
      if (fam.state) setState(fam.state);
      if (fam.country) setCountry(fam.country);
      if (fam.phone && !phone) setPhone(fam.phone);
    }
  };

  const resetForm = () => {
    setDonorName('');
    setDonorNameTa('');
    setArea('');
    setVillage('');
    setCountry(DEFAULT_COUNTRY);
    setState(DEFAULT_STATE);
    setPhone('');
    setNotes('');
    setAmount('');
    setPhysicalBookReceiptNo('');
    setGpayTransactionId('');
    setItemDescription('');
    setQuantity('');
    setApproximateUnitRate('');
    setSelectedFamilyId('');
    setSelectedPledgeId('');
    setErrorMessage('');
    setDonorSuggestions([]);
    setShowDonorDropdown(false);
    setAreaSuggestions([]);
    setShowAreaDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!donorName.trim()) {
      setErrorMessage(t('donation.enterDonorName', 'Donor name is mandatory'));
      return;
    }

    if (paymentMode === 'CASH') {
      if (!amount || parseFloat(amount) <= 0) {
        setErrorMessage(t('donation.enterValidAmount', 'Please enter a valid positive cash amount'));
        return;
      }
      if (!physicalBookReceiptNo.trim()) {
        setErrorMessage(
          t('donation.enterBookReceipt', 'Physical Receipt Book No is mandatory for cash collections')
        );
        return;
      }
    } else if (paymentMode === 'GPAY_ONLINE') {
      if (!amount || parseFloat(amount) <= 0) {
        setErrorMessage(t('donation.enterValidAmount', 'Please enter a valid positive donation amount'));
        return;
      }
      if (!gpayTransactionId.trim()) {
        setErrorMessage(
          t('donation.enterGPayTxn', 'GPay Transaction ID / UTR is mandatory for online payments')
        );
        return;
      }
    } else if (paymentMode === 'IN_KIND') {
      if (!itemDescription.trim()) {
        setErrorMessage(t('donation.enterItemDesc', 'Material item description is required'));
        return;
      }
      if (computedInKindTotal <= 0) {
        setErrorMessage(t('donation.enterValidQtyRate', 'Please enter valid quantity and unit rate'));
        return;
      }
    }

    setSubmitting(true);

    try {
      const loc = area.trim() || village.trim();
      const payload = {
        donationDate,
        donorSource,
        donorName: donorName.trim(),
        donorNameTa: donorNameTa.trim() || undefined,
        area: loc || undefined,
        village: loc || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
        phone: phone.trim() || undefined,
        paymentMode,
        notes: notes.trim() || undefined,
        familyId: donorSource === 'VILLAGE_FAMILY_DRIVE' && selectedFamilyId ? selectedFamilyId : undefined,
        driveId: donorSource === 'VILLAGE_FAMILY_DRIVE' && selectedDriveId ? selectedDriveId : undefined,
        pledgeId: selectedPledgeId || undefined,
      };

      if (paymentMode === 'CASH') {
        payload.amount = parseFloat(amount);
        payload.physicalBookReceiptNo = physicalBookReceiptNo.trim();
      } else if (paymentMode === 'GPAY_ONLINE') {
        payload.amount = parseFloat(amount);
        payload.gpayTransactionId = gpayTransactionId.trim();
      } else if (paymentMode === 'IN_KIND') {
        payload.amount = computedInKindTotal;
        payload.itemCategory = itemCategory;
        payload.itemDescription = itemDescription.trim();
        payload.quantity = parseFloat(quantity);
        payload.unit = unit;
        payload.approximateUnitRate = parseFloat(approximateUnitRate);
        payload.storageLocation = storageLocation.trim() || undefined;
      }

      const response = await recordDonation(payload);
      setSuccessReceipt(response);
      setIsReceiptModalOpen(true);
      resetForm();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record donation. Please verify and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFamilies = families.filter(
    (f) =>
      !familySearch ||
      f.familyCode?.toLowerCase().includes(familySearch.toLowerCase()) ||
      f.headName?.toLowerCase().includes(familySearch.toLowerCase()) ||
      (f.headNameTa && f.headNameTa.includes(familySearch))
  );

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Title */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
          <Sparkles className="w-4 h-4" />
          <span>{t('admin.bilingualEntry', 'Fast Bilingual Entry Form')}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {t('admin.donationEntryTitle', 'Record Community Donation / புதிய நன்கொடை பதிவு')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t(
            'admin.donationEntrySubtitle',
            'Issue digital receipts, attach to family drives or pledges, and print/WhatsApp instant receipts.'
          )}
        </p>
      </div>

      {/* Success Notification Banner */}
      {successReceipt && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-emerald-900">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">
                {t('donation.recordSuccess', 'Donation successfully posted to live ledger!')}
              </div>
              <div className="text-xs text-emerald-700">
                {t('receipt.receiptNumber')}:{' '}
                <span className="font-mono font-bold text-emerald-900">
                  {successReceipt.receiptNo}
                </span>{' '}
                • {successReceipt.donorName} • {formatCurrency(successReceipt.amount)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            {t('donation.viewPrintReceipt', 'View & Share Receipt')}
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
        {/* Step 1: Payment Mode Selection Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            1. {t('donation.selectPaymentMode', 'Payment Mode / கட்டண முறை')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMode('CASH')}
              className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                paymentMode === 'CASH'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold">{t('paymentModes.CASH', 'Cash')}</div>
                <div className="text-[11px] text-slate-500">ரொக்கம் (Book Receipt #)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('GPAY_ONLINE')}
              className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                paymentMode === 'GPAY_ONLINE'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold">{t('paymentModes.GPAY_ONLINE', 'GPay / Online')}</div>
                <div className="text-[11px] text-slate-500">ஜிபே / வங்கி (UTR / Txn ID)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('IN_KIND')}
              className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                paymentMode === 'IN_KIND'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold">{t('paymentModes.IN_KIND', 'In-Kind Material')}</div>
                <div className="text-[11px] text-slate-500">பொருட்கள் (சிமெண்ட், கம்பி...)</div>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Source Allocation (General Public vs Village Family Drive) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            2. {t('donation.donorSource', 'Contribution Category / நிதி வகை')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDonorSource('GENERAL_PUBLIC')}
              className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                donorSource === 'GENERAL_PUBLIC'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <User className="w-5 h-5 text-amber-600" />
              <div>
                <div className="text-sm font-bold">
                  {t('categories.generalDevotee', 'General Devotee')}
                </div>
                <div className="text-[11px] text-slate-500">பொது நன்கொடையாளர்</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDonorSource('VILLAGE_FAMILY_DRIVE')}
              className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                donorSource === 'VILLAGE_FAMILY_DRIVE'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <Building className="w-5 h-5 text-amber-600" />
              <div>
                <div className="text-sm font-bold">
                  {t('categories.villageDrive', 'Village Family Drive')}
                </div>
                <div className="text-[11px] text-slate-500">கிராம வரி / தவணை நிதி</div>
              </div>
            </button>
          </div>

          {/* Drive & Family Pickers (If Village Family Drive) */}
          {donorSource === 'VILLAGE_FAMILY_DRIVE' && (
            <div className="mt-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('nav.drives', 'Target Drive')} *
                </label>
                <select
                  value={selectedDriveId}
                  onChange={(e) => setSelectedDriveId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium"
                >
                  {drives.map((d) => (
                    <option key={d.id || d.driveId} value={d.id || d.driveId}>
                      {d.code} - {d.name} {d.nameTa ? `(${d.nameTa})` : ''} - ₹
                      {Number(d.defaultTargetPerFamily || d.targetAmount || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('drive.selectFamily', 'Select Family / குடும்பம்')} *
                </label>
                <input
                  type="text"
                  placeholder="Filter by Code or Name..."
                  value={familySearch}
                  onChange={(e) => setFamilySearch(e.target.value)}
                  className="w-full mb-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <select
                  value={selectedFamilyId}
                  onChange={(e) => handleFamilySelect(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium"
                >
                  <option value="">-- Choose Family ({filteredFamilies.length} available) --</option>
                  {filteredFamilies.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.familyCode} - {f.headName} {f.headNameTa ? `(${f.headNameTa})` : ''} ({f.village || 'Main Village'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Optional Pledge Tagging */}
          {pledges.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
              <span>{t('donation.tagPledge', 'Tag to Devotee Pledge installment (Optional):')}</span>
              <select
                value={selectedPledgeId}
                onChange={(e) => setSelectedPledgeId(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="">None (Standalone Donation)</option>
                {pledges.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.pledgeCode} - {p.donorName} ({p.pledgeType} - Target: ₹
                    {Number(p.targetMonetaryAmount || 0).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Step 3: Donor Particulars & Location (Bilingual & Cascading) */}
        <div className="border-t border-slate-100 pt-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            3. {t('donation.donorDetails', 'Donor Information / நன்கொடையாளர் விவரம்')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Donor Name (English) with Smart Autocomplete */}
            <div className="relative" ref={donorDropdownRef}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('donation.donorNameEn', 'Donor Name (English)')} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="e.g. S. Muthukumar"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  onFocus={() => {
                    if (donorSuggestions.length > 0) setShowDonorDropdown(true);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
              {showDonorDropdown && donorSuggestions.length > 0 && (
                <ul className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-amber-300 rounded-xl shadow-xl divide-y divide-slate-100 text-xs">
                  {donorSuggestions.map((s, idx) => (
                    <li
                      key={`${s.donorName}-${s.area || s.village}-${idx}`}
                      onClick={() => handleSelectDonorSuggestion(s)}
                      className="p-2.5 hover:bg-amber-50 cursor-pointer transition flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>
                          {s.donorName} {s.donorNameTa ? `(${s.donorNameTa})` : ''}
                        </span>
                        {s.familyCode && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono">
                            {s.familyCode}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{[s.area || s.village, s.state, s.country].filter(Boolean).join(', ')}</span>
                        {s.phone && <span>• 📞 {s.phone}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Donor Name (Tamil) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('donation.donorNameTa', 'பெயர் (தமிழ் - விருப்பத்தேர்வு)')}
              </label>
              <input
                type="text"
                placeholder="எ.கா. சு. முத்துக்குமார்"
                value={donorNameTa}
                onChange={(e) => setDonorNameTa(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-tamil focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('receipt.phone', 'Phone Number (For WhatsApp Receipt)')}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Country (Cascading Parent Dropdown) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('forms.country', 'Country')}
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* State (Cascading Child Dropdown) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('forms.state', 'State / Province')}
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {availableStates.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Area / Village with Autocomplete */}
            <div className="relative" ref={areaDropdownRef}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('forms.area', 'Area / Village')}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder={t('forms.areaSearchHint', 'Search or enter area / street...')}
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setVillage(e.target.value);
                  }}
                  onFocus={() => {
                    if (areaSuggestions.length > 0) setShowAreaDropdown(true);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
              {showAreaDropdown && areaSuggestions.length > 0 && (
                <ul className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-amber-300 rounded-xl shadow-xl divide-y divide-slate-100 text-xs">
                  {areaSuggestions.map((a, idx) => (
                    <li
                      key={`${a}-${idx}`}
                      onClick={() => handleSelectAreaSuggestion(a)}
                      className="p-2.5 hover:bg-amber-50 cursor-pointer font-medium text-slate-800 transition"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Donation Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('receipt.date', 'Donation Date')} *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Remarks / Memo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('receipt.notes', 'Remarks / Memo')}
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. In memory of Late..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Mode Specific Financial Entries */}
        <div className="border-t border-slate-100 pt-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            4. {t('donation.paymentDetails', 'Financial Details / கட்டண விவரங்கள்')}
          </label>

          {/* CASH MODE */}
          {paymentMode === 'CASH' && (
            <div className="p-4 sm:p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">
                  {t('donation.amountInr', 'Donation Amount (₹)')} *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">
                  {t('donation.physicalBookReceipt', 'Physical Receipt Book No / ரசீது புத்தக எண்')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BOOK-12 / RCT-42"
                  value={physicalBookReceiptNo}
                  onChange={(e) => setPhysicalBookReceiptNo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-emerald-800 mt-1 block">
                  Mandatory: Matches temple printed physical receipt slip.
                </span>
              </div>
            </div>
          )}

          {/* GPAY / ONLINE MODE */}
          {paymentMode === 'GPAY_ONLINE' && (
            <div className="p-4 sm:p-5 bg-sky-50/50 rounded-2xl border border-sky-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-sky-950 mb-1">
                  {t('donation.amountInr', 'Donation Amount (₹)')} *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-sky-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-sky-950 mb-1">
                  {t('donation.gpayTxnId', 'GPay Transaction ID / UTR / பரிவர்த்தனை எண்')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 429381749281 (12 digits)"
                  value={gpayTransactionId}
                  onChange={(e) => setGpayTransactionId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-sky-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[11px] text-sky-800 mt-1 block">
                  Mandatory: System validates against duplicate bank entries.
                </span>
              </div>
            </div>
          )}

          {/* IN_KIND MODE */}
          {paymentMode === 'IN_KIND' && (
            <div className="p-4 sm:p-5 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    {t('donation.itemCategory', 'Material Category / பொருள் வகை')} *
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full p-2.5 bg-white border border-purple-300 rounded-xl text-sm font-semibold"
                  >
                    <option value="CEMENT">CEMENT (சிமெண்ட் மூட்டைகள்)</option>
                    <option value="RIVER_SAND">RIVER SAND (ஆற்று மணல்)</option>
                    <option value="STEEL">STEEL / TMT (கம்பி)</option>
                    <option value="DOORS">DOORS / WOOD (கதவுகள் / மரம்)</option>
                    <option value="ELECTRICAL">ELECTRICAL (மின்சாதனங்கள்)</option>
                    <option value="OTHER">OTHER (இதர பொருட்கள்)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    {t('donation.itemDescription', 'Item Description / விவரம்')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50 Bags Ultratech Grade 53 Cement"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-purple-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    {t('donation.quantity', 'Quantity')} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    placeholder="50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    {t('donation.unit', 'Unit')} *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2 bg-white border border-purple-300 rounded-xl text-sm font-semibold"
                  >
                    <option value="BAGS">BAGS (மூட்டைகள்)</option>
                    <option value="LOADS">LOADS (லாரிகள்)</option>
                    <option value="PIECES">PIECES (எண்ணிக்கை)</option>
                    <option value="METERS">METERS (மீட்டர்)</option>
                    <option value="TONS">TONS (டன்கள்)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1">
                    {t('donation.unitRate', 'Rate per Unit (₹)')} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="420"
                    value={approximateUnitRate}
                    onChange={(e) => setApproximateUnitRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div className="bg-purple-100 p-2 rounded-xl text-center">
                  <div className="text-[10px] font-bold uppercase text-purple-800">
                    Auto Valuation
                  </div>
                  <div className="text-sm font-black text-purple-950 truncate">
                    {formatCurrency(computedInKindTotal)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">
                  {t('receipt.storageLocation', 'On-Site Storage Location')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. West Storage Shed / Temple Compound"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-sm font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
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
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-bold shadow-md hover:from-amber-700 hover:to-orange-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{t('donation.submitDonation', 'Post Donation & Generate Receipt / ரசீது உருவாக்கு')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Instant Digital Receipt Modal */}
      {successReceipt && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          receiptNo={successReceipt.receiptNo}
          receiptData={successReceipt}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RotateCw,
  TrendingUp,
  Building,
  Target,
  DollarSign,
  ChevronDown,
  X,
  Receipt,
  FileText,
  Percent
} from 'lucide-react';
import { getPublicDrives, getDriveFamilyProgress, getTransactions } from '../services/api';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import ReceiptModal from '../components/ReceiptModal';
import ExcelDataGrid from '../components/ExcelDataGrid';

export default function DriveProgressBoard() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';

  // Drive state
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [driveProgress, setDriveProgress] = useState(null);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState(null);

  // Family History Modal state
  const [historyFamily, setHistoryFamily] = useState(null);
  const [familyHistoryList, setFamilyHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Receipt Modal state
  const [selectedReceiptNo, setSelectedReceiptNo] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // 1. Initial Load of all public drives
  useEffect(() => {
    async function loadDrives() {
      try {
        setLoadingDrives(true);
        setError(null);
        const drivesData = await getPublicDrives();
        setDrives(drivesData || []);
        if (drivesData && drivesData.length > 0) {
          const activeDrive = drivesData.find((d) => d.status === 'ACTIVE') || drivesData[0];
          setSelectedDriveId(activeDrive.id);
        }
      } catch (err) {
        console.error('Failed to load drives:', err);
        setError(err.message || 'Failed to load community drives');
      } finally {
        setLoadingDrives(false);
      }
    }
    loadDrives();
  }, []);

  // 2. Load drive progress when selectedDriveId changes
  const loadProgress = async () => {
    if (!selectedDriveId) return;
    try {
      setLoadingProgress(true);
      setError(null);
      const data = await getDriveFamilyProgress(selectedDriveId);
      setDriveProgress(data);
    } catch (err) {
      console.error('Failed to load drive progress:', err);
      setError(err.message || 'Failed to load drive progress details');
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [selectedDriveId]);

  // Handle "View History" click for a family
  const handleOpenFamilyHistory = async (family) => {
    setHistoryFamily(family);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await getTransactions({
        search: family.familyCode || family.headName,
        flowType: 'INCOME',
        size: 50,
      });
      setFamilyHistoryList(res.content || []);
    } catch (err) {
      console.error('Failed to load family payment history:', err);
      setFamilyHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open single receipt modal
  const handleOpenReceipt = (receiptNo) => {
    setSelectedReceiptNo(receiptNo);
    setReceiptModalOpen(true);
  };

  const selectedDrive = drives.find((d) => d.id === selectedDriveId);

  // Define Columns for the Family Contributions Grid
  const columns = useMemo(() => [
    {
      key: 'familyCode',
      header: 'Family Code',
      headerTa: 'குடும்ப எண்',
      type: 'text',
      width: 'w-28',
      render: (val) => (
        <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
          {val}
        </span>
      ),
    },
    {
      key: 'headName',
      header: 'Head of Family (EN)',
      headerTa: 'தலைவர் பெயர் (ஆங்கிலம்)',
      type: 'text',
      render: (val) => <span className="font-bold text-slate-900">{val}</span>,
    },
    {
      key: 'headNameTa',
      header: 'Head of Family (Tamil)',
      headerTa: 'குடும்ப தலைவர் பெயர் (தமிழ்)',
      type: 'text',
      render: (val) => <span className="font-semibold text-slate-800">{val || '-'}</span>,
    },
    {
      key: 'street',
      header: 'Street / Village',
      headerTa: 'தெரு / ஊர்',
      type: 'text',
      render: (val, row) => {
        const fullAddr = [row.doorNo, val, row.village].filter(Boolean).join(', ');
        return (
          <span className="text-slate-600 truncate block max-w-xs" title={fullAddr}>
            {fullAddr || row.village || 'ஓதலவாடி'}
          </span>
        );
      },
    },
    {
      key: 'targetAmount',
      header: 'Target (₹)',
      headerTa: 'இலக்கு (₹)',
      type: 'number',
      align: 'right',
      width: 'w-28',
      render: (val) => <span className="font-mono font-semibold text-slate-700">{formatCurrency(val)}</span>,
    },
    {
      key: 'paidAmount',
      header: 'Paid (₹)',
      headerTa: 'செலுத்தியது (₹)',
      type: 'number',
      align: 'right',
      width: 'w-28',
      render: (val) => (
        <span className="font-mono font-bold text-emerald-700 text-sm">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'balanceAmount',
      header: 'Remaining Due (₹)',
      headerTa: 'நிலுவை (₹)',
      type: 'number',
      align: 'right',
      width: 'w-28',
      render: (val) => {
        const num = parseFloat(val) || 0;
        return (
          <span
            className={`font-mono font-bold text-sm ${
              num > 0 ? 'text-rose-700' : 'text-slate-400'
            }`}
          >
            {formatCurrency(val)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      headerTa: 'நிலை',
      type: 'text',
      width: 'w-28',
      render: (val) => {
        if (val === 'PAID') {
          return (
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{isTamil ? 'முழுவதும் செலுத்தியது' : 'Paid in Full'}</span>
            </span>
          );
        }
        if (val === 'PARTIAL') {
          return (
            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold text-[11px]">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>{isTamil ? 'தவணை செலுத்துகிறது' : 'Partially Paid'}</span>
            </span>
          );
        }
        if (val === 'PENDING') {
          return (
            <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-bold text-[11px]">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>{isTamil ? 'தொடங்கவில்லை' : 'Pending'}</span>
            </span>
          );
        }
        if (val === 'OPTED_OUT') {
          return (
            <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-semibold text-[11px]">
              <span>{isTamil ? 'விலக்கு பெற்றது' : 'Opted Out'}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-semibold text-[11px]">
            <span>{isTamil ? 'விதிவிலக்கு' : 'Exempted'}</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'History',
      headerTa: 'ரசீதுகள்',
      sortable: false,
      filterable: false,
      align: 'center',
      width: 'w-24',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => handleOpenFamilyHistory(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-amber-50 text-amber-800 transition shadow-2xs"
          title="View Receipts History"
        >
          <Eye className="w-3 h-3" />
          <span>{isTamil ? 'ரசீதுகள்' : 'Receipts'}</span>
        </button>
      ),
    },
  ], [isTamil]);

  return (
    <div className="space-y-6">
      {/* Page Title & Drive Selector Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-amber-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isTamil ? 'கிராம குடும்ப பங்களிப்பு பலகை' : 'Village Family Contribution Board'}
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {isTamil
                ? 'திருப்பணி திட்டங்களுக்கான குடும்ப வாரியான தீர்மான இலக்கு, செலுத்திய நிதி மற்றும் நிலுவை விவரம்.'
                : 'Target commitment fulfillment progress for all village families per renovation drive.'}
            </p>
          </div>

          {/* Drive Selector Dropdown & Refresh */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              disabled={loadingDrives || drives.length === 0}
              className="text-xs sm:text-sm font-semibold py-2.5 px-3 bg-amber-50/70 border border-amber-300 text-amber-950 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
            >
              {drives.map((d) => {
                const driveTitle = isTamil && d.nameTa ? d.nameTa : d.name;
                return (
                  <option key={d.id} value={d.id}>
                    {d.code}: {driveTitle} ({formatCurrency(d.defaultTargetPerFamily)})
                  </option>
                );
              })}
            </select>

            <button
              type="button"
              onClick={loadProgress}
              disabled={loadingProgress}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs"
              title="Refresh Drive Data"
            >
              <RotateCw className={`w-4 h-4 ${loadingProgress ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Selected Drive Description Banner */}
        {selectedDrive && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              <span className="font-bold text-slate-800 mr-2">
                {isTamil && selectedDrive.nameTa ? selectedDrive.nameTa : selectedDrive.name}
              </span>
              {selectedDrive.description && (
                <span className="text-slate-500 italic">“{selectedDrive.description}”</span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Default Target: <span className="font-bold text-slate-800">{formatCurrency(selectedDrive.defaultTargetPerFamily)}</span> / குடும்பம்
            </div>
          </div>
        )}
      </div>

      {/* Drive Summary KPI Cards Grid with Progress Bar */}
      {driveProgress && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
                <span>{isTamil ? 'மொத்த இலக்கு' : 'Target Target Amount'}</span>
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(driveProgress.totalTargetAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {driveProgress.participatingCount} {isTamil ? 'பங்கேற்கும் குடும்பங்கள்' : 'participating families'}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
                <span>{isTamil ? 'வசூலான தொகை' : 'Total Collected'}</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                {formatCurrency(driveProgress.totalCollectedAmount)}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                {formatPercentage(driveProgress.completionPercentage)} {isTamil ? 'நிறைவுற்றது' : 'completed'}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
                <span>{isTamil ? 'நிலுவை தொகை' : 'Remaining Pending'}</span>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
                {formatCurrency(driveProgress.totalPendingAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {isTamil ? 'வசூலிக்க வேண்டிய தொகை' : 'Yet to be collected'}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
                <span>{isTamil ? 'நிறைவு சதவிகிதம்' : 'Progress Rate'}</span>
                <Percent className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
                {formatPercentage(driveProgress.completionPercentage)}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(driveProgress.completionPercentage || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AG Grid Table with Excel Column Filters */}
      <ExcelDataGrid
        columns={columns}
        data={driveProgress?.families || []}
        loading={loadingProgress}
        title={isTamil ? 'குடும்பங்களின் பங்களிப்பு விவரம்' : 'Family Contributions Status'}
        subtitle={isTamil ? 'ஒவ்வொரு நெடுவரிசையிலும் வரிசைப்படுத்தலாம், தேடலாம் மற்றும் வடிகட்டலாம்' : 'Search, sort, filter, and export family contributions to Excel'}
        amountField="paidAmount"
        exportFileName={`Othalavadi_Family_Drive_${selectedDrive?.code || 'Progress'}`}
        emptyMessage={isTamil ? 'குடும்ப பங்களிப்பு விவரம் இல்லை' : 'No family records found for this drive'}
      />

      {/* Family Installment Payment History Modal */}
      {historyModalOpen && historyFamily && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setHistoryModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <Receipt className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {historyFamily.headNameTa || historyFamily.headName} ({historyFamily.familyCode})
                  </h3>
                  <p className="text-xs text-slate-300">
                    {t('tables.paymentHistory', 'Payment History / ரசீது விவரம்')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Family Summary Card */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[11px] font-semibold">{t('tables.target', 'Target')}</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5 font-mono">
                  {formatCurrency(historyFamily.targetAmount)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[11px] font-semibold">{t('tables.paid', 'Paid')}</span>
                <span className="font-bold text-emerald-700 text-sm block mt-0.5 font-mono">
                  {formatCurrency(historyFamily.paidAmount)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[11px] font-semibold">{t('tables.due', 'Due')}</span>
                <span className="font-bold text-rose-700 text-sm block mt-0.5 font-mono">
                  {formatCurrency(historyFamily.balanceAmount)}
                </span>
              </div>
            </div>

            {/* History Table */}
            <div className="p-4 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-7 w-7 border-3 border-amber-600 border-t-transparent mb-2" />
                  <p className="text-xs text-slate-500">{t('common.loading', 'Loading receipts...')}</p>
                </div>
              ) : familyHistoryList.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>{t('tables.noHistoryFound', 'No payment receipts found for this family')}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {familyHistoryList.map((item) => (
                    <div
                      key={item.id || item.referenceNo}
                      className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:border-amber-300 transition shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {item.referenceNo}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {formatDate(item.date)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.paymentMode === 'CASH'
                            ? (isTamil ? 'ரொக்கம்' : 'Cash')
                            : item.paymentMode === 'GPAY_ONLINE'
                            ? 'GPay'
                            : (isTamil ? 'பொருள்' : 'In-Kind')}
                          {item.bookNo && ` (Bk ${item.bookNo})`}
                          {item.manualReceiptNo && ` (Slip ${item.manualReceiptNo})`}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-emerald-700 text-sm font-mono">
                          {formatCurrency(item.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(item.referenceNo)}
                          className="p-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                          title="View Digital Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
              >
                {t('buttons.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedReceiptNo(null);
        }}
        receiptNo={selectedReceiptNo}
      />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
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
} from 'lucide-react';
import { getPublicDrives, getDriveFamilyProgress, getTransactions } from '../services/api';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import ReceiptModal from '../components/ReceiptModal';

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

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
          // Default to the first drive (or active drive)
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
  useEffect(() => {
    if (!selectedDriveId) return;

    async function loadProgress() {
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
    }
    loadProgress();
  }, [selectedDriveId]);

  // 3. Filter families list based on live search and status filter
  const filteredFamilies = useMemo(() => {
    if (!driveProgress?.families) return [];

    return driveProgress.families.filter((fam) => {
      // Status filter
      if (statusFilter !== 'ALL' && fam.status !== statusFilter) {
        return false;
      }

      // Search query across code, English/Tamil head name, street, village
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = fam.familyCode && fam.familyCode.toLowerCase().includes(q);
        const nameEnMatch = fam.headName && fam.headName.toLowerCase().includes(q);
        const nameTaMatch = fam.headNameTa && fam.headNameTa.toLowerCase().includes(q);
        const streetMatch = fam.street && fam.street.toLowerCase().includes(q);
        const villageMatch = fam.village && fam.village.toLowerCase().includes(q);

        if (!codeMatch && !nameEnMatch && !nameTaMatch && !streetMatch && !villageMatch) {
          return false;
        }
      }

      return true;
    });
  }, [driveProgress, statusFilter, searchQuery]);

  // 4. Handle "View History" click for a family
  const handleOpenFamilyHistory = async (family) => {
    setHistoryFamily(family);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      // Query transactions for this family head name
      const res = await getTransactions({
        search: family.headName,
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

  // 5. Open single receipt modal
  const handleOpenReceipt = (receiptNo) => {
    setSelectedReceiptNo(receiptNo);
    setReceiptModalOpen(true);
  };

  const selectedDrive = drives.find((d) => d.id === selectedDriveId);

  return (
    <div className="space-y-6">
      {/* Page Title & Drive Selector Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-amber-600" />
              <h1 className="text-2xl font-bold text-slate-900">
                {t('nav.drives')}
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {t('dashboard.viewFamilyDrivesDesc')}
            </p>
          </div>

          {/* Drive Selector Dropdown */}
          <div className="flex items-center space-x-3">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              {t('tables.selectDrive')}:
            </label>
            <div className="relative min-w-[240px] sm:min-w-[300px]">
              <select
                value={selectedDriveId}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                disabled={loadingDrives || drives.length === 0}
                className="w-full text-xs sm:text-sm font-semibold py-2.5 pl-3 pr-8 bg-amber-50/70 border border-amber-200 text-amber-950 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer transition"
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
            </div>
          </div>
        </div>

        {/* Selected Drive Description & Dates if present */}
        {selectedDrive && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              <span className="font-semibold text-slate-700 mr-2">
                {isTamil && selectedDrive.nameTa ? selectedDrive.nameTa : selectedDrive.name}
              </span>
              {selectedDrive.description && (
                <span className="text-slate-500 italic">
                  — {selectedDrive.description}
                </span>
              )}
            </div>
            {selectedDrive.startDate && (
              <div className="text-slate-400">
                {formatDate(selectedDrive.startDate)}{' '}
                {selectedDrive.endDate ? `to ${formatDate(selectedDrive.endDate)}` : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary KPI Banner & Progress Bar */}
      {driveProgress && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-5 sm:p-7 shadow-md">
          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-slate-700/60">
            <div>
              <span className="text-xs text-amber-300 font-medium block">
                {t('tables.targetTotal')}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-white mt-1 block">
                {formatCurrency(driveProgress.totalTargetAmount)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {t('tables.totalFamilies')}: {driveProgress.totalFamiliesCount}
              </span>
            </div>

            <div>
              <span className="text-xs text-emerald-400 font-medium block">
                {t('tables.collectedTotal')}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1 block">
                {formatCurrency(driveProgress.totalCollectedAmount)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {t('tables.participating')}: {driveProgress.participatingCount}
              </span>
            </div>

            <div>
              <span className="text-xs text-rose-300 font-medium block">
                {t('tables.pendingTotal')}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-rose-400 mt-1 block">
                {formatCurrency(driveProgress.totalPendingAmount)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {t('tables.optedOutCount')}: {driveProgress.optedOutCount}
              </span>
            </div>

            <div>
              <span className="text-xs text-amber-300 font-medium block">
                {t('tables.completion')}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-white mt-1 block">
                {formatPercentage(driveProgress.completionPercentage)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {t('tables.exemptedCount')}: {driveProgress.exemptedCount}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between items-center text-xs text-slate-300 font-medium mb-1.5">
              <span>{t('tables.completion')}</span>
              <span className="font-bold text-amber-300">
                {formatPercentage(driveProgress.completionPercentage)}
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-700/80 rounded-full overflow-hidden p-0.5 border border-slate-600/50">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Number(driveProgress.completionPercentage) || 0)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Family Search & Status Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Live Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('tables.searchFamilyPlaceholder')}
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'ALL', label: t('common.all') },
            { id: 'PAID', label: t('statuses.paid') },
            { id: 'PARTIAL', label: t('statuses.partial') },
            { id: 'PENDING', label: t('statuses.pending') },
            { id: 'OPTED_OUT', label: t('statuses.optedOut') },
            { id: 'EXEMPTED', label: t('statuses.exempted') },
          ].map((item) => {
            const isSelected = statusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Family Progress Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loadingProgress ? (
          <div className="py-20 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-amber-600 border-t-transparent mb-2" />
            <p className="text-xs">{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="mt-2 text-rose-700 font-semibold">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{t('tables.familyCode')}</th>
                  <th className="py-3 px-4">{t('tables.headName')}</th>
                  <th className="py-3 px-4">{t('tables.village')}</th>
                  <th className="py-3 px-4 text-right">{t('tables.target')}</th>
                  <th className="py-3 px-4 text-right">{t('tables.paid')}</th>
                  <th className="py-3 px-4 text-right">{t('tables.due')}</th>
                  <th className="py-3 px-4 text-center">{t('tables.status')}</th>
                  <th className="py-3 px-4 text-center">{t('tables.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFamilies.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">
                        {t('tables.noRecords')}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredFamilies.map((fam) => {
                    const isPaid = fam.status === 'PAID';
                    const isPartial = fam.status === 'PARTIAL';
                    const isPending = fam.status === 'PENDING';
                    const isOptedOut = fam.status === 'OPTED_OUT';
                    const isExempted = fam.status === 'EXEMPTED';

                    return (
                      <tr
                        key={fam.familyId}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Family Code */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {fam.familyCode}
                        </td>

                        {/* Head of Family (Tamil & English) */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">
                            {fam.headNameTa || fam.headName}
                          </div>
                          {fam.headNameTa && fam.headName && (
                            <div className="text-[11px] text-slate-500">
                              {fam.headName}
                            </div>
                          )}
                        </td>

                        {/* Village / Street Address */}
                        <td className="py-3 px-4 text-slate-600">
                          {[fam.doorNo, fam.street, fam.village]
                            .filter(Boolean)
                            .join(', ')}
                        </td>

                        {/* Target Amount */}
                        <td className="py-3 px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                          {formatCurrency(fam.targetAmount)}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                          {formatCurrency(fam.paidAmount)}
                        </td>

                        {/* Balance Due */}
                        <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                          <span
                            className={
                              fam.balanceAmount > 0
                                ? 'text-rose-700'
                                : 'text-slate-400'
                            }
                          >
                            {formatCurrency(fam.balanceAmount)}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isPaid && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {t('statuses.paid')}
                            </span>
                          )}
                          {isPartial && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 mr-1" />
                              {t('statuses.partial')}
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {t('statuses.pending')}
                            </span>
                          )}
                          {isOptedOut && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {t('statuses.optedOut')}
                            </span>
                          )}
                          {isExempted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {t('statuses.exempted')}
                            </span>
                          )}
                        </td>

                        {/* Action: View History */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenFamilyHistory(fam)}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 transition cursor-pointer"
                            title={t('buttons.viewHistory')}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                            <span>{t('buttons.viewHistory')}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer showing count */}
        {driveProgress && (
          <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>
              {t('tables.totalFamilies')}: {filteredFamilies.length} / {driveProgress.families?.length || 0}
            </span>
          </div>
        )}
      </div>

      {/* Family Installment Payment History Modal */}
      {historyModalOpen && historyFamily && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {historyFamily.headNameTa || historyFamily.headName} ({historyFamily.familyCode})
                  </h3>
                  <p className="text-xs text-slate-300">
                    {t('tables.paymentHistory')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Family Summary Card */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">{t('tables.target')}</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {formatCurrency(historyFamily.targetAmount)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">{t('tables.paid')}</span>
                <span className="font-bold text-emerald-700 text-sm block mt-0.5">
                  {formatCurrency(historyFamily.paidAmount)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">{t('tables.due')}</span>
                <span className="font-bold text-rose-700 text-sm block mt-0.5">
                  {formatCurrency(historyFamily.balanceAmount)}
                </span>
              </div>
            </div>

            {/* History Table */}
            <div className="p-4 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-7 w-7 border-3 border-amber-600 border-t-transparent mb-2" />
                  <p className="text-xs text-slate-500">{t('common.loading')}</p>
                </div>
              ) : familyHistoryList.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>{t('tables.noHistoryFound')}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {familyHistoryList.map((item) => (
                    <div
                      key={item.id || item.referenceNo}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-amber-300 transition"
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
                            ? t('forms.cash')
                            : item.paymentMode === 'GPAY_ONLINE'
                            ? t('forms.gpay')
                            : item.paymentMode === 'IN_KIND'
                            ? t('forms.inKind')
                            : item.paymentMode}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-emerald-700 text-sm">
                          {formatCurrency(item.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(item.referenceNo)}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                          title={t('buttons.downloadReceipt')}
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
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
              >
                {t('buttons.close')}
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

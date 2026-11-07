import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Layers,
  Receipt,
  Printer,
  Share2,
  FileText,
  RotateCw,
  Banknote,
  Smartphone,
  Package,
  Calendar,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { getTransactions } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import ExcelDataGrid from '../components/ExcelDataGrid';
import IncomeLedger from './IncomeLedger';
import ExpenseLedger from './ExpenseLedger';
import ReceiptModal from '../components/ReceiptModal';

export default function MasterDataGrid() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isTamil = i18n.language === 'ta';

  // Active Tab: 'ALL' | 'INCOME' | 'EXPENSE'
  const tabParam = searchParams.get('tab')?.toUpperCase();
  const [activeTab, setActiveTab] = useState(
    tabParam === 'INCOME' ? 'INCOME' : tabParam === 'EXPENSE' ? 'EXPENSE' : 'ALL'
  );

  // Sync tab with URL
  useEffect(() => {
    if (tabParam === 'INCOME' || tabParam === 'EXPENSE' || tabParam === 'ALL') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'ALL' ? {} : { tab: tab.toLowerCase() });
  };

  // State for All Transactions tab
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [selectedReceiptNo, setSelectedReceiptNo] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Load all transactions
  const loadAllTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTransactions({ size: 1500 });
      const items = res?.content || (Array.isArray(res) ? res : []);
      setAllTransactions(items);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(err.message || 'Failed to load master ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ALL') {
      loadAllTransactions();
    }
  }, [activeTab]);

  // Overall Financial Totals for "All Transactions"
  const totals = useMemo(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    let inKindSum = 0;

    allTransactions.forEach((tx) => {
      const amt = parseFloat(tx.amount) || 0;
      if (tx.flowType === 'INCOME') incomeSum += amt;
      else if (tx.flowType === 'EXPENSE') expenseSum += amt;
      else if (tx.flowType === 'IN_KIND') inKindSum += amt;
    });

    const netLiquid = incomeSum - expenseSum;

    return {
      incomeSum,
      expenseSum,
      inKindSum,
      netLiquid,
      totalCount: allTransactions.length,
    };
  }, [allTransactions]);

  const handleOpenReceipt = (refNo) => {
    setSelectedReceiptNo(refNo);
    setReceiptModalOpen(true);
  };

  // Define Columns for All Transactions Grid
  const columns = useMemo(() => [
    {
      key: 'date',
      header: 'Date',
      headerTa: 'தேதி',
      type: 'date',
      width: 'w-24',
      render: (val) => (
        <span className="font-mono text-slate-700 whitespace-nowrap">{formatDate(val)}</span>
      ),
    },
    {
      key: 'flowType',
      header: 'Flow',
      headerTa: 'வரவு/செலவு',
      type: 'text',
      width: 'w-28',
      render: (val) => {
        if (val === 'INCOME') {
          return (
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold text-[11px]">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>{isTamil ? 'வரவு' : 'Income'}</span>
            </span>
          );
        }
        if (val === 'EXPENSE') {
          return (
            <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold text-[11px]">
              <TrendingDown className="w-3 h-3 text-rose-600" />
              <span>{isTamil ? 'செலவு' : 'Expense'}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold text-[11px]">
            <Package className="w-3 h-3 text-purple-600" />
            <span>{isTamil ? 'பொருள்' : 'In-Kind'}</span>
          </span>
        );
      },
    },
    {
      key: 'referenceNo',
      header: 'Ref / Voucher #',
      headerTa: 'ரசீது / பற்றுச்சீட்டு #',
      type: 'text',
      width: 'w-36',
      render: (val, row) => {
        const isIncome = row.flowType === 'INCOME' || row.flowType === 'IN_KIND';
        return (
          <button
            type="button"
            onClick={() => {
              if (isIncome) handleOpenReceipt(val);
              else setSelectedVoucher(row);
            }}
            className={`font-mono font-bold hover:underline inline-flex items-center gap-1 ${
              isIncome ? 'text-amber-700 hover:text-amber-900' : 'text-rose-700 hover:text-rose-900'
            }`}
            title="Click to view details"
          >
            {isIncome ? (
              <Receipt className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            )}
            <span>{val}</span>
          </button>
        );
      },
    },
    {
      key: 'category',
      header: 'Category / Purpose',
      headerTa: 'பிரிவு / திட்டம்',
      type: 'text',
      render: (val, row) => {
        const catLabel = isTamil && row.categoryTa ? row.categoryTa : val;
        return (
          <span className="font-semibold text-slate-800">
            {row.driveName ? `${row.driveName}` : catLabel}
          </span>
        );
      },
    },
    {
      key: 'partyName',
      header: 'Party (Donor / Vendor)',
      headerTa: 'நபர் / நிறுவனம்',
      type: 'text',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900">{val}</div>
          {row.donorNameTa && (
            <div className="text-[11px] text-slate-600">{row.donorNameTa}</div>
          )}
          {row.familyCode && (
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1 rounded">
              {row.familyCode}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'village',
      header: 'Village / Area',
      headerTa: 'ஊர் / பகுதி',
      type: 'text',
      render: (val, row) => (
        <span className="text-slate-600 truncate block max-w-xs">
          {val || row.area || (row.flowType === 'EXPENSE' ? '-' : 'ஓதலவாடி')}
        </span>
      ),
    },
    {
      key: 'paymentMode',
      header: 'Mode',
      headerTa: 'முறை',
      type: 'text',
      width: 'w-24',
      render: (val) => {
        if (val === 'CASH') return <span className="text-emerald-800 font-semibold text-[11px]">CASH</span>;
        if (val === 'GPAY_ONLINE') return <span className="text-sky-800 font-semibold text-[11px]">GPAY</span>;
        return <span className="text-purple-800 font-semibold text-[11px]">IN-KIND</span>;
      },
    },
    {
      key: 'amount',
      header: 'Amount (₹)',
      headerTa: 'தொகை (₹)',
      type: 'number',
      align: 'right',
      width: 'w-28',
      render: (val, row) => {
        const isExp = row.flowType === 'EXPENSE';
        return (
          <span
            className={`font-mono font-bold text-sm ${
              isExp ? 'text-rose-700' : row.paymentMode === 'IN_KIND' ? 'text-purple-700' : 'text-emerald-700'
            }`}
          >
            {isExp ? '-' : '+'}{formatCurrency(val)}
          </span>
        );
      },
    },
    {
      key: 'notes',
      header: 'Notes / Description',
      headerTa: 'விவரம்',
      type: 'text',
      hiddenByDefault: true,
      render: (val) => <span className="text-slate-500 italic truncate max-w-xs block">{val || '-'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerTa: 'செயல்கள்',
      sortable: false,
      filterable: false,
      align: 'center',
      width: 'w-24',
      render: (_, row) => {
        const isIncome = row.flowType === 'INCOME' || row.flowType === 'IN_KIND';
        return (
          <button
            type="button"
            onClick={() => {
              if (isIncome) handleOpenReceipt(row.referenceNo);
              else setSelectedVoucher(row);
            }}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title={isIncome ? 'View Receipt' : 'View Voucher'}
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        );
      },
    },
  ], [isTamil]);

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-6 h-6 text-amber-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isTamil ? 'முழு வரவு செலவு கணக்கு' : 'Complete Community Ledger'}
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {isTamil
                ? 'கோவிலின் அனைத்து நிதி வரவுகள், செலவுகள் மற்றும் பொருள் நன்கொடைகளின் நேரலை தணிக்கை பேரேடு.'
                : 'Auditable double-entry general ledger with separate dedicated views for incomes and expenses.'}
            </p>
          </div>

          {/* Quick Refresh */}
          {activeTab === 'ALL' && (
            <button
              type="button"
              onClick={loadAllTransactions}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition self-start md:self-auto shadow-xs"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('tables.refresh', 'Refresh')}</span>
            </button>
          )}
        </div>

        {/* 3 Prominent Section Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => handleTabChange('ALL')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isTamil ? 'அனைத்து பதிவுகள்' : 'All Transactions'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('INCOME')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isTamil ? 'வரவுகள் மட்டும் (Income)' : 'Income Only (வரவுகள்)'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('EXPENSE')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>{isTamil ? 'செலவுகள் மட்டும் (Expenses)' : 'Expenses Only (செலவுகள்)'}</span>
          </button>
        </div>
      </div>

      {/* Render Active Tab */}
      {activeTab === 'INCOME' && <IncomeLedger />}

      {activeTab === 'EXPENSE' && <ExpenseLedger />}

      {activeTab === 'ALL' && (
        <div className="space-y-6">
          {/* Net Liquid Position Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold mb-1">
                {isTamil ? 'மொத்த வரவு' : 'Total Monetary Collections'}
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                {formatCurrency(totals.incomeSum)}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold mb-1">
                {isTamil ? 'மொத்த செலவு' : 'Total Monetary Disbursements'}
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
                {formatCurrency(totals.expenseSum)}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold mb-1">
                {isTamil ? 'நிகர இருப்பு (கையிருப்பு)' : 'Net Liquid Balance'}
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(totals.netLiquid)}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold mb-1">
                {isTamil ? 'பொருள் நன்கொடை மதிப்பு' : 'In-Kind Valuation'}
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono">
                {formatCurrency(totals.inKindSum)}
              </div>
            </div>
          </div>

          {/* AG Grid Table with Excel Column Filters */}
          <ExcelDataGrid
            columns={columns}
            data={allTransactions}
            loading={loading}
            title={isTamil ? 'அனைத்து பரிவர்த்தனைகள்' : 'All General Ledger Entries'}
            subtitle={isTamil ? 'வரவுகள், செலவுகள் மற்றும் பொருள் நன்கொடைகளின் தொகுப்பு' : 'Combined double-entry journal postings with Excel-style column filters'}
            exportFileName="Othalavadi_Temple_Complete_Ledger"
            emptyMessage={isTamil ? 'எந்த பதிவும் கிடைக்கவில்லை' : 'No transaction records found'}
          />
        </div>
      )}

      {/* Digital Receipt Modal */}
      {receiptModalOpen && (
        <ReceiptModal
          isOpen={receiptModalOpen}
          receiptNo={selectedReceiptNo}
          onClose={() => {
            setReceiptModalOpen(false);
            setSelectedReceiptNo(null);
          }}
        />
      )}

      {/* Expense Voucher Modal */}
      {selectedVoucher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelectedVoucher(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900">
                1008 ஸ்ரீ விருஷபநாத ஜிநாலயம், ஓதலவாடி
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">செலவு பற்றுச்சீட்டு / Expense Voucher</p>
              <div className="inline-block mt-2 font-mono font-bold text-xs bg-rose-50 text-rose-800 px-3 py-1 rounded-full border border-rose-200">
                {selectedVoucher.referenceNo}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">தேதி / Date:</span>
                <span className="font-semibold text-slate-900">{formatDate(selectedVoucher.date)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">செலவு இனம் / Category:</span>
                <span className="font-semibold text-slate-900">{selectedVoucher.categoryTa || selectedVoucher.category}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">பெற்றவர் / Paid To:</span>
                <span className="font-bold text-slate-900">{selectedVoucher.partyName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">முறை / Payment Mode:</span>
                <span className="font-semibold text-slate-900">{selectedVoucher.paymentMode}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 bg-rose-50/50 px-2 rounded-lg">
                <span className="font-bold text-slate-700">செலவு தொகை / Amount:</span>
                <span className="font-mono font-bold text-rose-700 text-base">{formatCurrency(selectedVoucher.amount)}</span>
              </div>
              {selectedVoucher.notes && (
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">விவரம் / Notes:</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-800">
                    {selectedVoucher.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Banknote,
  Smartphone,
  Package,
  FileSpreadsheet,
  Receipt,
  Printer,
  Share2,
  Calendar,
  User,
  Phone,
  MapPin,
  Building,
  CheckCircle,
  ExternalLink,
  RotateCw,
  Search
} from 'lucide-react';
import { getTransactions } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import ExcelDataGrid from '../components/ExcelDataGrid';
import ReceiptModal from '../components/ReceiptModal';

export default function IncomeLedger() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';

  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected receipt for modal
  const [selectedReceiptNo, setSelectedReceiptNo] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Fetch all income and in-kind transactions
  const loadIncomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch income transactions with high page size
      const res = await getTransactions({ size: 1000 });
      const allTx = res?.content || (Array.isArray(res) ? res : []);
      // Filter only inflows: INCOME and IN_KIND
      const incomeTx = allTx.filter((tx) => tx.flowType === 'INCOME' || tx.flowType === 'IN_KIND');
      setIncomes(incomeTx);
    } catch (err) {
      console.error('Failed to load income entries:', err);
      setError(err.message || 'Failed to load income ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomeData();
  }, []);

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    let totalCash = 0;
    let totalGpay = 0;
    let totalInKind = 0;

    incomes.forEach((item) => {
      const amt = parseFloat(item.amount) || 0;
      if (item.paymentMode === 'CASH') totalCash += amt;
      else if (item.paymentMode === 'GPAY_ONLINE') totalGpay += amt;
      else if (item.paymentMode === 'IN_KIND' || item.flowType === 'IN_KIND') totalInKind += amt;
    });

    const totalMonetary = totalCash + totalGpay;
    const grandTotal = totalMonetary + totalInKind;

    return {
      totalMonetary,
      totalCash,
      totalGpay,
      totalInKind,
      grandTotal,
      count: incomes.length,
    };
  }, [incomes]);

  const handleOpenReceipt = (receiptNo) => {
    setSelectedReceiptNo(receiptNo);
    setIsReceiptModalOpen(true);
  };

  const handleShareWhatsApp = (item) => {
    const text = encodeURIComponent(
      `1008 ஸ்ரீ விருஷபநாத ஜிநாலயம், ஓதலவாடி\n\n` +
      `நன்கொடை ரசீது எண்: ${item.referenceNo}\n` +
      `நன்கொடையாளர்: ${item.donorNameTa || item.partyName}\n` +
      `தொகை: ₹${Number(item.amount || 0).toLocaleString('en-IN')}\n` +
      `முறை: ${item.paymentMode}\n` +
      `தேதி: ${formatDate(item.date)}\n\n` +
      `ரசீதை ஆன்லைனில் சரிபார்க்க: ${window.location.origin}/receipts/${item.referenceNo}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Define Columns for Income Ledger
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
      key: 'referenceNo',
      header: 'Receipt #',
      headerTa: 'ரசீது எண்',
      type: 'text',
      width: 'w-36',
      render: (val, row) => (
        <button
          type="button"
          onClick={() => handleOpenReceipt(val)}
          className="font-mono font-bold text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center gap-1"
          title="Click to view full receipt"
        >
          <Receipt className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>{val}</span>
        </button>
      ),
    },
    {
      key: 'bookNo',
      header: 'Book #',
      headerTa: 'புத்தக எண்',
      type: 'text',
      width: 'w-20',
      render: (val, row) => {
        if (row.bookNo) return <span className="font-mono font-semibold text-slate-700">Bk {row.bookNo}</span>;
        if (row.physicalBookReceiptNo && row.physicalBookReceiptNo.includes('/')) {
          const parts = row.physicalBookReceiptNo.split('/');
          return <span className="font-mono font-semibold text-slate-700">{parts[0].trim()}</span>;
        }
        return <span className="text-slate-300">-</span>;
      },
    },
    {
      key: 'manualReceiptNo',
      header: 'Slip #',
      headerTa: 'ரசீது சீட்டு #',
      type: 'text',
      width: 'w-24',
      render: (val, row) => {
        if (row.manualReceiptNo) return <span className="font-mono font-semibold text-slate-700">Slip {row.manualReceiptNo}</span>;
        if (row.physicalBookReceiptNo && row.physicalBookReceiptNo.includes('/')) {
          const parts = row.physicalBookReceiptNo.split('/');
          return <span className="font-mono font-semibold text-slate-700">{parts[1].trim()}</span>;
        }
        return <span className="text-slate-300">-</span>;
      },
    },
    {
      key: 'gpayTransactionId',
      header: 'GPay Txn ID / UTR',
      headerTa: 'ஜிபே / UTR எண்',
      type: 'text',
      width: 'w-36',
      render: (val) =>
        val ? (
          <span className="font-mono text-sky-800 bg-sky-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-sky-200">
            {val}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
    {
      key: 'partyName',
      header: 'Donor Name (English)',
      headerTa: 'நன்கொடையாளர் பெயர் (EN)',
      type: 'text',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900">{val}</div>
          {row.familyCode && (
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1 rounded">
              {row.familyCode}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'donorNameTa',
      header: 'Donor Name (Tamil)',
      headerTa: 'நன்கொடையாளர் பெயர் (தமிழ்)',
      type: 'text',
      render: (val) => (
        <span className="font-semibold text-slate-800">{val || '-'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      headerTa: 'தொலைபேசி',
      type: 'text',
      width: 'w-28',
      render: (val) =>
        val ? (
          <a
            href={`tel:${val}`}
            className="font-mono text-slate-700 hover:text-amber-700 inline-flex items-center gap-1"
          >
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{val}</span>
          </a>
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
    {
      key: 'village',
      header: 'Village / Area',
      headerTa: 'ஊர் / பகுதி',
      type: 'text',
      render: (val, row) => {
        const fullAddr = [row.doorNo, row.street, row.village || row.area]
          .filter(Boolean)
          .join(', ');
        return (
          <span className="text-slate-600 truncate block max-w-xs" title={fullAddr}>
            {fullAddr || val || row.area || 'ஓதலவாடி'}
          </span>
        );
      },
    },
    {
      key: 'category',
      header: 'Contribution Type',
      headerTa: 'நிதி வகை / திட்டம்',
      type: 'text',
      render: (val, row) => {
        const catLabel = isTamil && row.categoryTa ? row.categoryTa : val;
        const isDrive = row.driveName || val.includes('Drive') || row.categoryTa?.includes('குடும்ப');
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
              isDrive
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}
          >
            {row.driveName ? `${row.driveName}` : catLabel}
          </span>
        );
      },
    },
    {
      key: 'paymentMode',
      header: 'Payment Mode',
      headerTa: 'செலுத்திய முறை',
      type: 'text',
      width: 'w-28',
      render: (val) => {
        if (val === 'CASH') {
          return (
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-[11px]">
              <Banknote className="w-3 h-3 text-emerald-600" />
              <span>{isTamil ? 'ரொக்கம்' : 'Cash'}</span>
            </span>
          );
        }
        if (val === 'GPAY_ONLINE') {
          return (
            <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-semibold text-[11px]">
              <Smartphone className="w-3 h-3 text-sky-600" />
              <span>{isTamil ? 'ஜிபே / வங்கி' : 'GPay'}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-semibold text-[11px]">
            <Package className="w-3 h-3 text-purple-600" />
            <span>{isTamil ? 'பொருள் நன்கொடை' : 'In-Kind'}</span>
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount (₹)',
      headerTa: 'வரவு தொகை (₹)',
      type: 'number',
      align: 'right',
      width: 'w-28',
      render: (val, row) => (
        <span
          className={`font-mono font-bold text-sm ${
            row.paymentMode === 'IN_KIND' ? 'text-purple-700' : 'text-emerald-700'
          }`}
        >
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'inKindDetails',
      header: 'In-Kind Details',
      headerTa: 'பொருள் விவரம்',
      type: 'text',
      hiddenByDefault: true,
      render: (_, row) => {
        if (row.paymentMode !== 'IN_KIND' && !row.inKindItemCategory) return <span className="text-slate-300">-</span>;
        return (
          <span className="text-xs text-purple-900 font-medium">
            {row.inKindQuantity} {row.inKindUnit} {row.inKindItemCategory} ({row.inKindItemDescription}) @ ₹{row.inKindApproximateUnitRate}
          </span>
        );
      },
    },
    {
      key: 'createdBy',
      header: 'Operator',
      headerTa: 'பதிவு செய்தவர்',
      type: 'text',
      width: 'w-24',
      hiddenByDefault: true,
      render: (val) => <span className="font-mono text-slate-500 text-[11px]">{val || 'admin'}</span>,
    },
    {
      key: 'notes',
      header: 'Notes / Remarks',
      headerTa: 'குறிப்பு',
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
      width: 'w-28',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenReceipt(row.referenceNo)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 text-amber-800 transition"
            title="View Digital Receipt"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleShareWhatsApp(row)}
            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition"
            title="Share on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ], [isTamil]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              {isTamil ? 'வரவுகள் பேரேடு' : 'Income & Inflows Ledger'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isTamil
              ? 'அனைத்து பண வரவுகள், ஜிபே, பொருள் நன்கொடைகள் மற்றும் கிராம குடும்ப பங்களிப்புகளின் முழு விவரம்.'
              : 'Dedicated ledger view of all devotee collections, GPay transfers, in-kind materials, and family drive contributions.'}
          </p>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={loadIncomeData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition self-start sm:self-auto shadow-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('tables.refresh', 'Refresh')}</span>
        </button>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>{isTamil ? 'மொத்த பண வரவு' : 'Total Monetary Income'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(metrics.totalMonetary)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {metrics.count} {isTamil ? 'ரசீதுகள்' : 'receipts issued'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>{isTamil ? 'ரொக்க வசூல்' : 'Cash in Hand Collections'}</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(metrics.totalCash)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isTamil ? 'ரசீது புத்தகங்கள் மூலம்' : 'Via physical receipt books'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>{isTamil ? 'ஜிபே / வங்கி வரவு' : 'GPay / Bank Collections'}</span>
            <Smartphone className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-700 font-mono">
            {formatCurrency(metrics.totalGpay)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isTamil ? 'ஆன்லைன் வங்கி பரிவர்த்தனை' : 'Direct bank & UPI payments'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>{isTamil ? 'பொருள் நன்கொடை மதிப்பு' : 'In-Kind Materials Value'}</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono">
            {formatCurrency(metrics.totalInKind)}
          </div>
          <div className="text-[11px] text-purple-700 mt-1">
            {isTamil ? 'சிமெண்ட், கம்பி, செங்கல்' : 'Cement, steel, sand valuation'}
          </div>
        </div>
      </div>

      {/* AG Grid Table with Excel Column Filters */}
      <ExcelDataGrid
        columns={columns}
        data={incomes}
        loading={loading}
        title={isTamil ? 'அனைத்து வரவு பதிவுகள்' : 'All Income Entries'}
        subtitle={isTamil ? 'ஒவ்வொரு நெடுவரிசையிலும் வரிசைப்படுத்தலாம் மற்றும் வடிகட்டலாம்' : 'Excel-style multi-criteria column filtering, sorting, and export'}
        amountField="amount"
        exportFileName="Othalavadi_Temple_Income_Ledger"
        emptyMessage={isTamil ? 'எந்த வரவு பதிவும் கிடைக்கவில்லை' : 'No income records found'}
      />

      {/* Digital Receipt Modal */}
      {isReceiptModalOpen && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          receiptNo={selectedReceiptNo}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedReceiptNo(null);
          }}
        />
      )}
    </div>
  );
}

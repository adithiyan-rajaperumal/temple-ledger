import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingDown,
  Hammer,
  Users,
  Briefcase,
  Compass,
  FileText,
  Printer,
  Banknote,
  Smartphone,
  Calendar,
  RotateCw,
  Search,
  Building
} from 'lucide-react';
import { getTransactions } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import ExcelDataGrid from '../components/ExcelDataGrid';

export default function ExpenseLedger() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected voucher for modal
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Fetch all expense transactions
  const loadExpenseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTransactions({ size: 1000 });
      const allTx = res?.content || (Array.isArray(res) ? res : []);
      // Filter only outflows: EXPENSE
      const expenseTx = allTx.filter((tx) => tx.flowType === 'EXPENSE');
      setExpenses(expenseTx);
    } catch (err) {
      console.error('Failed to load expense entries:', err);
      setError(err.message || 'Failed to load expense ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenseData();
  }, []);

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    let totalMaterials = 0;
    let totalWages = 0;
    let totalContractor = 0;
    let totalTravel = 0;
    let totalMisc = 0;

    expenses.forEach((item) => {
      const amt = parseFloat(item.amount) || 0;
      const cat = item.category || '';
      if (cat === 'MATERIAL_PURCHASE' || cat.includes('MATERIAL')) totalMaterials += amt;
      else if (cat === 'LABOUR_WAGES' || cat.includes('LABOUR') || cat.includes('WAGES')) totalWages += amt;
      else if (cat === 'CONTRACT_PAYOUT' || cat.includes('CONTRACT')) totalContractor += amt;
      else if (cat === 'COLLECTION_FIELD_EXPENSE' || cat.includes('FIELD') || cat.includes('TRAVEL')) totalTravel += amt;
      else totalMisc += amt;
    });

    const totalExpense = totalMaterials + totalWages + totalContractor + totalTravel + totalMisc;

    return {
      totalExpense,
      totalMaterials,
      totalWages,
      totalContractor,
      totalTravel,
      totalMisc,
      count: expenses.length,
    };
  }, [expenses]);

  // Define Columns for Expense Ledger
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
      header: 'Voucher #',
      headerTa: 'பற்றுச்சீட்டு எண்',
      type: 'text',
      width: 'w-36',
      render: (val, row) => (
        <button
          type="button"
          onClick={() => setSelectedVoucher(row)}
          className="font-mono font-bold text-rose-700 hover:text-rose-900 hover:underline inline-flex items-center gap-1"
          title="View Voucher Details"
        >
          <FileText className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
          <span>{val}</span>
        </button>
      ),
    },
    {
      key: 'invoiceBillNo',
      header: 'Bill / Inv #',
      headerTa: 'ரசீது / பில் #',
      type: 'text',
      width: 'w-28',
      render: (val) =>
        val ? (
          <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
            {val}
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
    {
      key: 'category',
      header: 'Expense Category',
      headerTa: 'செலவு இனம்',
      type: 'text',
      render: (val, row) => {
        const catLabel = isTamil && row.categoryTa ? row.categoryTa : val;
        let colorClass = 'bg-slate-100 text-slate-800 border-slate-200';
        if (val.includes('MATERIAL')) colorClass = 'bg-amber-50 text-amber-900 border-amber-200';
        else if (val.includes('LABOUR') || val.includes('WAGES')) colorClass = 'bg-orange-50 text-orange-900 border-orange-200';
        else if (val.includes('CONTRACT')) colorClass = 'bg-indigo-50 text-indigo-900 border-indigo-200';
        else if (val.includes('FIELD') || val.includes('TRAVEL')) colorClass = 'bg-emerald-50 text-emerald-900 border-emerald-200';

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colorClass}`}>
            {catLabel}
          </span>
        );
      },
    },
    {
      key: 'partyName',
      header: 'Paid To / Beneficiary',
      headerTa: 'பெற்றவர் / நிறுவனம்',
      type: 'text',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900">{val}</div>
          {row.contractorName && row.contractorName !== val && (
            <div className="text-[10px] text-slate-500">
              Contractor: <span className="font-semibold text-slate-700">{row.contractorName}</span>
            </div>
          )}
          {row.volunteerName && (
            <div className="text-[10px] text-slate-500">
              Volunteer: <span className="font-semibold text-slate-700">{row.volunteerName}</span>
            </div>
          )}
        </div>
      ),
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
        return (
          <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-semibold text-[11px]">
            <Smartphone className="w-3 h-3 text-sky-600" />
            <span>{isTamil ? 'ஜிபே / வங்கி' : 'GPay / Bank'}</span>
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount (₹)',
      headerTa: 'செலவு தொகை (₹)',
      type: 'number',
      align: 'right',
      width: 'w-28',
      render: (val) => (
        <span className="font-mono font-bold text-sm text-rose-700">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Description / Purpose',
      headerTa: 'காரணம் / விவரம்',
      type: 'text',
      render: (val, row) => (
        <div className="max-w-md truncate" title={val}>
          <span className="text-slate-700">{val}</span>
          {row.contractMilestoneDesc && (
            <span className="text-[10px] text-indigo-700 block italic">
              Milestone: {row.contractMilestoneDesc}
            </span>
          )}
          {row.travelModeVehicle && (
            <span className="text-[10px] text-emerald-700 block italic">
              Vehicle: {row.travelModeVehicle}
            </span>
          )}
        </div>
      ),
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
      key: 'actions',
      header: 'Actions',
      headerTa: 'செயல்கள்',
      sortable: false,
      filterable: false,
      align: 'center',
      width: 'w-20',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setSelectedVoucher(row)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-800 transition"
          title="View Voucher"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ], [isTamil]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-6 h-6 text-rose-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              {isTamil ? 'செலவுகள் பேரேடு' : 'Expenses & Outflows Ledger'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isTamil
              ? 'கட்டுமான பொருட்கள், தொழிலாளர் கூலி, ஒப்பந்ததாரர் கொடுப்பனவுகள் மற்றும் களப்பயண செலவுகளின் முழு விவரம்.'
              : 'Detailed disbursement ledger for renovation materials, daily labour wages, contractor milestone payouts, and field expenses.'}
          </p>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={loadExpenseData}
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
            <span>{isTamil ? 'மொத்த செலவுகள்' : 'Total Outflows'}</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
            {formatCurrency(metrics.totalExpense)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.count} {isTamil ? 'பற்றுச்சீட்டுகள்' : 'vouchers recorded'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>{isTamil ? 'கட்டுமான பொருட்கள்' : 'Renovation Materials'}</span>
            <Hammer className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(metrics.totalMaterials)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isTamil ? 'சிமெண்ட், கம்பி, செங்கல் பில்கள்' : 'Bills & invoices paid'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>{isTamil ? 'தொழிலாளர் கூலி' : 'Daily Labour Wages'}</span>
            <Users className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(metrics.totalWages)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isTamil ? 'கொத்தனார், சிற்றாள் கூலி' : 'Masons, helpers & daily labour'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>{isTamil ? 'ஒப்பந்ததாரர் தவணைகள்' : 'Contractor Work Releases'}</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(metrics.totalContractor)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isTamil ? 'வர்ணம், தச்சு, மின்வேலை' : 'Painting, electrical, stone carving'}
          </div>
        </div>
      </div>

      {/* AG Grid Table with Excel Column Filters */}
      <ExcelDataGrid
        columns={columns}
        data={expenses}
        loading={loading}
        title={isTamil ? 'அனைத்து செலவு பதிவுகள்' : 'All Expense Vouchers'}
        subtitle={isTamil ? 'ஒவ்வொரு நெடுவரிசையிலும் வரிசைப்படுத்தலாம் மற்றும் வடிகட்டலாம்' : 'Excel-style multi-criteria column filtering, sorting, and export'}
        amountField="amount"
        exportFileName="Othalavadi_Temple_Expense_Ledger"
        emptyMessage={isTamil ? 'எந்த செலவு பதிவும் கிடைக்கவில்லை' : 'No expense records found'}
      />

      {/* Expense Voucher View / Print Modal */}
      {selectedVoucher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelectedVoucher(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="text-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900">
                1008 ஸ்ரீ விருஷபநாத ஜிநாலயம், ஓதலவாடி
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                செலவு பற்றுச்சீட்டு / Expense Voucher
              </p>
              <div className="inline-block mt-2 font-mono font-bold text-xs bg-rose-50 text-rose-800 px-3 py-1 rounded-full border border-rose-200">
                {selectedVoucher.referenceNo}
              </div>
            </div>

            {/* Voucher Body */}
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
              {selectedVoucher.invoiceBillNo && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">ரசீது / Bill No:</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedVoucher.invoiceBillNo}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">செலுத்திய முறை / Payment Mode:</span>
                <span className="font-semibold text-slate-900">{selectedVoucher.paymentMode}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 bg-rose-50/50 px-2 rounded-lg">
                <span className="font-bold text-slate-700">செலவு தொகை / Amount:</span>
                <span className="font-mono font-bold text-rose-700 text-base">{formatCurrency(selectedVoucher.amount)}</span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">காரணம் / Description:</span>
                <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-800 leading-relaxed">
                  {selectedVoucher.notes || 'None'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-xs"
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

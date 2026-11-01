import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Receipt,
  RotateCw,
  AlertCircle,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from 'lucide-react';
import FilterBar from '../components/FilterBar';
import ReceiptModal from '../components/ReceiptModal';
import { getTransactions } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function MasterDataGrid() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state initialized from query params if present
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    flowType: searchParams.get('flowType') || 'ALL',
    category: searchParams.get('category') || '',
    paymentMode: searchParams.get('paymentMode') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Modal state
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isTamil = i18n.language === 'ta';

  // Check if receipt param is present in URL
  useEffect(() => {
    const receiptFromUrl = searchParams.get('receipt');
    if (receiptFromUrl) {
      setSelectedTxn({ referenceNo: receiptFromUrl });
      setModalOpen(true);
    }
  }, [searchParams]);

  // Load transactions based on current filters and page
  const fetchTransactionsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        size: pageSize,
      };

      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      if (filters.flowType && filters.flowType !== 'ALL') {
        params.flowType = filters.flowType;
      }
      if (filters.category) {
        params.category = filters.category;
      }
      if (filters.paymentMode) {
        params.paymentMode = filters.paymentMode;
      }
      if (filters.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const response = await getTransactions(params);
      setTransactions(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchTransactionsData();
  }, [fetchTransactionsData]);

  // Filter change handlers
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      flowType: 'ALL',
      category: '',
      paymentMode: '',
      startDate: '',
      endDate: '',
    });
    setPage(0);
  };

  // Open Receipt Modal
  const handleViewReceipt = (txn) => {
    setSelectedTxn(txn);
    setModalOpen(true);
  };

  // Export to CSV with UTF-8 BOM for proper Tamil character rendering in Excel
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      // Fetch all filtered rows for export (up to 10,000 records)
      const exportParams = {
        page: 0,
        size: 10000,
      };
      if (filters.search && filters.search.trim()) exportParams.search = filters.search.trim();
      if (filters.flowType && filters.flowType !== 'ALL') exportParams.flowType = filters.flowType;
      if (filters.category) exportParams.category = filters.category;
      if (filters.paymentMode) exportParams.paymentMode = filters.paymentMode;
      if (filters.startDate) exportParams.startDate = filters.startDate;
      if (filters.endDate) exportParams.endDate = filters.endDate;

      const data = await getTransactions(exportParams);
      const itemsToExport = data.content || transactions;

      const headers = [
        'Date',
        'Flow Type',
        'Reference No',
        'Category (EN)',
        'Category (TA)',
        'Party / Payee / Donor',
        'Village',
        'Payment Mode',
        'Amount (INR)',
        'Notes',
      ];

      const rows = itemsToExport.map((item) => [
        item.date || '',
        item.flowType || '',
        `"${(item.referenceNo || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        `"${(item.categoryTa || '').replace(/"/g, '""')}"`,
        `"${(item.partyName || '').replace(/"/g, '""')}"`,
        `"${(item.village || '').replace(/"/g, '""')}"`,
        item.paymentMode || '',
        item.amount != null ? item.amount : 0,
        `"${(item.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      // Add UTF-8 BOM so Microsoft Excel correctly renders Tamil characters
      const blob = new Blob(['\uFEFF' + csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nowStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('href', url);
      link.setAttribute('download', `temple-ledger-transactions-${nowStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  // Pagination calculation
  const fromRecord = totalElements === 0 ? 0 : page * pageSize + 1;
  const toRecord = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              {t('nav.transactions')}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Action Buttons: Refresh & CSV Export */}
        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchTransactionsData()}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            title={t('dashboard.refresh')}
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exporting || totalElements === 0}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            {exporting ? t('common.loading') : t('buttons.exportCsv')}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="mt-2 text-rose-700 font-semibold">{error}</p>
            <button
              onClick={() => fetchTransactionsData()}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer"
            >
              {t('dashboard.retry')}
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable Table Container */}
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">{t('tables.date')}</th>
                    <th className="py-3 px-4">{t('tables.type')}</th>
                    <th className="py-3 px-4">{t('tables.receiptVoucherNo')}</th>
                    <th className="py-3 px-4">{t('tables.category')}</th>
                    <th className="py-3 px-4">{t('tables.name')}</th>
                    <th className="py-3 px-4">{t('tables.village')}</th>
                    <th className="py-3 px-4">{t('tables.mode')}</th>
                    <th className="py-3 px-4 text-right">{t('tables.amount')}</th>
                    <th className="py-3 px-4 text-center">{t('tables.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-16 text-center text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-amber-600 border-t-transparent mb-2" />
                        <p className="text-xs">{t('common.loading')}</p>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-16 text-center text-slate-400">
                        <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">
                          {t('tables.noRecords')}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn) => {
                      const isIncome = txn.flowType === 'INCOME';
                      const isExpense = txn.flowType === 'EXPENSE';
                      const isInKind = txn.flowType === 'IN_KIND';

                      const localizedCategory = isTamil
                        ? txn.categoryTa || txn.category
                        : txn.category || txn.categoryTa;

                      return (
                        <tr
                          key={txn.id || txn.referenceNo}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* Date */}
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {formatDate(txn.date)}
                          </td>

                          {/* Flow Type Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isIncome && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ArrowDownRight className="w-3 h-3 mr-1" />
                                {t('common.inflow')}
                              </span>
                            )}
                            {isExpense && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                {t('common.outflow')}
                              </span>
                            )}
                            {isInKind && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <Package className="w-3 h-3 mr-1" />
                                {t('forms.inKind')}
                              </span>
                            )}
                          </td>

                          {/* Reference Number */}
                          <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                            {txn.referenceNo}
                          </td>

                          {/* Localized Category */}
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {localizedCategory}
                          </td>

                          {/* Party / Payee / Donor */}
                          <td className="py-3 px-4 text-slate-900 font-medium max-w-[200px] truncate">
                            {txn.partyName || '-'}
                          </td>

                          {/* Village */}
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {txn.village || '-'}
                          </td>

                          {/* Payment Mode */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-xs">
                            {txn.paymentMode === 'CASH'
                              ? t('forms.cash')
                              : txn.paymentMode === 'GPAY_ONLINE'
                              ? t('forms.gpay')
                              : txn.paymentMode === 'IN_KIND'
                              ? t('forms.inKind')
                              : txn.paymentMode}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span
                              className={`font-bold ${
                                isIncome
                                  ? 'text-emerald-700'
                                  : isExpense
                                  ? 'text-rose-700'
                                  : 'text-amber-800'
                              }`}
                            >
                              {isIncome ? '+ ' : isExpense ? '- ' : ''}
                              {formatCurrency(txn.amount)}
                            </span>
                          </td>

                          {/* Action Button: View Receipt / Voucher */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleViewReceipt(txn)}
                              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 transition cursor-pointer"
                              title={
                                isExpense
                                  ? t('buttons.viewVoucher')
                                  : t('buttons.viewReceipt')
                              }
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              <span>
                                {isExpense
                                  ? t('buttons.viewVoucher')
                                  : t('buttons.viewReceipt')}
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-600">
              <div>
                {t('tables.showingEntries', {
                  from: fromRecord,
                  to: toRecord,
                  total: totalElements,
                })}
              </div>

              <div className="flex items-center space-x-2">
                {/* Page Size Selector */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="py-1 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>

                {/* Page Navigation */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title={t('tables.prev')}
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>

                  <span className="px-2 font-medium text-xs text-slate-700">
                    {t('tables.page')} {totalPages === 0 ? 0 : page + 1} {t('tables.of')}{' '}
                    {totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || loading}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title={t('tables.next')}
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTxn(null);
        }}
        transaction={selectedTxn}
        receiptNo={selectedTxn?.referenceNo}
      />
    </div>
  );
}

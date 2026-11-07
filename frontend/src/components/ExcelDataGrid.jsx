import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  X,
  RotateCcw,
  Download,
  Check,
  Columns,
  Eye,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

/**
 * ExcelDataGrid: A high-performance AG-Grid-style table component with
 * Excel-like multi-criteria column filtering, sorting, column toggles,
 * number/date range filters, and UTF-8 BOM Excel CSV export.
 */
export default function ExcelDataGrid({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  title = '',
  subtitle = '',
  amountField = null,
  initialSort = null,
  exportFileName = 'export',
  actions = null,
  mobileCardRender = null,
}) {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';

  // State: Global search query
  const [globalSearch, setGlobalSearch] = useState('');

  // State: Column sorting { key, direction: 'asc' | 'desc' }
  const [sortConfig, setSortConfig] = useState(
    initialSort || { key: columns[0]?.key || 'date', direction: 'desc' }
  );

  // State: Column-specific filters
  // Format: { [columnKey]: { selectedValues: Set | null, textSearch: '', min: '', max: '', fromDate: '', toDate: '' } }
  const [columnFilters, setColumnFilters] = useState({});

  // State: Open filter popover key
  const [activeFilterCol, setActiveFilterCol] = useState(null);
  const filterPopoverRef = useRef(null);

  // State: Visible columns
  const [visibleColKeys, setVisibleColKeys] = useState(() =>
    columns.filter((c) => !c.hiddenByDefault).map((c) => c.key)
  );
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef(null);

  // State: Density & Pagination
  const [isCompact, setIsCompact] = useState(true);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // State: View mode on mobile ('table' | 'cards')
  const [viewMode, setViewMode] = useState('table');

  // Close filter popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setActiveFilterCol(null);
      }
      if (colMenuRef.current && !colMenuRef.current.contains(e.target)) {
        setShowColMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute unique values and value counts for a column
  const getDistinctValues = (colKey) => {
    const map = new Map();
    data.forEach((row) => {
      const val = row[colKey];
      const displayVal = val === null || val === undefined || val === '' ? '(Blank)' : String(val);
      map.set(displayVal, (map.get(displayVal) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === '(Blank)') return 1;
      if (b[0] === '(Blank)') return -1;
      return a[0].localeCompare(b[0]);
    });
  };

  // Check if a column has an active filter
  const isColFiltered = (key) => {
    const cf = columnFilters[key];
    if (!cf) return false;
    if (cf.selectedValues && cf.selectedValues.size > 0) return true;
    if (cf.min !== '' && cf.min !== undefined) return true;
    if (cf.max !== '' && cf.max !== undefined) return true;
    if (cf.fromDate !== '' && cf.fromDate !== undefined) return true;
    if (cf.toDate !== '' && cf.toDate !== undefined) return true;
    return false;
  };

  // Count total active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (globalSearch.trim()) count++;
    Object.keys(columnFilters).forEach((k) => {
      if (isColFiltered(k)) count++;
    });
    return count;
  }, [columnFilters, globalSearch]);

  // Handle Sort Toggle
  const handleSort = (colKey) => {
    setSortConfig((prev) => {
      if (prev?.key === colKey) {
        if (prev.direction === 'asc') return { key: colKey, direction: 'desc' };
        if (prev.direction === 'desc') return null; // reset
      }
      return { key: colKey, direction: 'asc' };
    });
  };

  // Filter & Sort Data
  const filteredData = useMemo(() => {
    let result = [...data];

    // 1. Global text search
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase().trim();
      result = result.filter((row) => {
        return Object.values(row).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // 2. Column-specific filters
    Object.entries(columnFilters).forEach(([colKey, filter]) => {
      if (!filter) return;

      const col = columns.find((c) => c.key === colKey);
      const isNum = col?.type === 'number';
      const isDate = col?.type === 'date';

      // Checklist filter (selected distinct values)
      if (filter.selectedValues && filter.selectedValues.size > 0) {
        result = result.filter((row) => {
          const val = row[colKey];
          const displayVal = val === null || val === undefined || val === '' ? '(Blank)' : String(val);
          return filter.selectedValues.has(displayVal);
        });
      }

      // Number range filter
      if (isNum) {
        if (filter.min !== '' && filter.min !== undefined) {
          const minVal = parseFloat(filter.min);
          if (!isNaN(minVal)) {
            result = result.filter((row) => {
              const val = parseFloat(row[colKey]);
              return !isNaN(val) && val >= minVal;
            });
          }
        }
        if (filter.max !== '' && filter.max !== undefined) {
          const maxVal = parseFloat(filter.max);
          if (!isNaN(maxVal)) {
            result = result.filter((row) => {
              const val = parseFloat(row[colKey]);
              return !isNaN(val) && val <= maxVal;
            });
          }
        }
      }

      // Date range filter
      if (isDate) {
        if (filter.fromDate) {
          result = result.filter((row) => {
            const val = row[colKey];
            if (!val) return false;
            return String(val) >= filter.fromDate;
          });
        }
        if (filter.toDate) {
          result = result.filter((row) => {
            const val = row[colKey];
            if (!val) return false;
            return String(val) <= filter.toDate;
          });
        }
      }
    });

    // 3. Sorting
    if (sortConfig && sortConfig.key) {
      const { key, direction } = sortConfig;
      const col = columns.find((c) => c.key === key);
      const isNum = col?.type === 'number';
      const isDate = col?.type === 'date';

      result.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (isNum) {
          const numA = parseFloat(valA) || 0;
          const numB = parseFloat(valB) || 0;
          return direction === 'asc' ? numA - numB : numB - numA;
        }

        if (isDate) {
          const strA = String(valA);
          const strB = String(valB);
          return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        }

        const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        return direction === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [data, globalSearch, columnFilters, sortConfig, columns]);

  // Compute Total Amount of filtered items if amountField specified
  const totalAmount = useMemo(() => {
    if (!amountField) return 0;
    return filteredData.reduce((acc, row) => {
      const val = parseFloat(row[amountField]) || 0;
      return acc + val;
    }, 0);
  }, [filteredData, amountField]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    if (pageSize === 'ALL') return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filteredData.length / pageSize) || 1;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, columnFilters, sortConfig, pageSize]);

  // Reset All Filters
  const handleResetFilters = () => {
    setGlobalSearch('');
    setColumnFilters({});
    setSortConfig(initialSort || { key: columns[0]?.key || 'date', direction: 'desc' });
    setCurrentPage(1);
  };

  // Clear single column filter
  const handleClearColFilter = (key) => {
    setColumnFilters((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // Export to Excel CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const visibleCols = columns.filter((c) => visibleColKeys.includes(c.key));
    const headerRow = visibleCols.map((c) => `"${(isTamil && c.headerTa ? c.headerTa : c.header).replace(/"/g, '""')}"`).join(',');

    const dataRows = filteredData.map((row) => {
      return visibleCols
        .map((c) => {
          let cell = row[c.key];
          if (cell === null || cell === undefined) cell = '';
          return `"${String(cell).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Grid Top Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Title & Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                {filteredData.length} {t('tables.entries', 'entries')}
              </span>
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Global Search Bar */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={t('tables.searchPlaceholder', 'Search all columns...')}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Column Visibility Dropdown */}
            <div className="relative" ref={colMenuRef}>
              <button
                type="button"
                onClick={() => setShowColMenu(!showColMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                title={t('tables.columns', 'Columns')}
              >
                <Columns className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">{t('tables.columns', 'Columns')}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showColMenu && (
                <div className="absolute right-0 mt-2 w-56 max-h-72 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 text-xs">
                  <div className="font-bold text-slate-700 px-2 py-1 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span>{t('tables.toggleColumns', 'Toggle Columns')}</span>
                    <button
                      type="button"
                      onClick={() => setVisibleColKeys(columns.map((c) => c.key))}
                      className="text-amber-700 font-bold hover:underline"
                    >
                      {t('tables.selectAll', 'All')}
                    </button>
                  </div>
                  {columns.map((col) => {
                    const isVis = visibleColKeys.includes(col.key);
                    return (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isVis}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisibleColKeys([...visibleColKeys, col.key]);
                            } else if (visibleColKeys.length > 1) {
                              setVisibleColKeys(visibleColKeys.filter((k) => k !== col.key));
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-slate-700 truncate">
                          {isTamil && col.headerTa ? col.headerTa : col.header}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Density Toggle Button */}
            <button
              type="button"
              onClick={() => setIsCompact(!isCompact)}
              className={`p-2 rounded-xl border transition ${
                isCompact
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title={isCompact ? 'Compact density' : 'Spacious density'}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('tables.exportExcel', 'Export Excel')}</span>
            </button>

            {/* Extra actions slot */}
            {actions}
          </div>
        </div>

        {/* Active Filter Badges & Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-500">{t('tables.filters', 'Filters')}:</span>
            {activeFiltersCount === 0 ? (
              <span className="text-slate-400 italic">{t('tables.none', 'None (Showing all)')}</span>
            ) : (
              <>
                {globalSearch && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-medium">
                    Search: "{globalSearch}"
                    <button type="button" onClick={() => setGlobalSearch('')} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {Object.entries(columnFilters).map(([k, f]) => {
                  if (!isColFiltered(k)) return null;
                  const col = columns.find((c) => c.key === k);
                  const colName = isTamil && col?.headerTa ? col.headerTa : col?.header || k;
                  let filterSummary = '';
                  if (f.selectedValues && f.selectedValues.size > 0) {
                    filterSummary = Array.from(f.selectedValues).slice(0, 2).join(', ');
                    if (f.selectedValues.size > 2) filterSummary += ` +${f.selectedValues.size - 2}`;
                  } else if (f.min || f.max) {
                    filterSummary = `₹${f.min || 0} - ₹${f.max || '∞'}`;
                  } else if (f.fromDate || f.toDate) {
                    filterSummary = `${f.fromDate || ''} to ${f.toDate || ''}`;
                  }

                  return (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-medium"
                    >
                      <span className="font-bold">{colName}:</span> {filterSummary}
                      <button type="button" onClick={() => handleClearColFilter(k)} className="hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 underline ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t('tables.clearAll', 'Reset All')}
                </button>
              </>
            )}
          </div>

          {/* Amount field sum badge if present */}
          {amountField && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-xs shadow-xs">
              <span className="text-slate-400 uppercase text-[10px] font-sans font-bold">
                {t('tables.totalFiltered', 'Total Sum')}:
              </span>
              <span className="font-bold text-amber-300 text-sm">{formatCurrency(totalAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto relative min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500 animate-pulse">
                {t('tables.loading', 'Loading live transactions...')}
              </p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-2">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">{emptyMessage}</div>
              <p className="text-xs text-slate-400">
                {t('tables.emptyHint', 'Try clearing some column filters or changing your search terms.')}
              </p>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t('tables.clearAllFilters', 'Clear all active filters')}
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              {/* Table Header with Sticky Header & Excel Controls */}
              <thead className="bg-slate-100/90 backdrop-blur sticky top-0 z-10 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  {columns
                    .filter((c) => visibleColKeys.includes(c.key))
                    .map((col) => {
                      const isSorted = sortConfig?.key === col.key;
                      const sortDir = sortConfig?.direction;
                      const hasFilter = isColFiltered(col.key);
                      const isFilterOpen = activeFilterCol === col.key;

                      return (
                        <th
                          key={col.key}
                          className={`py-3 px-3.5 select-none relative whitespace-nowrap transition-colors ${
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                          } ${col.width || ''}`}
                        >
                          <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                            {/* Column Title with Click-to-Sort */}
                            <button
                              type="button"
                              onClick={() => handleSort(col.key)}
                              className="font-bold hover:text-amber-800 transition flex items-center gap-1 group text-left"
                            >
                              <span>{isTamil && col.headerTa ? col.headerTa : col.header}</span>
                              <span className="text-slate-400 group-hover:text-amber-700">
                                {isSorted ? (
                                  sortDir === 'asc' ? (
                                    <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                                  ) : (
                                    <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </span>
                            </button>

                            {/* Filter Trigger Button (Funnel) */}
                            {col.filterable !== false && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFilterCol(isFilterOpen ? null : col.key);
                                }}
                                className={`p-1 rounded-md transition relative ${
                                  hasFilter
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                                }`}
                                title={`Filter by ${col.header}`}
                              >
                                <Filter className="w-3 h-3" />
                                {hasFilter && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-200 absolute -top-0.5 -right-0.5" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Excel Filter Popover for this Column */}
                          {isFilterOpen && (
                            <ColumnFilterPopover
                              column={col}
                              data={data}
                              currentFilter={columnFilters[col.key] || {}}
                              popoverRef={filterPopoverRef}
                              distinctValues={getDistinctValues(col.key)}
                              onApply={(newFilter) => {
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  [col.key]: newFilter,
                                }));
                                setActiveFilterCol(null);
                              }}
                              onClear={() => {
                                handleClearColFilter(col.key);
                                setActiveFilterCol(null);
                              }}
                              onSortAsc={() => {
                                setSortConfig({ key: col.key, direction: 'asc' });
                              }}
                              onSortDesc={() => {
                                setSortConfig({ key: col.key, direction: 'desc' });
                              }}
                              onClose={() => setActiveFilterCol(null)}
                            />
                          )}
                        </th>
                      );
                    })}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedData.map((row, idx) => {
                  return (
                    <tr
                      key={row.id || row.referenceNo || idx}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {columns
                        .filter((c) => visibleColKeys.includes(c.key))
                        .map((col) => {
                          const val = row[col.key];
                          return (
                            <td
                              key={col.key}
                              className={`${
                                isCompact ? 'py-2 px-3' : 'py-3.5 px-3.5'
                              } whitespace-nowrap ${
                                col.align === 'right'
                                  ? 'text-right'
                                  : col.align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              }`}
                            >
                              {col.render ? col.render(val, row) : val !== null && val !== undefined ? String(val) : '-'}
                            </td>
                          );
                        })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Grid Pagination Footer */}
        {filteredData.length > 0 && (
          <div className="bg-slate-50/80 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>{t('tables.rowsPerPage', 'Rows per page')}:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="ALL">All ({filteredData.length})</option>
              </select>
              <span className="text-slate-400">|</span>
              <span>
                {pageSize === 'ALL'
                  ? `Showing all ${filteredData.length} records`
                  : `Showing ${(currentPage - 1) * pageSize + 1} - ${Math.min(
                      currentPage * pageSize,
                      filteredData.length
                    )} of ${filteredData.length}`}
              </span>
            </div>

            {/* Pagination Controls */}
            {pageSize !== 'ALL' && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-semibold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ColumnFilterPopover: Interactive Excel-style popover for column filtering & sorting
 */
function ColumnFilterPopover({
  column,
  currentFilter,
  popoverRef,
  distinctValues,
  onApply,
  onClear,
  onSortAsc,
  onSortDesc,
  onClose,
}) {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';
  const isNum = column.type === 'number';
  const isDate = column.type === 'date';

  // Local state for popover controls
  const [valSearch, setValSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState(() => {
    return currentFilter.selectedValues ? new Set(currentFilter.selectedValues) : new Set(distinctValues.map((v) => v[0]));
  });
  const [minVal, setMinVal] = useState(currentFilter.min || '');
  const [maxVal, setMaxVal] = useState(currentFilter.max || '');
  const [fromDate, setFromDate] = useState(currentFilter.fromDate || '');
  const [toDate, setToDate] = useState(currentFilter.toDate || '');

  // Filter distinct values by search
  const filteredDistinctValues = useMemo(() => {
    if (!valSearch.trim()) return distinctValues;
    const q = valSearch.toLowerCase().trim();
    return distinctValues.filter(([val]) => val.toLowerCase().includes(q));
  }, [distinctValues, valSearch]);

  const allVisibleSelected = filteredDistinctValues.length > 0 &&
    filteredDistinctValues.every(([val]) => selectedSet.has(val));

  const toggleSelectAll = () => {
    const next = new Set(selectedSet);
    if (allVisibleSelected) {
      filteredDistinctValues.forEach(([val]) => next.delete(val));
    } else {
      filteredDistinctValues.forEach(([val]) => next.add(val));
    }
    setSelectedSet(next);
  };

  const handleApply = () => {
    // If all distinct values are selected, no need to store set
    const allSelected = distinctValues.every(([val]) => selectedSet.has(val));
    const nextFilter = {
      selectedValues: allSelected ? null : selectedSet,
      min: minVal,
      max: maxVal,
      fromDate,
      toDate,
    };
    onApply(nextFilter);
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 normal-case font-normal text-xs space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick Sort Actions */}
      <div className="space-y-1 pb-2 border-b border-slate-100">
        <button
          type="button"
          onClick={() => {
            onSortAsc();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg text-left font-medium transition"
        >
          <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
          <span>
            {isNum
              ? t('tables.sortAscNum', 'Sort Smallest to Largest')
              : isDate
              ? t('tables.sortAscDate', 'Sort Oldest to Newest')
              : t('tables.sortAsc', 'Sort A to Z')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            onSortDesc();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg text-left font-medium transition"
        >
          <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
          <span>
            {isNum
              ? t('tables.sortDescNum', 'Sort Largest to Smallest')
              : isDate
              ? t('tables.sortDescDate', 'Sort Newest to Oldest')
              : t('tables.sortDesc', 'Sort Z to A')}
          </span>
        </button>
      </div>

      {/* Number Range Filter */}
      {isNum && (
        <div className="space-y-1.5 pb-2 border-b border-slate-100">
          <label className="font-bold text-[11px] text-slate-600 uppercase tracking-wide">
            {t('tables.numberRange', 'Amount Range (₹)')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min ₹"
              value={minVal}
              onChange={(e) => setMinVal(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <input
              type="number"
              placeholder="Max ₹"
              value={maxVal}
              onChange={(e) => setMaxVal(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      {isDate && (
        <div className="space-y-1.5 pb-2 border-b border-slate-100">
          <label className="font-bold text-[11px] text-slate-600 uppercase tracking-wide">
            {t('tables.dateRange', 'Date Range')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block">{t('tables.from', 'From')}</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{t('tables.to', 'To')}</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Distinct Values Checklist (Excel-style) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] text-slate-600 uppercase tracking-wide">
            {t('tables.values', 'Filter by Value')}
          </span>
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-[11px] font-bold text-amber-700 hover:underline"
          >
            {allVisibleSelected ? t('tables.unselectAll', 'Unselect All') : t('tables.selectAll', 'Select All')}
          </button>
        </div>

        {/* Search within distinct values */}
        <div className="relative">
          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            placeholder={t('tables.searchValues', 'Search values...')}
            value={valSearch}
            onChange={(e) => setValSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Checkbox List */}
        <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-lg p-1.5 bg-slate-50/50">
          {filteredDistinctValues.length === 0 ? (
            <div className="text-center py-2 text-slate-400 text-xs italic">
              {t('tables.noMatchingValues', 'No matches')}
            </div>
          ) : (
            filteredDistinctValues.map(([val, count]) => {
              const isChecked = selectedSet.has(val);
              return (
                <label
                  key={val}
                  className="flex items-center justify-between px-1.5 py-1 hover:bg-slate-100 rounded-md cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const next = new Set(selectedSet);
                        if (e.target.checked) next.add(val);
                        else next.delete(val);
                        setSelectedSet(next);
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700 truncate">{val}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono ml-2">({count})</span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {/* Popover Footer Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onClear}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          {t('tables.clear', 'Clear')}
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            {t('tables.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition"
          >
            {t('tables.apply', 'Apply')}
          </button>
        </div>
      </div>
    </div>
  );
}

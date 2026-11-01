import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X, Calendar, RotateCcw } from 'lucide-react';

/**
 * FilterBar Component for MasterDataGrid.
 * Supports multi-criteria filtering across flow type, category, mode, date range, and text search.
 *
 * @param {Object} props
 * @param {Object} props.filters
 * @param {(newFilters: Object) => void} props.onChange
 * @param {() => void} props.onReset
 */
export default function FilterBar({ filters, onChange, onReset }) {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';

  const handleInputChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.flowType && filters.flowType !== 'ALL') ||
      filters.category ||
      filters.paymentMode ||
      filters.startDate ||
      filters.endDate
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
      {/* Top Row: Search Input and Flow Type Selector */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Live Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder={t('tables.searchPlaceholder')}
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
          {filters.search && (
            <button
              onClick={() => handleInputChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Flow Type Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'ALL', label: t('tables.flowTypeAll') },
            { id: 'INCOME', label: t('tables.flowTypeIncome') },
            { id: 'EXPENSE', label: t('tables.flowTypeExpense') },
            { id: 'IN_KIND', label: t('tables.flowTypeInKind') },
          ].map((item) => {
            const isSelected =
              (!filters.flowType && item.id === 'ALL') ||
              filters.flowType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleInputChange('flowType', item.id)}
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

      {/* Bottom Row: Category, Payment Mode, Dates, and Reset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
        {/* Category Dropdown */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t('tables.category')}
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full text-xs sm:text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          >
            <option value="">{t('tables.allCategories')}</option>
            {/* Inflow Categories */}
            <optgroup label={isTamil ? 'வரவு பிரிவுகள்' : 'Inflow Categories'}>
              <option value="General Donation">
                {isTamil ? 'பொது நன்கொடை' : 'General Devotee Donations'}
              </option>
              <option value="Village Family Drive">
                {isTamil ? 'கிராம குடும்ப பங்களிப்பு' : 'Village Family Drive'}
              </option>
              <option value="IN_KIND">
                {isTamil ? 'பொருள் நன்கொடை' : 'In-Kind Material'}
              </option>
            </optgroup>
            {/* Outflow Categories */}
            <optgroup label={isTamil ? 'செலவு பிரிவுகள்' : 'Expense Categories'}>
              <option value="RENOVATION_MATERIALS">
                {isTamil ? 'கட்டுமான பொருட்கள்' : 'Renovation Materials'}
              </option>
              <option value="LABOUR_WAGES">
                {isTamil ? 'தொழிலாளர் கூலி' : 'Labour Wages'}
              </option>
              <option value="CONTRACT_PAYOUT">
                {isTamil ? 'ஒப்பந்த வேலை கொடுப்பனவு' : 'Contractor Work Releases'}
              </option>
              <option value="COLLECTION_FIELD_EXPENSE">
                {isTamil ? 'வசூல் பயண & உணவு செலவு' : 'Collection Travel & Food'}
              </option>
              <option value="POOJA_RITUALS">
                {isTamil ? 'பூஜை & இதர செலவுகள்' : 'Pooja & Rituals'}
              </option>
            </optgroup>
          </select>
        </div>

        {/* Payment Mode Dropdown */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t('tables.mode')}
          </label>
          <select
            value={filters.paymentMode || ''}
            onChange={(e) => handleInputChange('paymentMode', e.target.value)}
            className="w-full text-xs sm:text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          >
            <option value="">{t('tables.allPaymentModes')}</option>
            <option value="CASH">{t('forms.cash')}</option>
            <option value="GPAY_ONLINE">{t('forms.gpay')}</option>
            <option value="IN_KIND">{t('forms.inKind')}</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t('tables.startDate')}
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* End Date & Reset Button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-500">
              {t('tables.endDate')}
            </label>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                {t('buttons.clearFilters')}
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  History,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Clock,
  User,
  Globe
} from 'lucide-react';
import { getAdminAuditLogs } from '../../services/api';
import { formatDate } from '../../utils/formatters';

export default function AuditTrailViewer() {
  const { t } = useTranslation();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entityNameFilter, setEntityNameFilter] = useState('');
  const [searchEntityId, setSearchEntityId] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (entityNameFilter) params.entityName = entityNameFilter;
      if (searchEntityId.trim()) params.entityId = searchEntityId.trim();

      const data = await getAdminAuditLogs(params);
      if (Array.isArray(data)) {
        setLogs(data);
      } else if (data && Array.isArray(data.content)) {
        setLogs(data.content);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [entityNameFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAuditLogs();
  };

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const parseJsonSafe = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-amber-600" />
            <span>{t('admin.auditTrailTitle', 'Immutable Security Audit Trail')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t(
              'admin.auditTrailSubtitle',
              'Tamper-evident log of all system state changes, transaction recordings, allocations, and operator actions.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={loadAuditLogs}
          disabled={loading}
          className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Entity:</span>
          </div>
          <select
            value={entityNameFilter}
            onChange={(e) => setEntityNameFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="">All Entities</option>
            <option value="DONATION">DONATION</option>
            <option value="EXPENSE">EXPENSE</option>
            <option value="DRIVE_ALLOCATION">DRIVE_ALLOCATION</option>
            <option value="USER">USER</option>
            <option value="CONTRACTOR">CONTRACTOR</option>
            <option value="PLEDGE">PLEDGE</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by Entity ID..."
            value={searchEntityId}
            onChange={(e) => setSearchEntityId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium w-48 sm:w-60"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition"
          >
            Search
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Entity ID</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">Reason / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  {loading ? 'Querying immutable audit logs...' : 'No audit records found.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const beforeJson = parseJsonSafe(log.beforeState);
                const afterJson = parseJsonSafe(log.afterState);

                let actionBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {log.action}
                  </span>
                );
                if (log.action === 'UPDATE') {
                  actionBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      UPDATE
                    </span>
                  );
                } else if (log.action === 'VOID') {
                  actionBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                      VOID
                    </span>
                  );
                }

                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => toggleExpand(log.id)}
                      className="hover:bg-slate-50 cursor-pointer transition"
                    >
                      <td className="px-3 py-3 text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-amber-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {log.timestamp ? formatDate(log.timestamp) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {log.entityName}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 truncate max-w-[120px]">
                        {log.entityId}
                      </td>
                      <td className="px-4 py-3">{actionBadge}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {log.performedBy}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {log.changeReason || '-'}
                      </td>
                    </tr>

                    {/* Expandable Before / After JSON Diff Row */}
                    {isExpanded && (
                      <tr className="bg-slate-900 text-slate-100">
                        <td colSpan={8} className="p-4 sm:p-6 space-y-4 font-mono text-xs">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                            <span>Audit State Snapshot • ID: {log.id}</span>
                            <span>Performed by: {log.performedBy}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-1.5">
                                Before State (Original)
                              </div>
                              <pre className="p-3 bg-slate-950 rounded-xl overflow-x-auto text-[11px] text-rose-200 border border-slate-800 max-h-64">
                                {beforeJson
                                  ? JSON.stringify(beforeJson, null, 2)
                                  : 'null (Initial Creation)'}
                              </pre>
                            </div>

                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
                                After State (Committed)
                              </div>
                              <pre className="p-3 bg-slate-950 rounded-xl overflow-x-auto text-[11px] text-emerald-200 border border-slate-800 max-h-64">
                                {afterJson
                                  ? JSON.stringify(afterJson, null, 2)
                                  : 'null'}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  Users,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Search
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────

interface AuditLogEntry {
  id: number;
  user_id: number | null;
  username: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

interface AuditLogPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface AuditLogStats {
  total_events: number;
  events_today: number;
  unauthorized_attempts: number;
  role_changes: number;
  actions_breakdown: Array<{ action: string; count: number }>;
}

// ── Component ─────────────────────────────────────────

const AuditLogTab: React.FC = () => {
  // Data
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<AuditLogPagination>({
    page: 1,
    per_page: 50,
    total: 0,
    total_pages: 1,
  });
  const [stats, setStats] = useState<AuditLogStats>({
    total_events: 0,
    events_today: 0,
    unauthorized_attempts: 0,
    role_changes: 0,
    actions_breakdown: [],
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetchers ──────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit-log/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit log stats:', err);
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('per_page', '50');
      if (actionFilter) params.set('action', actionFilter);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setEntries(json.data || []);
        if (json.pagination) setPagination(json.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, actionFilter, startDate, endDate]);

  useEffect(() => {
    fetchStats();
    fetchEntries();
  }, [fetchStats, fetchEntries]);

  const handleRefresh = () => {
    fetchStats();
    fetchEntries();
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    // fetchEntries is triggered by the currentPage/filter deps
  };

  const handleFilterClear = () => {
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // ── Helpers ───────────────────────────────────────

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const actionBadgeColor = (action: string): string => {
    const a = action.toLowerCase();
    if (a.includes('delete') || a.includes('denied') || a.includes('unauthorized') || a.includes('forbidden'))
      return 'bg-red-100 text-red-700';
    if (a.includes('create') || a.includes('add') || a.includes('register'))
      return 'bg-green-100 text-green-700';
    if (a.includes('update') || a.includes('edit') || a.includes('role'))
      return 'bg-yellow-100 text-yellow-700';
    if (a.includes('login') || a.includes('auth'))
      return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Unique actions for the filter dropdown
  const uniqueActions = stats.actions_breakdown.map((a) => a.action);

  // ── Render ────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review all administrative actions and security events
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_events.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Clock className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.events_today.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Unauthorized Attempts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unauthorized Attempts</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.unauthorized_attempts.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Role Changes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Role Changes</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.role_changes.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          {/* Action dropdown */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* End date */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <button
            onClick={handleFilterApply}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Search className="w-4 h-4 mr-1" />
            Apply
          </button>
          <button
            onClick={handleFilterClear}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading audit log…</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Shield className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">No audit log entries found</p>
            <p className="text-sm">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(entry.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionBadgeColor(
                          entry.action
                        )}`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.resource_type || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={entry.details || ''}>
                      {entry.details || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {entry.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.per_page + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.per_page, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total.toLocaleString()}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={currentPage >= pagination.total_pages}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogTab;

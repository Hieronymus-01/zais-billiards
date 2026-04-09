import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { supabase } from '../../utils/Supabase';

const actionBadge = (action) => {
  if (action?.includes('DELETE')) return 'badge-error';
  if (action?.includes('CREATE')) return 'badge-success';
  if (action?.includes('UPDATE')) return 'badge-warning';
  if (action?.includes('CANCEL')) return 'badge-error';
  if (action?.includes('POS')) return 'badge-info';
  return 'badge-ghost';
};

const AuditTrail = () => {
  // Same useState + useEffect fetch pattern as event-gate
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchLogs();
  }, [filterDate, filterAction, page]);

  const fetchLogs = async () => {
    let query = supabase
      .from('audit_logs')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterDate) {
      query = query
        .gte('created_at', `${filterDate}T00:00:00`)
        .lte('created_at', `${filterDate}T23:59:59`);
    }
    if (filterAction) {
      query = query.ilike('action', `%${filterAction}%`);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    if (data) setLogs(data);
  };

  const filteredLogs = search
    ? logs.filter(log =>
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.details?.toLowerCase().includes(search.toLowerCase()) ||
        log.profiles?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const actionTypes = ['POS_TRANSACTION','CREATE_RESERVATION','CANCEL_RESERVATION',
    'RESERVATION_CONFIRMED','RESERVATION_COMPLETED','CREATE_PRODUCT','UPDATE_PRODUCT',
    'DELETE_PRODUCT','CREATE_TABLE','UPDATE_TABLE'];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-gray-500 text-sm">System activity logs for transparency and accountability</p>
        </div>
      </div>

      {/* Filters */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search logs..."
          className="input input-bordered input-sm flex-1 min-w-48"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="input input-bordered input-sm"
          value={filterDate}
          onChange={e => { setFilterDate(e.target.value); setPage(0); }}
        />
        <select
          className="select select-bordered select-sm"
          value={filterAction}
          onChange={e => { setFilterAction(e.target.value); setPage(0); }}
        >
          <option value="">All Actions</option>
          {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {(filterDate || filterAction || search) && (
          <button onClick={() => { setFilterDate(''); setFilterAction(''); setSearch(''); setPage(0); }}
            className="btn btn-sm btn-ghost">
            Clear
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50">
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>Record ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.id} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-sm">{log.profiles?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{log.profiles?.email}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-xs font-mono ${actionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="text-xs text-gray-600 max-w-xs">{log.details}</td>
                  <td className="font-mono text-xs text-gray-400">
                    {log.record_id?.slice(0, 8) || '—'}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-10">No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">Showing {filteredLogs.length} logs</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn btn-xs btn-ghost">
              ← Prev
            </button>
            <span className="btn btn-xs btn-ghost cursor-default">Page {page + 1}</span>
            <button disabled={filteredLogs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)} className="btn btn-xs btn-ghost">
              Next →
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditTrail;

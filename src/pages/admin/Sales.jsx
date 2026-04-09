import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';

const Sales = () => {
  // Same useState + useEffect fetch pattern as event-gate
  const [transactions, setTransactions] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [summary, setSummary] = useState({ total: 0, count: 0 });

  useEffect(() => {
    fetchTransactions();
  }, [filterDate]);

  const fetchTransactions = async () => {
    let query = supabase
      .from('sales_transactions')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false });

    if (filterDate) {
      query = query
        .gte('created_at', `${filterDate}T00:00:00`)
        .lte('created_at', `${filterDate}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    if (data) {
      setTransactions(data);
      const total = data.reduce((s, t) => s + (t.total_amount || 0), 0);
      setSummary({ total, count: data.length });
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-gray-500 text-sm">Transaction history and daily sales</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            className="input input-bordered input-sm"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="btn btn-xs btn-ghost">Clear</button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold">₱{summary.total.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{filterDate ? `For ${filterDate}` : 'All time'}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold">{summary.count}</p>
          <p className="text-xs text-gray-400 mt-1">{filterDate ? `For ${filterDate}` : 'All time'}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <p className="font-semibold text-sm">Transaction Records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="text-xs text-gray-500">
                <th>ID</th>
                <th>Staff</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => {
                const items = tx.items ? JSON.parse(tx.items) : [];
                return (
                  <tr key={tx.id} className="text-sm">
                    <td className="font-mono text-xs text-gray-400">{tx.id?.slice(0,8).toUpperCase()}</td>
                    <td>{tx.profiles?.name || tx.profiles?.email || '—'}</td>
                    <td className="text-xs text-gray-500 max-w-xs truncate">
                      {items.map(i => `${i.product_name} x${i.qty}`).join(', ') || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-xs ${tx.payment_method === 'Cash' ? 'badge-success' : 'badge-info'}`}>
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="font-semibold">₱{tx.total_amount?.toFixed(2)}</td>
                    <td className="text-xs text-gray-400">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Sales;

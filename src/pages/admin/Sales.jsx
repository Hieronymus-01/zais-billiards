import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';
import {
  MdAttachMoney, MdReceipt, MdFilterList,
  MdClose, MdDownload
} from 'react-icons/md';
import { FaMoneyBillWave, FaMobileAlt } from 'react-icons/fa';

const Sales = () => {
  const [transactions, setTransactions] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, count: 0, cash: 0, gcash: 0 });
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [filterDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from('sales_transactions')
      .select('*, staff:profiles!staff_id(name, email)')
      .order('created_at', { ascending: false });

    if (filterDate) {
      query = query
        .gte('created_at', `${filterDate}T00:00:00`)
        .lte('created_at', `${filterDate}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) console.error('Sales fetch error:', error);
    if (data) {
      setTransactions(data);
      const total = data.reduce((s, t) => s + (t.total_amount || 0), 0);
      const cash = data.filter(t => t.payment_method === 'Cash').reduce((s, t) => s + (t.total_amount || 0), 0);
      const gcash = data.filter(t => t.payment_method === 'GCash').reduce((s, t) => s + (t.total_amount || 0), 0);
      setSummary({ total, count: data.length, cash, gcash });
    }
    setLoading(false);
  };

  // Safe parse items
  const parseItems = (items) => {
    if (!items) return [];
    if (typeof items === 'string') {
      try { return JSON.parse(items); } catch { return []; }
    }
    return Array.isArray(items) ? items : [];
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['ID', 'Staff', 'Items', 'Payment Method', 'Total Amount', 'Date & Time'];
    const rows = transactions.map(tx => {
      const items = parseItems(tx.items);
      return [
        tx.id?.slice(0, 8).toUpperCase(),
        tx.staff?.name || tx.staff?.email || '—',
        items.map(i => `${i.product_name} x${i.qty}`).join(' | '),
        tx.payment_method,
        tx.total_amount?.toFixed(2),
        new Date(tx.created_at).toLocaleString(),
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_${filterDate || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-gray-500 text-sm">Transaction history and daily sales</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white">
            <MdFilterList className="text-gray-400" />
            <input
              type="date"
              className="text-sm bg-transparent outline-none text-gray-700"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <MdClose className="text-sm" />
              </button>
            )}
          </div>
          <button
            onClick={exportCSV}
            disabled={transactions.length === 0}
            className="btn btn-ghost btn-sm rounded-full gap-2 border border-gray-200">
            <MdDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Revenue */}
        <div className="relative rounded-2xl p-5 overflow-hidden shadow-sm col-span-2 lg:col-span-1"
          style={{ background: 'linear-gradient(135deg, #064e3b, #059669)' }}>
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-white" />
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Total Revenue</p>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <MdAttachMoney className="text-white text-base" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">₱{summary.total.toFixed(2)}</p>
          <p className="text-xs text-white/60 mt-1">{filterDate ? `For ${filterDate}` : 'All time'}</p>
        </div>

        {/* Total Transactions */}
        <div className="relative rounded-2xl p-5 overflow-hidden shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-white" />
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Transactions</p>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <MdReceipt className="text-white text-base" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{summary.count}</p>
          <p className="text-xs text-white/60 mt-1">{filterDate ? `For ${filterDate}` : 'All time'}</p>
        </div>

        {/* Cash */}
        <div className="relative rounded-2xl p-5 overflow-hidden shadow-sm"
          style={{ background: 'linear-gradient(135deg, #374151, #1f2937)' }}>
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-white" />
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Cash</p>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <FaMoneyBillWave className="text-white text-base" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">₱{summary.cash.toFixed(2)}</p>
          <p className="text-xs text-white/60 mt-1">Cash payments</p>
        </div>

        {/* GCash */}
        <div className="relative rounded-2xl p-5 overflow-hidden shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-white" />
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">GCash</p>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <FaMobileAlt className="text-white text-base" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">₱{summary.gcash.toFixed(2)}</p>
          <p className="text-xs text-white/60 mt-1">GCash payments</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="font-bold text-sm flex items-center gap-2">
            <MdReceipt className="text-gray-400" />
            Transaction Records
          </p>
          <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
            {summary.count} record{summary.count !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">ID</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">Staff</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">Items</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">Payment</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">Amount</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">Date & Time</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-gray-300" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <MdReceipt className="text-4xl text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No transactions found.</p>
                    {filterDate && (
                      <p className="text-gray-300 text-xs mt-1">
                        Try clearing the date filter.
                      </p>
                    )}
                  </td>
                </tr>
              ) : transactions.map(tx => {
                const items = parseItems(tx.items);
                return (
                  <tr key={tx.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors text-sm">
                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                        {tx.id?.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">
                          {tx.staff?.name || '—'}
                        </p>
                        <p className="text-xs text-gray-400">{tx.staff?.email}</p>
                      </div>
                    </td>
                    <td>
                      <p className="text-xs text-gray-500 max-w-xs truncate">
                        {items.length > 0
                          ? items.map(i => `${i.product_name} x${i.qty}`).join(', ')
                          : '—'}
                      </p>
                      <p className="text-xs text-gray-300">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full
                        ${tx.payment_method === 'Cash'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'}`}>
                        {tx.payment_method === 'Cash'
                          ? <FaMoneyBillWave className="text-xs" />
                          : <FaMobileAlt className="text-xs" />}
                        {tx.payment_method}
                      </span>
                    </td>
                    <td>
                      <span className="font-black text-gray-800">
                        ₱{tx.total_amount?.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.created_at).toLocaleTimeString('en-PH', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="btn btn-xs btn-ghost rounded-full text-gray-400 hover:text-black">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            {/* Receipt Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg">Transaction Receipt</h2>
                <p className="text-xs text-gray-400 font-mono">
                  {selectedTx.id?.slice(0, 12).toUpperCase()}
                </p>
              </div>
              <button onClick={() => setSelectedTx(null)}
                className="btn btn-ghost btn-sm btn-circle">
                <MdClose />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Staff */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Staff</span>
                <span className="font-semibold">{selectedTx.staff?.name || '—'}</span>
              </div>

              {/* Date */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date & Time</span>
                <span className="font-semibold text-xs">
                  {new Date(selectedTx.created_at).toLocaleString('en-PH')}
                </span>
              </div>

              {/* Payment */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs
                  ${selectedTx.payment_method === 'Cash'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'}`}>
                  {selectedTx.payment_method}
                </span>
              </div>

              {/* Items */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Items Ordered
                </p>
                <div className="space-y-2">
                  {parseItems(selectedTx.items).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.product_name}
                        <span className="text-gray-400 ml-1">×{item.qty}</span>
                      </span>
                      <span className="font-semibold">
                        ₱{(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-3 flex justify-between font-black text-lg">
                <span>Total</span>
                <span>₱{selectedTx.total_amount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="px-6 pb-5">
              <button onClick={() => setSelectedTx(null)}
                className="btn btn-neutral w-full rounded-full">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Sales;
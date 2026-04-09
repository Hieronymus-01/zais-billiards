import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { supabase } from '../../utils/Supabase';

const Analytics = () => {
  // Same useState pattern as event-gate
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [reservationStats, setReservationStats] = useState({ total: 0, confirmed: 0, cancelled: 0, pending: 0 });
  const [period, setPeriod] = useState('week');

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    const now = new Date();
    let from;
    if (period === 'week') from = new Date(now - 7 * 86400000);
    else if (period === 'month') from = new Date(now - 30 * 86400000);
    else from = new Date(now.getFullYear(), 0, 1);

    const fromStr = from.toISOString().split('T')[0];

    // Fetch transactions for period - same fetch pattern
    const { data: txData } = await supabase
      .from('sales_transactions')
      .select('total_amount, items, created_at')
      .gte('created_at', `${fromStr}T00:00:00`);

    // Aggregate daily sales
    const dailyMap = {};
    (txData || []).forEach(tx => {
      const day = tx.created_at?.split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = 0;
      dailyMap[day] += tx.total_amount || 0;
    });
    setSalesData(Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue })).slice(-7));

    // Top products
    const productMap = {};
    (txData || []).forEach(tx => {
      const items = tx.items ? JSON.parse(tx.items) : [];
      items.forEach(item => {
        if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0, revenue: 0 };
        productMap[item.product_name].qty += item.qty;
        productMap[item.product_name].revenue += item.price * item.qty;
      });
    });
    const sorted = Object.entries(productMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    setTopProducts(sorted);

    // Reservation stats
    const { data: resData } = await supabase
      .from('customer_reservations')
      .select('status')
      .gte('created_at', `${fromStr}T00:00:00`);

    const stats = { total: 0, confirmed: 0, cancelled: 0, pending: 0, completed: 0 };
    (resData || []).forEach(r => { stats.total++; stats[r.status] = (stats[r.status] || 0) + 1; });
    setReservationStats(stats);
  };

  const maxRevenue = Math.max(...salesData.map(d => d.revenue), 1);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-gray-500 text-sm">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {['week','month','year'].map(p => (
            <button key={p}
              onClick={() => setPeriod(p)}
              className={`btn btn-sm rounded-full capitalize ${period === p ? 'btn-neutral' : 'btn-ghost border border-gray-300'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Reservation Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Reservations', value: reservationStats.total, color: 'text-black' },
          { label: 'Confirmed', value: reservationStats.confirmed, color: 'text-green-600' },
          { label: 'Pending', value: reservationStats.pending, color: 'text-yellow-600' },
          { label: 'Cancelled', value: reservationStats.cancelled, color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-gray-200 rounded-xl p-5 bg-white">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Daily Revenue Chart */}
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <p className="font-semibold mb-1">Daily Revenue</p>
          <p className="text-xs text-gray-400 mb-4">Sales trend for selected period</p>
          {salesData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No sales data yet.</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {salesData.map(({ date, revenue }) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-indigo-400 rounded-sm hover:bg-indigo-600 transition-colors cursor-default"
                    style={{ height: `${(revenue / maxRevenue) * 100}%` }}
                    title={`₱${revenue.toFixed(0)}`}
                  />
                  <span className="text-xs text-gray-400 rotate-45 origin-left text-[9px]">
                    {date?.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <p className="font-semibold mb-1">Top Selling Products</p>
          <p className="text-xs text-gray-400 mb-4">By revenue for selected period</p>
          {topProducts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, i) => {
                const pct = Math.round((product.revenue / topProducts[0].revenue) * 100);
                return (
                  <div key={product.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{i + 1}. {product.name}</span>
                      <span className="text-gray-500">₱{product.revenue.toFixed(0)} ({product.qty} sold)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="border border-gray-200 rounded-xl p-5 bg-white">
        <p className="font-semibold mb-4">Revenue Summary</p>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500">
                <th>Date</th>
                <th>Revenue</th>
                <th>vs Average</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map(({ date, revenue }) => {
                const avg = salesData.reduce((s, d) => s + d.revenue, 0) / (salesData.length || 1);
                const diff = revenue - avg;
                return (
                  <tr key={date}>
                    <td>{date}</td>
                    <td className="font-semibold">₱{revenue.toFixed(2)}</td>
                    <td className={diff >= 0 ? 'text-green-600' : 'text-red-500'}>
                      {diff >= 0 ? '+' : ''}₱{diff.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {salesData.length === 0 && (
                <tr><td colSpan={3} className="text-center text-gray-400 py-6">No data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;

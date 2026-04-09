import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';

const StatCard = ({ title, value, sub, highlight }) => (
  <div className="border border-gray-200 rounded-xl p-5 bg-white">
    <p className="text-sm text-gray-500 mb-2">{title}</p>
    <p className={`text-2xl font-bold ${highlight ? 'text-red-500' : 'text-black'}`}>{value}</p>
    <p className="text-xs text-gray-400 mt-1">{sub}</p>
  </div>
);

const Dashboard = () => {
  const { profile } = useContext(SessionContext);
  // Same useState + useEffect fetch pattern as event-gate
  const [stats, setStats] = useState({
    availableTables: 0,
    totalTables: 0,
    todayReservations: 0,
    todayRevenue: 0,
    lowStockCount: 0,
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const today = new Date().toISOString().split('T')[0];

      // Fetch tables
      const { data: tables } = await supabase.from('tables').select();
      const available = tables?.filter(t => t.status === 'available').length || 0;

      // Fetch today's reservations - same pattern as event-gate fetchEvents()
      const { data: todayRes } = await supabase
        .from('customer_reservations')
        .select()
        .eq('reservation_date', today)
        .neq('status', 'cancelled');

      // Today's revenue from sales_transactions
      const { data: todayTx } = await supabase
        .from('sales_transactions')
        .select('total_amount')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const todayRevenue = todayTx?.reduce((s, t) => s + (t.total_amount || 0), 0) || 0;

      // Low stock items
      const { data: lowStock } = await supabase
        .from('stock_monitoring')
        .select()
        .lt('quantity', 10);

      // Recent reservations
      const { data: recent } = await supabase
        .from('customer_reservations')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        availableTables: available,
        totalTables: tables?.length || 0,
        todayReservations: todayRes?.length || 0,
        todayRevenue,
        lowStockCount: lowStock?.length || 0,
      });
      setRecentReservations(recent || []);
    };

    fetchDashboard();
  }, []);

  // Simple bar chart using divs (no external chart lib needed)
  const maxRevenue = Math.max(...(weeklySales.map(d => d.revenue) || [1]));

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Overview of Zai's Billiard Hall and Bar Operations</p>

      {/* KPI Cards - from wireframe */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Available Tables"
          value={`${stats.availableTables}/${stats.totalTables}`}
          sub={`${stats.totalTables - stats.availableTables} currently occupied`}
        />
        <StatCard
          title="Today's Reservations"
          value={stats.todayReservations}
          sub="Active bookings for today"
        />
        <StatCard
          title="Today's Revenue"
          value={`₱${stats.todayRevenue.toFixed(2)}`}
          sub="From sales and reservations"
        />
        <StatCard
          title="Low Stock Item"
          value={stats.lowStockCount}
          sub="Need to restock soon"
          highlight={stats.lowStockCount > 0}
        />
      </div>

      {/* Charts Row - from wireframe */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Weekly Revenue - line chart placeholder */}
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <p className="font-semibold mb-1">Weekly Revenue</p>
          <p className="text-xs text-gray-400 mb-4">Revenue trends for the past week</p>
          <div className="flex items-end gap-2 h-28">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-indigo-400 rounded-sm"
                  style={{ height: `${Math.floor(Math.random() * 80 + 20)}%` }}
                />
                <span className="text-xs text-gray-400">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Category - bar chart from wireframe */}
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <p className="font-semibold mb-1">Sales by Category</p>
          <p className="text-xs text-gray-400 mb-4">Revenue breakdown by product category</p>
          <div className="flex items-end gap-4 h-28 justify-center">
            {[
              { label: 'Table', color: 'bg-amber-600', height: '90%' },
              { label: 'Food', color: 'bg-amber-600', height: '55%' },
              { label: 'Drinks', color: 'bg-amber-600', height: '70%' },
            ].map(({ label, color, height }) => (
              <div key={label} className="flex flex-col items-center gap-1 w-16">
                <div className={`w-full ${color} rounded-sm`} style={{ height }} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reservations - from wireframe */}
      <div className="border border-gray-200 rounded-xl p-5 bg-white">
        <p className="font-semibold mb-1">Recent Reservations</p>
        <p className="text-xs text-gray-400 mb-4">Currently occupied tables</p>
        {recentReservations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No reservations yet.</p>
        ) : (
          <div className="space-y-3">
            {recentReservations.map(res => (
              <div key={res.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{res.profiles?.name || 'Customer'}</p>
                  <p className="text-xs text-gray-400">
                    Table {res.table_id} — {res.start_time} to {res.end_time}
                  </p>
                </div>
                <span className={`badge badge-sm capitalize ${
                  res.status === 'confirmed' ? 'badge-success' :
                  res.status === 'pending' ? 'badge-warning' :
                  res.status === 'cancelled' ? 'badge-error' : 'badge-info'
                }`}>{res.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;

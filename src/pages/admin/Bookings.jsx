import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';

const statusBadge = (status) => ({
  pending: 'badge-warning', confirmed: 'badge-success',
  completed: 'badge-info', cancelled: 'badge-error',
}[status] || 'badge-ghost');

const Bookings = () => {
  const { profile } = useContext(SessionContext);
  // Same useState pattern as event-gate
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Same fetch pattern as event-gate fetchEvents()
    const { data: resData } = await supabase
      .from('customer_reservations')
      .select('*, profiles(name, phone_number, email)')
      .order('reservation_date', { ascending: false });

    const { data: tableData } = await supabase.from('tables').select();

    if (resData) setReservations(resData);
    if (tableData) setTables(tableData);
  };

  // Same update pattern as event-gate updateEvent()
  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('customer_reservations')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) { alert(error.message); return; }

    // Update table status if confirming
    const res = reservations.find(r => r.id === id);
    if (newStatus === 'confirmed' && res) {
      await supabase.from('tables').update({ status: 'reserved' }).eq('id', res.table_id);
    }
    if (newStatus === 'completed' && res) {
      await supabase.from('tables').update({ status: 'available' }).eq('id', res.table_id);
    }

    await supabase.from('audit_logs').insert({
      user_id: profile.id,
      action: `RESERVATION_${newStatus.toUpperCase()}`,
      table_name: 'customer_reservations',
      record_id: id,
      details: `Reservation ${id.slice(0, 8)} marked as ${newStatus}`,
    });

    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const getTable = (id) => tables.find(t => t.id === id);
  const filtered = filterStatus === 'all' ? reservations : reservations.filter(r => r.status === filterStatus);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-gray-500 text-sm">Manage all table reservations</p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button key={s}
              onClick={() => setFilterStatus(s)}
              className={`btn btn-xs rounded-full capitalize ${filterStatus === s ? 'btn-neutral' : 'btn-ghost border border-gray-300'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(res => {
          const table = getTable(res.table_id);
          const cart = res.pre_order ? JSON.parse(res.pre_order) : [];
          return (
            <div key={res.id} className="border border-gray-200 rounded-xl p-5 bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold">{res.profiles?.name || 'Customer'}</p>
                  <p className="text-xs text-gray-400">ID: {res.id?.slice(0, 14).toUpperCase()}</p>
                </div>
                <span className={`badge capitalize ${statusBadge(res.status)}`}>{res.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 mb-3">
                <span>📅 {res.reservation_date}</span>
                <span>📞 {res.profiles?.phone_number}</span>
                <span>⏰ {res.start_time} - {res.end_time}</span>
                <span>👥 {res.num_players} player(s)</span>
                <span>🎱 Table {table?.table_number}</span>
                <span>💰 ₱{res.total_amount?.toFixed(2)}</span>
              </div>

              {cart.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-2 mb-3 text-xs text-gray-500">
                  Pre-order: {cart.map(c => `${c.product_name} x${c.qty}`).join(', ')}
                </div>
              )}

              {/* Action buttons - role-based like event-gate admin actions */}
              <div className="flex gap-2 flex-wrap">
                {res.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(res.id, 'confirmed')} className="btn btn-xs btn-success rounded-full">Confirm</button>
                    <button onClick={() => updateStatus(res.id, 'cancelled')} className="btn btn-xs btn-error rounded-full">Cancel</button>
                  </>
                )}
                {res.status === 'confirmed' && (
                  <button onClick={() => updateStatus(res.id, 'completed')} className="btn btn-xs btn-info rounded-full">Mark Complete</button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-sm">No {filterStatus === 'all' ? '' : filterStatus} reservations found.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Bookings;

import React, { useState, useEffect, useContext } from 'react';
import MainLayouts from '../../Layouts/MainLayouts';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';
import { useNavigate } from 'react-router-dom';

const statusBadge = (status) => {
  const map = {
    pending: 'badge-warning',
    confirmed: 'badge-success',
    completed: 'badge-info',
    cancelled: 'badge-error',
  };
  return map[status] || 'badge-ghost';
};

const MyReservations = () => {
  const { session, profile } = useContext(SessionContext);
  const navigate = useNavigate();
  // Same useState pattern as event-gate Events.jsx
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    if (!session) navigate('/log-in');
  }, [session]);

  useEffect(() => {
    // Same fetch pattern as event-gate fetchRegistrations()
    const fetchData = async () => {
      const { data: resData } = await supabase
        .from('customer_reservations')
        .select()
        .eq('customer_id', profile?.id)
        .order('reservation_date', { ascending: false });

      const { data: tableData } = await supabase.from('tables').select();

      if (resData) setReservations(resData);
      if (tableData) setTables(tableData);
    };
    if (profile) fetchData();
  }, [profile]);

  // Same delete pattern as event-gate unregister()
  const handleCancel = async (reservationId) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    const { data, error } = await supabase
      .from('customer_reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
      .select()
      .single();

    if (error) { alert(error.message); return; }
    if (data) {
      setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: 'cancelled' } : r));

      // Audit log - same insert pattern
      await supabase.from('audit_logs').insert({
        user_id: profile.id,
        action: 'CANCEL_RESERVATION',
        table_name: 'customer_reservations',
        record_id: reservationId,
        details: `Customer ${profile.name} cancelled reservation ${reservationId}`,
      });
    }
  };

  const getTable = (tableId) => tables.find(t => t.id === tableId);
  const active = reservations.filter(r => r.status !== 'cancelled' && r.status !== 'completed');
  const past = reservations.filter(r => r.status === 'cancelled' || r.status === 'completed');

  return (
    <MainLayouts>
      <div className="max-w-lg mx-auto py-6">
        <h1 className="text-2xl font-bold text-center mb-1">My Reservations</h1>
        <p className="text-gray-500 text-sm text-center mb-6">View and manage your table bookings</p>

        {/* Active Reservations */}
        {active.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-sm mb-3">Active Reservations</h2>
            <div className="space-y-4">
              {active.map(res => {
                const table = getTable(res.table_id);
                const cart = res.pre_order ? JSON.parse(res.pre_order) : [];
                const balance = res.total_amount * 0.5;
                return (
                  <div key={res.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-bold">Table {table?.table_number}</p>
                      <span className={`badge ${statusBadge(res.status)} badge-sm capitalize`}>{res.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Booking ID: {res.id?.slice(0, 14).toUpperCase()}</p>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">📅 <span>{res.reservation_date}</span></div>
                      <div className="flex items-center gap-1">👥 <span>Player: {res.num_players}</span></div>
                      <div className="flex items-center gap-1">⏰ <span>{res.start_time} - {res.end_time}</span></div>
                      <div className="flex items-center gap-1">📞 <span>{profile?.phone_number}</span></div>
                    </div>

                    {cart.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-500 font-semibold mb-1">Pre-ordered Food & Beverages</p>
                        {cart.map(item => (
                          <p key={item.id} className="text-xs text-gray-600">{item.product_name} x{item.qty}</p>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-semibold mb-3">
                      <span>Total Amount: ₱{res.total_amount?.toFixed(2)}</span>
                      <span className="text-orange-500">Remaining Balance: ₱{balance.toFixed(2)}</span>
                    </div>

                    {res.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(res.id)}
                        className="btn btn-error btn-sm w-full rounded-full text-white"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Reservations */}
        {past.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm mb-3 text-gray-500">Past Reservations</h2>
            <div className="space-y-3">
              {past.map(res => {
                const table = getTable(res.table_id);
                return (
                  <div key={res.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 opacity-70">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">Table {table?.table_number}</p>
                        <p className="text-xs text-gray-400">{res.reservation_date} • {res.start_time} - {res.end_time}</p>
                      </div>
                      <span className={`badge ${statusBadge(res.status)} badge-sm capitalize`}>{res.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {reservations.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold">No reservations yet.</p>
            <p className="text-sm mt-1">Book a table to get started!</p>
          </div>
        )}
      </div>
    </MainLayouts>
  );
};

export default MyReservations;

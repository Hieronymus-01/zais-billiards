import React, { useState, useEffect, useContext } from 'react';
import MainLayouts from '../../Layouts/MainLayouts';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';
import { useNavigate } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa';
import { MdTableBar, MdPerson, MdPhone } from 'react-icons/md';

// ─── Step Indicator (from wireframe) ───────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = ['Table & Time', 'Menu', 'Confirmation'];
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = currentStep > step;
        const active = currentStep === step;
        return (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                ${done ? 'bg-green-500 text-white' : active ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
                {done ? <FaCheck className="text-xs" /> : step}
              </div>
              <span className={`text-sm font-medium ${active ? 'text-black' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px max-w-16 ${currentStep > step + 1 ? 'bg-green-400' : 'bg-gray-300'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Step 1: Select Table and Time ──────────────────────────────────────────
const Step1 = ({ tables, booking, setBooking, profile, onNext, onCancel }) => {
  const [calendar, setCalendar] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDay = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(calendar.getFullYear(), calendar.getMonth());
  const startDay = firstDay(calendar.getFullYear(), calendar.getMonth());
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const selectDate = (day) => {
    const d = new Date(calendar.getFullYear(), calendar.getMonth(), day);
    setBooking(prev => ({ ...prev, date: d.toISOString().split('T')[0] }));
  };

  const computeCost = () => {
    if (!booking.start_time || !booking.end_time || !booking.table_id) return 0;
    const table = tables.find(t => t.id === booking.table_id);
    if (!table) return 0;
    const [sh, sm] = booking.start_time.split(':').map(Number);
    const [eh, em] = booking.end_time.split(':').map(Number);
    const hours = Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
    return (hours * (table.price_per_hour || 50)).toFixed(2);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white">
      <h2 className="text-lg font-bold mb-1">Step 1: Select Table and Time</h2>
      <p className="text-gray-500 text-sm mb-5">Choose your preferred billiard table, date, and time slot.</p>

      {/* Select Table */}
      <p className="font-semibold text-sm mb-3">Select Table</p>
      <div className="flex gap-3 mb-6">
        {tables.map(table => (
          <button
            key={table.id}
            onClick={() => setBooking(prev => ({ ...prev, table_id: table.id }))}
            className={`border-2 rounded-xl p-4 text-center w-28 transition-all
              ${booking.table_id === table.id ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-500'}`}
          >
            <div className="text-xs font-bold mb-1">Table {table.table_number}</div>
            <MdTableBar className="text-2xl mx-auto mb-1" />
            <div className="text-xs">₱{table.price_per_hour}/hr</div>
          </button>
        ))}
      </div>

      {/* Calendar */}
      <p className="font-semibold text-sm mb-3 flex items-center gap-2">
        <span>📅</span> Select Date
      </p>
      <div className="border border-gray-200 rounded-xl p-4 inline-block mb-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCalendar(new Date(calendar.getFullYear(), calendar.getMonth() - 1))} className="btn btn-xs btn-ghost">‹</button>
          <span className="text-sm font-semibold">{monthNames[calendar.getMonth()]} {calendar.getFullYear()}</span>
          <button onClick={() => setCalendar(new Date(calendar.getFullYear(), calendar.getMonth() + 1))} className="btn btn-xs btn-ghost">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {dayNames.map(d => <div key={d} className="text-xs text-gray-400 font-semibold py-1">{d}</div>)}
          {Array.from({ length: (startDay === 0 ? 6 : startDay - 1) }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${calendar.getFullYear()}-${String(calendar.getMonth() + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isSelected = booking.date === dateStr;
            return (
              <button
                key={day}
                onClick={() => selectDate(day)}
                className={`w-8 h-8 text-xs rounded-full mx-auto
                  ${isSelected ? 'bg-black text-white font-bold' : 'hover:bg-gray-100'}`}
              >
                {day}
              </button>
            );
          })}
        </div>
        {booking.date && <p className="text-xs text-center text-gray-500 mt-2">Selected: {booking.date}</p>}
      </div>

      {/* Time and Players */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-sm font-semibold mb-2">⏰ Select Time</p>
          <div className="flex gap-3">
            <div>
              <label className="text-xs text-gray-500">Start Time</label>
              <input type="time" className="input input-bordered input-sm w-full"
                value={booking.start_time}
                onChange={e => setBooking(prev => ({ ...prev, start_time: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500">End Time</label>
              <input type="time" className="input input-bordered input-sm w-full"
                value={booking.end_time}
                onChange={e => setBooking(prev => ({ ...prev, end_time: e.target.value }))} />
            </div>
          </div>
          {booking.start_time && booking.end_time && (
            <div className="mt-2 bg-gray-100 rounded-lg px-3 py-1 text-xs text-gray-600">
              Cost: ₱{computeCost()}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">👥 Number of Players</p>
          <input type="number" min="1" max="10" className="input input-bordered input-sm w-full"
            value={booking.num_players}
            onChange={e => setBooking(prev => ({ ...prev, num_players: e.target.value }))} />
        </div>
      </div>

      {/* Customer Info */}
      <p className="font-semibold text-sm mb-3">Customer Information</p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <MdPerson className="text-gray-400" />
          <span>{profile?.name || 'Full Name'}</span>
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <MdPhone className="text-gray-400" />
          <span>{profile?.phone_number || 'Phone Number'}</span>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onCancel} className="btn btn-ghost rounded-full">Cancel</button>
        <button
          onClick={onNext}
          disabled={!booking.table_id || !booking.date || !booking.start_time || !booking.end_time}
          className="btn btn-neutral rounded-full"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ─── Step 2: Food & Beverages ────────────────────────────────────────────────
const Step2 = ({ booking, setBooking, onNext, onBack }) => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('Food');
  const tabs = ['Food', 'Beverages'];

  useEffect(() => {
    // Same fetch pattern as event-gate Events.jsx
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select().eq('is_available', true);
      if (error) console.error(error);
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    setBooking(prev => {
      const cart = prev.cart || [];
      const existing = cart.find(c => c.id === product.id);
      if (existing) {
        return { ...prev, cart: cart.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c) };
      }
      return { ...prev, cart: [...cart, { ...product, qty: 1 }] };
    });
  };

  const updateQty = (id, delta) => {
    setBooking(prev => {
      const cart = (prev.cart || []).map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0);
      return { ...prev, cart };
    });
  };

  const cart = booking.cart || [];
  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const filtered = products.filter(p => p.category === activeTab);

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white">
      <h2 className="text-lg font-bold mb-1">Step 2: Food & Beverages (Optional)</h2>
      <p className="text-gray-500 text-sm mb-5">Pre-order foods and drinks for your reservation</p>

      {/* Tab switcher - from wireframe */}
      <div className="flex rounded-full bg-gray-100 p-1 mb-5">
        {tabs.map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors
              ${activeTab === tab ? 'bg-white shadow text-black' : 'text-gray-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Product Grid - same map pattern as event-gate Events.jsx */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {filtered.map(product => (
          <div key={product.id} className="border border-gray-200 rounded-xl p-3 flex gap-3 items-center">
            <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              {product.image_url
                ? <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover rounded-lg" />
                : <span className="text-gray-400 text-xs">IMG</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{product.product_name}</p>
              <p className="text-gray-500 text-xs">₱{product.price}</p>
            </div>
            <button onClick={() => addToCart(product)} className="btn btn-xs btn-neutral rounded-full">
              Add
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-gray-400 text-sm py-6">No items in this category.</p>
        )}
      </div>

      {/* My Order Cart */}
      {cart.length > 0 && (
        <div className="border border-gray-200 rounded-xl p-4 mb-5">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2">🛒 My Order</p>
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-gray-400">₱{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.id, -1)} className="btn btn-xs btn-ghost border border-gray-300 rounded">-</button>
                <span className="text-sm w-5 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} className="btn btn-xs btn-ghost border border-gray-300 rounded">+</button>
                <button onClick={() => updateQty(item.id, -item.qty)} className="btn btn-xs btn-ghost text-red-500">🗑</button>
              </div>
            </div>
          ))}
          <div className="flex justify-between mt-3">
            <span className="text-sm font-semibold">Total:</span>
            <span className="text-sm font-bold">₱{total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="btn btn-ghost rounded-full">Back</button>
        <div className="flex gap-3">
          <button onClick={onNext} className="btn btn-ghost rounded-full">Skip</button>
          <button onClick={onNext} className="btn btn-neutral rounded-full">Next</button>
        </div>
      </div>
    </div>
  );
};

// ─── Step 3: Booking Summary / Confirmation ──────────────────────────────────
const Step3 = ({ booking, tables, profile, onBack, onConfirm, submitting }) => {
  const table = tables.find(t => t.id === booking.table_id);
  const cart = booking.cart || [];
  const tableTotal = (() => {
    if (!booking.start_time || !booking.end_time || !table) return 0;
    const [sh, sm] = booking.start_time.split(':').map(Number);
    const [eh, em] = booking.end_time.split(':').map(Number);
    const hours = Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
    return hours * (table.price_per_hour || 50);
  })();
  const foodTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const grandTotal = tableTotal + foodTotal;
  const advance = grandTotal * 0.5;
  const balance = grandTotal - advance;

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white">
      <h2 className="text-lg font-bold mb-5">Booking Summary</h2>

      <div className="grid grid-cols-2 gap-6 mb-5">
        {/* Reservation Details */}
        <div>
          <p className="font-semibold text-sm mb-3">Reservation Details</p>
          <div className="border border-gray-200 rounded-xl p-4 text-sm space-y-2">
            <div className="flex items-center gap-2 text-gray-600">📅 <span>Date:</span> <span className="font-medium text-black">{booking.date}</span></div>
            <div className="flex items-center gap-2 text-gray-600">⏰ <span>Time:</span> <span className="font-medium text-black">{booking.start_time} - {booking.end_time}</span></div>
            <div className="flex items-center gap-2 text-gray-600">👥 <span>Player:</span> <span className="font-medium text-black">{booking.num_players}</span></div>
          </div>
        </div>
        {/* Customer Info */}
        <div>
          <p className="font-semibold text-sm mb-3">Customer Information</p>
          <div className="border border-gray-200 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Name:</span><span className="font-medium">{profile?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Phone:</span><span className="font-medium">{profile?.phone_number}</span></div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4 text-sm">
        <p className="font-semibold mb-3">Cost Breakdown</p>
        <div className="flex justify-between text-gray-600 mb-1">
          <span>Table {table?.table_number} ({(() => {
            if (!booking.start_time || !booking.end_time) return '0';
            const [sh,sm] = booking.start_time.split(':').map(Number);
            const [eh,em] = booking.end_time.split(':').map(Number);
            return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60).toFixed(1);
          })()} hr)</span>
          <span>₱{tableTotal.toFixed(2)}</span>
        </div>
        {cart.map(item => (
          <div key={item.id} className="flex justify-between text-gray-600 mb-1">
            <span>{item.product_name} x{item.qty}</span>
            <span>₱{(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 mt-3 pt-3">
          <div className="flex justify-between font-semibold">
            <span>Total Amount</span>
            <span>₱{grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-orange-500 text-xs mt-1">
            <span>Balance: <span className="text-xs text-gray-400">*Balance to be paid at the counter</span></span>
            <span>₱{balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="alert bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-5 rounded-xl p-3">
        <strong>Note:</strong> Your reservation will be confirmed once we verify. You will receive a confirmation receipt after processing.
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="btn btn-ghost rounded-full">Back</button>
        <button onClick={onConfirm} disabled={submitting} className="btn btn-neutral rounded-full">
          {submitting ? 'Confirming...' : 'Confirm'}
        </button>
      </div>
    </div>
  );
};

// ─── Receipt Screen ──────────────────────────────────────────────────────────
const Receipt = ({ reservation, profile, tables, onBack }) => {
  const table = tables.find(t => t.id === reservation.table_id);
  const cart = reservation.pre_order ? JSON.parse(reservation.pre_order) : [];
  const foodTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const grandTotal = reservation.total_amount;
  const advance = grandTotal * 0.5;

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white text-center">
      <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3">
        <FaCheck className="text-white text-2xl" />
      </div>
      <h2 className="text-xl font-bold text-green-600 mb-1">Booking Confirmed!</h2>
      <p className="text-gray-400 text-sm mb-6">Your reservation has been successfully processed.</p>

      <div className="bg-indigo-600 text-white rounded-xl p-4 mb-4 text-left">
        <p className="font-bold text-lg">Booking Receipt</p>
        <p className="text-indigo-200 text-xs">BOOKING ID: {reservation.id?.slice(0, 14).toUpperCase()}</p>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 text-sm text-left space-y-4">
        <div>
          <p className="font-semibold mb-2 flex items-center gap-1">📅 Reservation Details</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-gray-600">
            <div className="flex justify-between"><span>Table:</span><span>Table {table?.table_number}</span></div>
            <div className="flex justify-between"><span>Date:</span><span>{reservation.reservation_date}</span></div>
            <div className="flex justify-between"><span>Time Slot:</span><span>{reservation.start_time} - {reservation.end_time}</span></div>
            <div className="flex justify-between"><span>Number of Players:</span><span>{reservation.num_players}</span></div>
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2 flex items-center gap-1">👤 Customer Information</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-gray-600">
            <div className="flex justify-between"><span>Name:</span><span>{profile?.name}</span></div>
            <div className="flex justify-between"><span>Phone:</span><span>{profile?.phone_number}</span></div>
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2">Order Summary</p>
          <div className="space-y-1 text-gray-600">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between">
                <span>{item.product_name} x{item.qty}</span>
                <span>₱{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-black">
              <span>Total Amount:</span><span>₱{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 space-y-1 text-xs">
          <p className="font-semibold text-sm text-black mb-1">Important Notes:</p>
          <p>• Please arrive <strong>10 minutes</strong> before your scheduled time.</p>
          <p>• Bring a <strong>valid ID</strong> for verification.</p>
          <p>• Pay the remaining balance at the venue.</p>
          <p>• Cancellation must be made 24 hours in advance.</p>
        </div>
      </div>

      <div className="flex justify-between mt-5">
        <button onClick={onBack} className="btn btn-ghost rounded-full">Back</button>
        <button onClick={() => window.print()} className="btn btn-neutral rounded-full">Print Receipt</button>
      </div>
    </div>
  );
};

// ─── Main BookTable Component ────────────────────────────────────────────────
const BookTable = () => {
  const { session, profile } = useContext(SessionContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tables, setTables] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);
  const [booking, setBooking] = useState({
    table_id: null,
    date: '',
    start_time: '',
    end_time: '',
    num_players: 1,
    cart: [],
  });

  useEffect(() => {
    if (!session) navigate('/log-in');
  }, [session]);

  useEffect(() => {
    // Same fetch pattern as event-gate
    const fetchTables = async () => {
      const { data, error } = await supabase.from('tables').select().eq('is_active', true);
      if (error) console.error(error);
      if (data) setTables(data);
    };
    fetchTables();
  }, []);

  // Same insert pattern as event-gate EventForm insertEvent()
  const handleConfirm = async () => {
    setSubmitting(true);
    const cart = booking.cart || [];
    const table = tables.find(t => t.id === booking.table_id);
    const [sh, sm] = booking.start_time.split(':').map(Number);
    const [eh, em] = booking.end_time.split(':').map(Number);
    const hours = Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
    const tableTotal = hours * (table?.price_per_hour || 50);
    const foodTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const grandTotal = tableTotal + foodTotal;

    const { data, error } = await supabase
      .from('customer_reservations')
      .insert({
        customer_id: profile.id,
        table_id: booking.table_id,
        reservation_date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        num_players: booking.num_players,
        pre_order: JSON.stringify(cart),
        total_amount: grandTotal,
        status: 'pending',
      })
      .select()
      .single();

    if (error) { alert(error.message); setSubmitting(false); return; }
    if (data) {
      // Log audit trail - same insert pattern
      await supabase.from('audit_logs').insert({
        user_id: profile.id,
        action: 'CREATE_RESERVATION',
        table_name: 'customer_reservations',
        record_id: data.id,
        details: `Customer ${profile.name} booked Table ${table?.table_number} on ${booking.date}`,
      });
      setConfirmedReservation(data);
      setStep(4); // receipt
    }
    setSubmitting(false);
  };

  return (
    <MainLayouts>
      <div className="max-w-lg mx-auto py-6">
        {step < 4 && <StepIndicator currentStep={step} />}

        {step === 1 && (
          <Step1
            tables={tables}
            booking={booking}
            setBooking={setBooking}
            profile={profile}
            onNext={() => setStep(2)}
            onCancel={() => navigate('/')}
          />
        )}
        {step === 2 && (
          <Step2
            booking={booking}
            setBooking={setBooking}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3
            booking={booking}
            tables={tables}
            profile={profile}
            onBack={() => setStep(2)}
            onConfirm={handleConfirm}
            submitting={submitting}
          />
        )}
        {step === 4 && confirmedReservation && (
          <Receipt
            reservation={confirmedReservation}
            profile={profile}
            tables={tables}
            onBack={() => navigate('/my-reservations')}
          />
        )}
      </div>
    </MainLayouts>
  );
};

export default BookTable;

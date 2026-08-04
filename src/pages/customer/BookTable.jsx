import React, { useState, useEffect, useContext } from 'react';
import MainLayouts from '../../Layouts/MainLayouts';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MdTableBar, MdPerson, MdPhone } from 'react-icons/md';

// ─── Helper: convert 12‑hour object to 24‑hour "HH:MM" ──────────────────
const convertTo24 = (hour12, minute, period) => {
  let h = parseInt(hour12, 10);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${minute}`;
};

// ─── Helper: format 24‑hour "HH:MM" to display string ──────────────────
const formatDisplay = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};

// ─── Step Indicator ──────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = ['Table & Time', 'Menu', 'Confirmation'];
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = currentStep === step;
        const isDone = currentStep > step;
        return (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${isDone ? 'bg-green-500 text-white' :
                    isActive ? 'bg-black text-white shadow-lg shadow-black/20' :
                      'bg-gray-100 text-gray-400'}`}
              >
                {isDone ? <FaCheck className="text-xs" /> : step}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-black' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 ${currentStep > step ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Step 1: Select Table and Time ──────────────────────────────────────
const Step1 = ({ tables, booking, setBooking, profile, onNext, onCancel }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDay(year, month);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const selectDate = (day) => {
    const d = new Date(year, month, day);
    setBooking(prev => ({ ...prev, date: d.toISOString().split('T')[0] }));
  };

  // ─── Time state (for dropdowns) ──────────────────────────────────────
  // These hold the 12‑hour parts so the UI stays in sync
  const [startHour, setStartHour] = useState('9');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState('AM');

  // When booking.start_time changes (e.g., from parent reset), update dropdowns
  useEffect(() => {
    if (booking.start_time) {
      const [h, m] = booking.start_time.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      setStartHour(String(hour12));
      setStartMinute(String(m).padStart(2, '0'));
      setStartPeriod(period);
    }
  }, [booking.start_time]);

  useEffect(() => {
    if (booking.end_time) {
      const [h, m] = booking.end_time.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      setEndHour(String(hour12));
      setEndMinute(String(m).padStart(2, '0'));
      setEndPeriod(period);
    }
  }, [booking.end_time]);

  // Update booking when any dropdown changes
  useEffect(() => {
    if (startHour && startMinute && startPeriod) {
      const newStart = convertTo24(startHour, startMinute, startPeriod);
      setBooking(prev => ({ ...prev, start_time: newStart }));
    }
  }, [startHour, startMinute, startPeriod]);

  useEffect(() => {
    if (endHour && endMinute && endPeriod) {
      const newEnd = convertTo24(endHour, endMinute, endPeriod);
      setBooking(prev => ({ ...prev, end_time: newEnd }));
    }
  }, [endHour, endMinute, endPeriod]);

  // ─── Calculations ─────────────────────────────────────────────────────
  const calculateHours = () => {
    if (!booking.start_time || !booking.end_time) return 0;
    const [sh, sm] = booking.start_time.split(':').map(Number);
    const [eh, em] = booking.end_time.split(':').map(Number);
    return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  };

  const calculateCost = () => {
    const table = tables.find(t => t.id === booking.table_id);
    if (!table || !booking.start_time || !booking.end_time) return 0;
    return calculateHours() * (table.price_per_hour || 50);
  };

  const getSelectedDateDisplay = () => {
    if (!booking.date) return 'Select a date';
    const d = new Date(booking.date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Options for dropdowns
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = ['00', '30'];
  const periods = ['AM', 'PM'];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-black mb-1">Step 1: Select Table and Time</h2>
      <p className="text-gray-500 text-sm mb-6">Choose your preferred billiard table, date, and time slot.</p>

      {/* Table Selection */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-black block mb-3">Select Table</label>
        <div className="grid grid-cols-3 gap-3">
          {tables.map(table => {
            const isSelected = booking.table_id === table.id;
            return (
              <button
                key={table.id}
                onClick={() => setBooking(prev => ({ ...prev, table_id: table.id }))}
                className={`relative rounded-xl border-2 p-4 text-center transition-all
                  ${isSelected
                    ? 'border-black bg-black text-white shadow-lg shadow-black/10'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}`}
              >
                <div className="text-sm font-bold mb-1">Table {table.table_number}</div>
                <MdTableBar className={`text-3xl mx-auto mb-1 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                <div className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                  ₱{table.price_per_hour}/hr
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-black block mb-3">Select Date</label>
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1))}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FaChevronLeft className="text-gray-600" />
            </button>
            <span className="font-semibold text-black">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1))}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FaChevronRight className="text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dayNames.map(d => (
              <div key={d} className="text-xs font-semibold text-gray-400 py-1 text-center">{d}</div>
            ))}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = booking.date === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  className={`aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-black text-white shadow-md shadow-black/20'
                      : isToday
                        ? 'border-2 border-black text-black hover:bg-gray-100'
                        : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {booking.date && (
            <div className="mt-3 text-center text-sm text-black font-medium">
              Selected: {getSelectedDateDisplay()}
            </div>
          )}
        </div>
      </div>

      {/* ─── Time Selection – Custom Dropdowns ─────────────────────────── */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-black block mb-2">Select Time</label>
        <div className="grid grid-cols-2 gap-4">
          {/* Start Time */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Start Time</label>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium py-1"
              >
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-gray-400">:</span>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium py-1"
              >
                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium py-1 ml-1"
              >
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* End Time */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">End Time</label>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium py-1"
              >
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-gray-400">:</span>
              <select
                value={endMinute}
                onChange={(e) => setEndMinute(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium py-1"
              >
                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium py-1 ml-1"
              >
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Duration & Cost */}
        {booking.start_time && booking.end_time && (
          <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-sm flex justify-between">
            <span>
              Duration: <strong>{calculateHours().toFixed(1)}</strong> hour(s)
            </span>
            <span>
              Cost: <strong className="text-black">₱{calculateCost().toFixed(2)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Players */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-black block mb-2">Players</label>
        <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
          <MdPerson className="text-gray-400" />
          <input
            type="number"
            min="1"
            max="10"
            className="w-full bg-transparent outline-none text-sm font-medium"
            value={booking.num_players}
            onChange={e => setBooking(prev => ({
              ...prev,
              num_players: Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
            }))}
          />
          <span className="text-gray-400 text-xs">max 10</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-black block mb-2">Customer Information</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">
            <MdPerson className="text-gray-400" />
            <span className="text-sm">{profile?.name || 'Full Name'}</span>
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">
            <MdPhone className="text-gray-400" />
            <span className="text-sm">{profile?.phone_number || 'Phone Number'}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <button onClick={onCancel} className="text-gray-500 hover:text-black font-medium px-4 py-2 rounded-lg transition">
          Cancel
        </button>
        <button
          onClick={onNext}
          disabled={!booking.table_id || !booking.date || !booking.start_time || !booking.end_time}
          className={`px-6 py-2.5 rounded-full font-semibold transition-all
            ${!booking.table_id || !booking.date || !booking.start_time || !booking.end_time
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/20'}`}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// ─── Step 2: Food & Beverages (unchanged) ─────────────────────────────
const Step2 = ({ booking, setBooking, onNext, onBack }) => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('Food');
  const tabs = ['Food', 'Beverages'];

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select()
        .eq('is_available', true);
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
      const cart = (prev.cart || [])
        .map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
        .filter(c => c.qty > 0);
      return { ...prev, cart };
    });
  };

  const cart = booking.cart || [];
  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const filtered = products.filter(p => p.category === activeTab);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-black mb-1">Step 2: Food & Beverages</h2>
      <p className="text-gray-500 text-sm mb-6">Pre-order foods and drinks for your reservation</p>

      <div className="flex rounded-full bg-gray-100 p-1 mb-5">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all
              ${activeTab === tab ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {filtered.map(product => (
          <div key={product.id} className="border border-gray-200 rounded-xl p-3 flex gap-3 items-center hover:border-gray-400 transition">
            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-gray-400 text-xs">No img</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{product.product_name}</p>
              <p className="text-gray-500 text-xs">₱{product.price}</p>
            </div>
            <button
              onClick={() => addToCart(product)}
              className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition"
            >
              Add
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-gray-400 text-sm py-8">No items in this category.</p>
        )}
      </div>

      {cart.length > 0 && (
        <div className="border border-gray-200 rounded-xl p-4 mb-6">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2">🛒 My Order</p>
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-gray-400">₱{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center">−</button>
                <span className="text-sm w-6 text-center font-medium">{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center">+</button>
                <button onClick={() => updateQty(item.id, -item.qty)} className="text-red-400 hover:text-red-600 text-sm ml-1">✕</button>
              </div>
            </div>
          ))}
          <div className="flex justify-between mt-3 pt-2 border-t border-gray-200">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-black">₱{total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2 border-t border-gray-100">
        <button onClick={onBack} className="text-gray-500 hover:text-black font-medium px-4 py-2 rounded-lg transition">Back</button>
        <div className="flex gap-3">
          <button onClick={onNext} className="text-gray-500 hover:text-black font-medium px-4 py-2 rounded-lg transition">Skip</button>
          <button onClick={onNext} className="px-6 py-2.5 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition shadow-lg shadow-black/20">Next →</button>
        </div>
      </div>
    </div>
  );
};

// ─── Step 3: Confirmation (unchanged) ──────────────────────────────────
const Step3 = ({ booking, tables, profile, onBack, onConfirm, submitting }) => {
  const table = tables.find(t => t.id === booking.table_id);
  const cart = booking.cart || [];

  const calculateHours = () => {
    if (!booking.start_time || !booking.end_time) return 0;
    const [sh, sm] = booking.start_time.split(':').map(Number);
    const [eh, em] = booking.end_time.split(':').map(Number);
    return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  };

  const tableTotal = calculateHours() * (table?.price_per_hour || 50);
  const foodTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const grandTotal = tableTotal + foodTotal;
  const advance = grandTotal * 0.5;
  const balance = grandTotal - advance;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-black mb-5">Booking Summary</h2>

      <div className="grid grid-cols-2 gap-6 mb-5">
        <div>
          <p className="font-semibold text-sm text-black mb-3">Reservation Details</p>
          <div className="border border-gray-200 rounded-xl p-4 text-sm space-y-2 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-14">📅 Date:</span>
              <span className="font-medium text-black">{booking.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-14">⏰ Time:</span>
              <span className="font-medium text-black">{booking.start_time} - {booking.end_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-14">👥 Players:</span>
              <span className="font-medium text-black">{booking.num_players}</span>
            </div>
          </div>
        </div>
        <div>
          <p className="font-semibold text-sm text-black mb-3">Customer Information</p>
          <div className="border border-gray-200 rounded-xl p-4 text-sm space-y-2 bg-gray-50/50">
            <div className="flex justify-between">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium text-black">{profile?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span className="font-medium text-black">{profile?.phone_number}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 mb-5 text-sm">
        <p className="font-semibold text-black mb-3">Cost Breakdown</p>
        <div className="flex justify-between text-gray-600 mb-1">
          <span>Table {table?.table_number} ({calculateHours().toFixed(1)} hrs)</span>
          <span>₱{tableTotal.toFixed(2)}</span>
        </div>
        {cart.map(item => (
          <div key={item.id} className="flex justify-between text-gray-600 mb-1">
            <span>{item.product_name} x{item.qty}</span>
            <span>₱{(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 mt-3 pt-3">
          <div className="flex justify-between font-semibold text-black">
            <span>Total Amount</span>
            <span>₱{grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-orange-500 text-xs mt-1">
            <span>Balance <span className="text-gray-400">*pay at counter</span></span>
            <span>₱{balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3 mb-5">
        <strong>Note:</strong> Your reservation will be confirmed once we verify. You will receive a confirmation receipt after processing.
      </div>

      <div className="flex justify-between pt-2 border-t border-gray-100">
        <button onClick={onBack} className="text-gray-500 hover:text-black font-medium px-4 py-2 rounded-lg transition">Back</button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className={`px-6 py-2.5 rounded-full font-semibold transition-all
            ${submitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/20'}`}
        >
          {submitting ? 'Confirming...' : 'Confirm'}
        </button>
      </div>
    </div>
  );
};

// ─── Receipt (unchanged) ───────────────────────────────────────────────
const Receipt = ({ reservation, profile, tables, onBack }) => {
  const table = tables.find(t => t.id === reservation.table_id);
  const cart = reservation.pre_order ? JSON.parse(reservation.pre_order) : [];
  const grandTotal = reservation.total_amount;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
      <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
        <FaCheck className="text-white text-2xl" />
      </div>
      <h2 className="text-xl font-bold text-green-600 mb-1">Booking Confirmed!</h2>
      <p className="text-gray-400 text-sm mb-6">Your reservation has been successfully processed.</p>

      <div className="bg-black text-white rounded-xl p-4 mb-4 text-left">
        <p className="font-bold text-lg">Booking Receipt</p>
        <p className="text-gray-400 text-xs">BOOKING ID: {reservation.id?.slice(0, 14).toUpperCase()}</p>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 text-sm text-left space-y-4">
        <div>
          <p className="font-semibold text-black mb-2">📅 Reservation Details</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-gray-600">
            <div className="flex justify-between"><span>Table:</span><span className="font-medium text-black">Table {table?.table_number}</span></div>
            <div className="flex justify-between"><span>Date:</span><span className="font-medium text-black">{reservation.reservation_date}</span></div>
            <div className="flex justify-between"><span>Time:</span><span className="font-medium text-black">{reservation.start_time} - {reservation.end_time}</span></div>
            <div className="flex justify-between"><span>Players:</span><span className="font-medium text-black">{reservation.num_players}</span></div>
          </div>
        </div>
        <div>
          <p className="font-semibold text-black mb-2">👤 Customer Information</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-gray-600">
            <div className="flex justify-between"><span>Name:</span><span className="font-medium text-black">{profile?.name}</span></div>
            <div className="flex justify-between"><span>Phone:</span><span className="font-medium text-black">{profile?.phone_number}</span></div>
          </div>
        </div>
        {cart.length > 0 && (
          <div>
            <p className="font-semibold text-black mb-2">Order Summary</p>
            <div className="space-y-1 text-gray-600">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.product_name} x{item.qty}</span>
                  <span>₱{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-black">
                <span>Total Amount:</span>
                <span>₱{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        <div className="bg-blue-50 rounded-lg p-3 space-y-1 text-xs">
          <p className="font-semibold text-sm text-black mb-1">Important Notes:</p>
          <p>• Please arrive <strong>10 minutes</strong> before your scheduled time.</p>
          <p>• Bring a <strong>valid ID</strong> for verification.</p>
          <p>• Pay the remaining balance at the venue.</p>
          <p>• Cancellation must be made 24 hours in advance.</p>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="text-gray-500 hover:text-black font-medium px-4 py-2 rounded-lg transition">Back</button>
        <button onClick={() => window.print()} className="px-6 py-2.5 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition shadow-lg shadow-black/20">Print Receipt</button>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────
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
  }, [session, navigate]);

  useEffect(() => {
    const fetchTables = async () => {
      const { data, error } = await supabase.from('tables').select().eq('is_active', true);
      if (error) console.error(error);
      if (data) setTables(data);
    };
    fetchTables();
  }, []);

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

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }
    if (data) {
      await supabase.from('audit_logs').insert({
        user_id: profile.id,
        action: 'CREATE_RESERVATION',
        table_name: 'customer_reservations',
        record_id: data.id,
        details: `Customer ${profile.name} booked Table ${table?.table_number} on ${booking.date}`,
      });
      setConfirmedReservation(data);
      setStep(4);
    }
    setSubmitting(false);
  };

  return (
    <MainLayouts>
      <div className="max-w-lg mx-auto py-8 px-4">
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
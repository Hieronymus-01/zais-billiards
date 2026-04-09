import { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './utils/Supabase';
import { SessionContext } from './Contexts/SessionContexts';

// Auth
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';

// Customer
import HomePage from './pages/customer/HomePage';
import BookTable from './pages/customer/BookTable';
import MyReservations from './pages/customer/MyReservations';

// Admin
import Dashboard from './pages/admin/Dashboard';
import POS from './pages/admin/POS';
import Tables from './pages/admin/Tables';
import Bookings from './pages/admin/Bookings';
import Sales from './pages/admin/Sales';
import Inventory from './pages/admin/Inventory';
import Analytics from './pages/admin/Analytics';
import AuditTrail from './pages/admin/AuditTrail';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
      } else if (session) {
        setSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', session.user.id)
        .single();

      if (error) console.error(error);
      if (data) setProfile(data);
    };

    if (session) fetchProfile();
  }, [session]);

  return (
    <SessionContext.Provider value={{ session, profile, setProfile }}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/log-in" element={<Login />} />

        {/* Customer */}
        <Route path="/book" element={<BookTable />} />
        <Route path="/my-reservations" element={<MyReservations />} />

        {/* Admin / Staff / Owner */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/pos" element={<POS />} />
        <Route path="/admin/tables" element={<Tables />} />
        <Route path="/admin/bookings" element={<Bookings />} />
        <Route path="/admin/sales" element={<Sales />} />
        <Route path="/admin/inventory" element={<Inventory />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/audit-trail" element={<AuditTrail />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </SessionContext.Provider>
  );
}

export default App;

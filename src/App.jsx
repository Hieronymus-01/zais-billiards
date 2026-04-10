import { useState, useEffect, useContext } from 'react';
import './App.css';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

// ─── Protected Route for Admin/Staff/Owner ───────────────────────────────────
const AdminRoute = ({ children }) => {
  const { session, profile } = useContext(SessionContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate('/log-in');
    } else if (profile && !['owner', 'staff'].includes(profile.role)) {
      navigate('/'); // customers get redirected to homepage
    }
  }, [session, profile]);

  // Still loading profile
  if (session && !profile) return null;

  return children;
};

// ─── Protected Route for Customers ───────────────────────────────────────────
const CustomerRoute = ({ children }) => {
  const { session } = useContext(SessionContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) navigate('/log-in');
  }, [session]);

  return children;
};

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Get initial session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSession(session);
    });

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

    return () => subscription.unsubscribe();
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

        {/* Customer Protected */}
        <Route path="/book" element={<CustomerRoute><BookTable /></CustomerRoute>} />
        <Route path="/my-reservations" element={<CustomerRoute><MyReservations /></CustomerRoute>} />

        {/* Admin Protected */}
        <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/pos" element={<AdminRoute><POS /></AdminRoute>} />
        <Route path="/admin/tables" element={<AdminRoute><Tables /></AdminRoute>} />
        <Route path="/admin/bookings" element={<AdminRoute><Bookings /></AdminRoute>} />
        <Route path="/admin/sales" element={<AdminRoute><Sales /></AdminRoute>} />
        <Route path="/admin/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
        <Route path="/admin/audit-trail" element={<AdminRoute><AuditTrail /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </SessionContext.Provider>
  );
}

export default App;
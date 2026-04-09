import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { SessionContext } from '../Contexts/SessionContexts';
import { supabase } from '../utils/Supabase';
import {
  MdDashboard,
  MdPointOfSale,
  MdTableBar,
  MdBookOnline,
  MdBarChart,
  MdInventory,
  MdAnalytics,
  MdSecurity,
} from 'react-icons/md';
import { FaUser } from 'react-icons/fa';

const Sidebar = () => {
  const { profile } = useContext(SessionContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
    else navigate('/log-in');
  };

  const navItem = ({ to, icon: Icon, label }) => (
    <li key={to}>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
            ? 'bg-gray-100 text-black font-semibold'
            : 'text-gray-600 hover:bg-gray-50 hover:text-black'
          }`
        }
      >
        <Icon className="text-xl" />
        {label}
      </NavLink>
    </li>
  );

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-gray-200">
        <span className="text-xl font-bold text-black">LOGO</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItem({ to: '/admin/dashboard', icon: MdDashboard, label: 'Dashboard' })}
          {navItem({ to: '/admin/pos', icon: MdPointOfSale, label: 'Point-of-Sale' })}
          {navItem({ to: '/admin/tables', icon: MdTableBar, label: 'Tables' })}
          {navItem({ to: '/admin/bookings', icon: MdBookOnline, label: 'Bookings' })}
          {navItem({ to: '/admin/sales', icon: MdBarChart, label: 'Sales' })}
          {navItem({ to: '/admin/inventory', icon: MdInventory, label: 'Inventory' })}

          {/* Owner-only */}
          {profile?.role === 'owner' && (
            <>
              {navItem({ to: '/admin/analytics', icon: MdAnalytics, label: 'Analytics' })}
              {navItem({ to: '/admin/audit-trail', icon: MdSecurity, label: 'Audit Trail' })}
            </>
          )}
        </ul>
      </nav>

      {/* User info at bottom */}
      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <FaUser className="text-gray-600 text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-black truncate capitalize">{profile?.role}</p>
          <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-xs btn-ghost text-red-500">
          Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

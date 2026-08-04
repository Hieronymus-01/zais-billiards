import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { SessionContext } from '../Contexts/SessionContexts';
import { supabase } from '../utils/Supabase';
import { FaUser, FaSignOutAlt, FaEdit, FaTimes, FaBars } from 'react-icons/fa';

const NavBar = () => {
  const { session, profile, setProfile } = useContext(SessionContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone_number: '' });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [navigate]);

  const handleLogout = async () => {
    setShowDropdown(false);
    setShowMobileMenu(false);
    await supabase.auth.signOut();
    navigate('/');
  };

  const openEditModal = () => {
    setForm({
      name: profile?.name || '',
      email: profile?.email || '',
      phone_number: profile?.phone_number || '',
    });
    setShowDropdown(false);
    setShowMobileMenu(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ name: form.name, phone_number: form.phone_number })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) alert(error.message);
    else {
      setProfile(data);
      setShowModal(false);
      alert('Profile updated!');
    }
    setSaving(false);
  };

  return (
    <>
      <div className="navbar bg-base-100 shadow-sm border-b border-gray-200 px-4">
        <div className="w-full max-w-7xl mx-auto">

          {/* Desktop: Links (left) — Logo (center) — Profile (right) */}
          <div className="hidden md:grid grid-cols-3 items-center">
            {/* Left: Nav Links */}
            <div className="flex items-center gap-2 justify-self-start">
              <NavLink end to="/" className={({ isActive }) => `btn btn-sm rounded-full ${isActive ? 'btn-neutral' : 'btn-ghost'}`}>HOME</NavLink>
              <NavLink to="/book" className={({ isActive }) => `btn btn-sm rounded-full ${isActive ? 'btn-neutral' : 'btn-ghost'}`}>BOOK</NavLink>
              {session && (
                <NavLink to="/my-reservations" className={({ isActive }) => `btn btn-sm rounded-full ${isActive ? 'btn-neutral' : 'btn-ghost'}`}>MY RESERVATION</NavLink>
              )}
            </div>

            {/* Center: Brand */}
            <NavLink to="/" className="btn btn-ghost px-0 flex flex-col items-center leading-none h-auto py-1 justify-self-center">
              <span className="text-xl font-bold">
                <span className="text-black">Zai's</span>
                <span className="text-gray-500"> Billiard</span>
              </span>
              <span className="text-[0.6rem] font-semibold tracking-widest text-gray-400 uppercase mt-0.5">
                Hall & Bar
              </span>
            </NavLink>

            {/* Right: Profile Dropdown */}
            <div className="justify-self-end">
              {session ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(prev => !prev)}
                    className="btn btn-sm btn-ghost rounded-full"
                  >
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                      {profile?.name?.[0]?.toUpperCase() || <FaUser />}
                    </div>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="font-semibold text-sm text-black truncate">{profile?.name || 'User'}</p>
                        <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                        <p className="text-xs text-gray-400">{profile?.phone_number}</p>
                      </div>
                      <button
                        onMouseDown={openEditModal}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-left"
                      >
                        <FaEdit className="text-gray-400" />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onMouseDown={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-50 text-red-500 transition-colors text-left border-t border-gray-100"
                      >
                        <FaSignOutAlt />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink to="/log-in" className="btn btn-sm btn-ghost rounded-full">
                  <FaUser />
                </NavLink>
              )}
            </div>
          </div>

          {/* Mobile: Brand (left) — Profile + Hamburger (right) */}
          <div className="flex md:hidden items-center justify-between">
            <NavLink to="/" className="btn btn-ghost px-0 flex flex-col items-start leading-none h-auto py-1">
              <span className="text-xl font-bold">
                <span className="text-black">Zai's</span>
                <span className="text-gray-500"> Billiard</span>
              </span>
              <span className="text-[0.6rem] font-semibold tracking-widest text-gray-400 uppercase mt-0.5">
                Hall & Bar
              </span>
            </NavLink>

            <div className="flex items-center gap-2">
              {session && (
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {profile?.name?.[0]?.toUpperCase() || <FaUser />}
                </div>
              )}
              <button
                onClick={() => setShowMobileMenu(prev => !prev)}
                className="btn btn-sm btn-ghost rounded-full"
              >
                {showMobileMenu ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 px-4 py-3 flex flex-col gap-1">
            <NavLink end to="/"
              onClick={() => setShowMobileMenu(false)}
              className={({ isActive }) => `btn btn-sm rounded-full justify-start ${isActive ? 'btn-neutral' : 'btn-ghost'}`}>
              HOME
            </NavLink>
            <NavLink to="/book"
              onClick={() => setShowMobileMenu(false)}
              className={({ isActive }) => `btn btn-sm rounded-full justify-start ${isActive ? 'btn-neutral' : 'btn-ghost'}`}>
              BOOK
            </NavLink>
            {session && (
              <NavLink to="/my-reservations"
                onClick={() => setShowMobileMenu(false)}
                className={({ isActive }) => `btn btn-sm rounded-full justify-start ${isActive ? 'btn-neutral' : 'btn-ghost'}`}>
                MY RESERVATION
              </NavLink>
            )}

            {session ? (
              <>
                <div className="border-t border-gray-100 my-1" />
                <div className="px-2 py-1">
                  <p className="font-semibold text-sm text-black">{profile?.name || 'User'}</p>
                  <p className="text-xs text-gray-400">{profile?.email}</p>
                </div>
                <button
                  onClick={openEditModal}
                  className="btn btn-sm btn-ghost rounded-full justify-start gap-2"
                >
                  <FaEdit className="text-gray-400" />
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-ghost rounded-full justify-start gap-2 text-red-500 hover:bg-red-50"
                >
                  <FaSignOutAlt />
                  Log Out
                </button>
              </>
            ) : (
              <NavLink to="/log-in"
                onClick={() => setShowMobileMenu(false)}
                className="btn btn-sm btn-ghost rounded-full justify-start gap-2">
                <FaUser />
                Log In
              </NavLink>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle">
                <FaTimes />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold">
                  {form.name?.[0]?.toUpperCase() || <FaUser />}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
                <input
                  type="email"
                  className="input input-bordered w-full bg-gray-50 cursor-not-allowed"
                  value={form.email}
                  disabled
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone Number</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.phone_number}
                  onChange={e => setForm(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="09XXXXXXXXX"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost rounded-full">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-neutral rounded-full">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;
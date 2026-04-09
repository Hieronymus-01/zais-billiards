import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { SessionContext } from '../Contexts/SessionContexts';
import { supabase } from '../utils/Supabase';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';

const NavBar = () => {
  const { session, profile } = useContext(SessionContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
    else navigate('/');
  };

  return (
    <div className="navbar bg-base-100 shadow-sm border-b border-gray-200">
      <div className="flex w-full max-w-7xl mx-auto px-4">

        {/* Brand */}
        <div className="flex-1">
          <NavLink to="/" className="btn btn-ghost px-0 flex flex-col items-start leading-none h-auto py-1">
            <span className="text-xl font-bold">
              <span className="text-black">Zai's</span>
              <span className="text-gray-500"> Billiard</span>
            </span>
            <span className="text-[0.6rem] font-semibold tracking-widest text-gray-400 uppercase mt-0.5">
              Hall & Bar
            </span>
          </NavLink>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `btn btn-sm rounded-full ${isActive ? 'btn-neutral' : 'btn-ghost'}`
            }
          >
            HOME
          </NavLink>

          <NavLink
            to="/book"
            className={({ isActive }) =>
              `btn btn-sm rounded-full ${isActive ? 'btn-neutral' : 'btn-ghost'}`
            }
          >
            BOOK
          </NavLink>

          {session && (
            <NavLink
              to="/my-reservations"
              className={({ isActive }) =>
                `btn btn-sm rounded-full ${isActive ? 'btn-neutral' : 'btn-ghost'}`
              }
            >
              MY RESERVATION
            </NavLink>
          )}

          {/* Auth buttons */}
          {!session && (
            <>
              <NavLink to="/log-in" className="btn btn-sm btn-ghost rounded-full">
                <FaUser className="text-sm" />
              </NavLink>
              <NavLink to="/log-in" className="btn btn-sm btn-ghost rounded-full">
                <FaSignOutAlt className="text-sm" />
              </NavLink>
            </>
          )}

          {session && (
            <>
              <NavLink to="/log-in" className="btn btn-sm btn-ghost rounded-full">
                <FaUser className="text-sm" />
              </NavLink>
              <button onClick={handleLogout} className="btn btn-sm btn-ghost rounded-full">
                <FaSignOutAlt className="text-sm" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;

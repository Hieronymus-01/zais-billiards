import React, { useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';
import Input from '../../components/Forms/Input';
import { FaPaperPlane } from 'react-icons/fa';

const Login = () => {
  const { session, profile } = useContext(SessionContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.role === 'customer') {
      navigate('/');
    } else if (profile?.role === 'staff' || profile?.role === 'owner') {
      navigate('/admin/dashboard');
    }
  }, [profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const loginForm = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (error) { alert(error.message); return; }

    // Manually fetch profile after login to determine role
    if (data?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) { alert(profileError.message); return; }

      if (profileData?.role === 'owner' || profileData?.role === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left black branding panel */}
      <div className="w-80 bg-black flex flex-col items-center justify-center flex-shrink-0">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-4">
          <span className="text-black font-bold text-sm">LOGO</span>
        </div>
        <p className="text-white text-lg font-bold">Zai's Billiard</p>
        <p className="text-gray-400 text-xs">Hall & Bar Management System</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-8">
        <div className="w-full max-w-md">
          {/* Tab switcher */}
          <div className="flex mb-8 border-b border-gray-200">
            <button className="flex-1 py-3 text-sm font-bold border-b-2 border-black text-black">
              Log In
            </button>
            <Link
              to="/sign-up"
              className="flex-1 py-3 text-sm text-center text-gray-400 hover:text-black transition-colors"
            >
              Sign Up
            </Link>
          </div>

          <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit}>
            <Input
              name="email"
              label="Email"
              type="email"
              placeholder="Email address"
              required
            />
            <Input
              name="password"
              label="Password"
              type="password"
              placeholder="Password"
              required
            />

            <div className="flex justify-end mb-4">
              <a href="#" className="text-sm text-gray-500 hover:text-black">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-neutral w-full rounded-full mt-2"
            >
              <FaPaperPlane className="text-sm" /> Log In
            </button>
          </form>

          <p className="text-center text-sm mt-5 text-gray-500">
            Don't have an account yet?{' '}
            <Link to="/sign-up" className="font-bold text-black hover:underline">
              Sign Up
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-6">
            By logging in, you agree to our{' '}
            <a href="#" className="underline">Terms of Service</a> and{' '}
            <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
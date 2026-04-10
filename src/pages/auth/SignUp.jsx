import React, { useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';
import Input from '../../components/Forms/Input';
import { FaPaperPlane } from 'react-icons/fa';

const SignUp = () => {
  const { session } = useContext(SessionContext);
  const navigate = useNavigate();

  // Same as event-gate SignUp.jsx
  useEffect(() => {
    if (session) navigate('/');
  }, [session, navigate]);

  // Same pattern as event-gate handleSubmit + profile insert
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const signUpForm = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone_number: formData.get('phone_number'),
      password: formData.get('password'),
      confirm_password: formData.get('confirm_password'),
    };

    if (signUpForm.password !== signUpForm.confirm_password) {
      alert('Passwords do not match.');
      return;
    }

    // Step 1: Create auth user - same as event-gate
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: signUpForm.email,
      password: signUpForm.password,
      options: {
        data: {
          name: signUpForm.name,
          phone: signUpForm.phone_number,
        }
      }
    });

    if (signUpError) { alert(signUpError.message); return; }

    // Step 2: Insert profile - same pattern, adds phone_number + role
    if (signUpData?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        name: signUpForm.name,
        email: signUpForm.email,
        phone_number: signUpForm.phone_number,
        role: 'customer',
      });

      if (profileError) alert(profileError.message);
      else navigate('/log-in');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left black branding panel - from wireframe */}
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
          {/* Tab switcher - from wireframe */}
          <div className="flex mb-8 border-b border-gray-200">
            <Link
              to="/log-in"
              className="flex-1 py-3 text-sm text-center text-gray-400 hover:text-black transition-colors"
            >
              Log In
            </Link>
            <button className="flex-1 py-3 text-sm font-bold border-b-2 border-black text-black">
              Sign Up
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-6">Create Account</h2>

          <form onSubmit={handleSubmit}>
            <Input name="name" label="Name" type="text" placeholder="Full Name" required />
            <Input name="email" label="Email" type="email" placeholder="Email address" required />
            <Input name="phone_number" label="Phone Number" type="text" placeholder="09XXXXXXXXX" required />

            <div className="grid grid-cols-2 gap-3">
              <Input name="password" label="Create Password" type="password" placeholder="••••••••" required />
              <Input name="confirm_password" label="Confirm Password" type="password" placeholder="••••••••" required />
            </div>

            <button type="submit" className="btn btn-neutral w-full rounded-full mt-4">
              <FaPaperPlane className="text-sm" /> Sign Up
            </button>
          </form>

          <p className="text-center text-sm mt-5 text-gray-500">
            Already have an account?{' '}
            <Link to="/log-in" className="font-bold text-black hover:underline">
              Log In
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-6">
            By signing up, you agree to our{' '}
            <a href="#" className="underline">Terms of Service</a> and{' '}
            <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

import React from 'react';
import MainLayouts from '../../Layouts/MainLayouts';
import { Link } from 'react-router-dom';
import { MdBookOnline, MdAccessTime, MdGroup } from 'react-icons/md';

const HomePage = () => {
  return (
    <MainLayouts>
      {/* Hero Section - from wireframe */}
      <section className="flex items-center justify-between py-12 px-4">
        <div className="max-w-sm">
          <h1 className="text-4xl font-bold leading-tight mb-3">
            Welcome to Zai's Billiard Hall and Bar
          </h1>
          <p className="text-gray-500 mb-6">Reserve your table and enjoy!</p>
          <Link to="/book" className="btn btn-neutral rounded-full px-6">
            Book Table
          </Link>
        </div>

        {/* Hero image placeholder - from wireframe */}
        <div className="flex gap-3">
          <div className="w-32 h-40 bg-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-gray-400 text-xs text-center">Billiard<br />Photo</span>
          </div>
          <div className="w-28 h-36 bg-gray-300 rounded-xl flex items-center justify-center mt-6">
            <span className="text-gray-400 text-xs text-center">Billiard<br />Photo</span>
          </div>
          <div className="w-28 h-36 bg-gray-200 rounded-xl flex items-center justify-center mt-3">
            <span className="text-gray-400 text-xs text-center">Billiard<br />Photo</span>
          </div>
        </div>
      </section>

      {/* Feature Cards - from wireframe: Easy Booking, Flexible Hours, Group Play */}
      <section className="grid grid-cols-3 gap-4 px-4 pb-10">
        <div className="border border-gray-200 rounded-xl p-5 flex items-center gap-4 bg-white shadow-sm">
          <MdBookOnline className="text-3xl text-black" />
          <span className="font-semibold">Easy Booking</span>
        </div>
        <div className="border border-gray-200 rounded-xl p-5 flex items-center gap-4 bg-white shadow-sm">
          <MdAccessTime className="text-3xl text-black" />
          <span className="font-semibold">Flexible Hours</span>
        </div>
        <div className="border border-gray-200 rounded-xl p-5 flex items-center gap-4 bg-white shadow-sm">
          <MdGroup className="text-3xl text-black" />
          <span className="font-semibold">Group Play</span>
        </div>
      </section>

      {/* About Us - from wireframe */}
      <section className="px-4 pb-10">
        <h2 className="text-2xl font-bold text-center mb-5">About Us</h2>
        <div className="border border-gray-200 rounded-xl p-6 flex gap-6 bg-white shadow-sm">
          <div className="w-40 h-28 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-gray-400 text-xs">Photo</span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Zai's Billiard Hall and Bar is a growing local establishment, founded in 2012,
            offering billiard games, food, and beverages. Located at Bayan-Bayanan Ave,
            Marikina City, Metro Manila. We offer a fun and relaxed environment for leisure,
            group play, and private events.
          </p>
        </div>
      </section>

      {/* How to Book - from wireframe: 4 steps */}
      <section className="px-4 pb-12">
        <h2 className="text-2xl font-bold text-center mb-8">How to Book?</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { step: 1, title: 'Select Table & Time', desc: 'Choose your preferred table, date, and time slot' },
            { step: 2, title: 'Add Food & Drinks', desc: 'Optional: Pre-order from our menu' },
            { step: 3, title: 'Pay 50% Advance', desc: 'Secure your booking with GCash payment' },
            { step: 4, title: 'Get Confirmation', desc: 'Receive receipt and booking details' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm text-center">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
                {step}
              </div>
              <p className="font-semibold text-sm mb-1">{title}</p>
              <p className="text-gray-500 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </MainLayouts>
  );
};

export default HomePage;

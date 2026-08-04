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

        {/* Hero image + doodle illustration - matches updated wireframe */}
        <div className="relative w-64 h-56 flex-shrink-0 hidden sm:block">
          {/* Hand-drawn doodle: swirl, cue stick, 7-ball */}
          <svg
            viewBox="0 0 260 220"
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            fill="none"
          >
            {/* Scribble swirl framing the cards */}
            <path
              d="M70,55 C40,15 130,-15 190,10 C245,32 255,90 225,125
                 C200,155 165,175 135,168 C160,178 200,172 222,150"
              stroke="#111827"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Cue stick */}
            <line x1="8" y1="150" x2="150" y2="45" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="8" y1="150" x2="24" y2="140" stroke="#111827" strokeWidth="4" strokeLinecap="round" />

            {/* 7-ball */}
            <circle cx="34" cy="118" r="19" fill="#111827" />
            <circle cx="34" cy="118" r="19" fill="none" stroke="#111827" strokeWidth="1" />
            <circle cx="27" cy="111" r="4" fill="white" opacity="0.5" />
            <text x="34" y="123" fontSize="15" fontWeight="700" fill="white" textAnchor="middle">7</text>
          </svg>

          {/* Overlapping tilted photo cards */}
          <div className="absolute top-10 left-14 w-28 h-36 bg-gray-300 rounded-xl shadow-md -rotate-6 flex items-center justify-center">
            <span className="text-gray-500 text-xs text-center">Billiard<br />Photo</span>
          </div>
          <div className="absolute top-2 left-32 w-28 h-36 bg-gray-200 rounded-xl shadow-md rotate-6 flex items-center justify-center">
            <span className="text-gray-500 text-xs text-center">Billiard<br />Photo</span>
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
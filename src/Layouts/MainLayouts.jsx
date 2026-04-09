import React from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

const MainLayouts = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-7xl w-full mx-auto flex-1 px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayouts;

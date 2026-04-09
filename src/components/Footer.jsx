import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
        All Rights Reserved © {new Date().getFullYear()}
      </div>
    </footer>
  );
};

export default Footer;

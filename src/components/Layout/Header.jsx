import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-golf-green">
              🏌️ Golf Majors Pool
            </h1>
          </div>
          <nav className="flex space-x-8">
            <span className="text-gray-900 hover:text-golf-green px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
              Dashboard
            </span>
            <span className="text-gray-900 hover:text-golf-green px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
              Analytics
            </span>
            <span className="text-gray-900 hover:text-golf-green px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
              Pool Insights
            </span>
            <span className="text-gray-900 hover:text-golf-green px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
              Live Data
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
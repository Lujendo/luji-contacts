import React from 'react';
import {
  Mail,
  UserCircle,
  LogOut,
  ArrowUpDown,
  History,
  Settings,
  Search
} from 'lucide-react';

const FixedNavigation = ({ 
  user, 
  searchTerm, 
  handleSearch, 
  handleLogout, 
  setShowImportExport, 
  setShowEmailHistory, 
  setShowSettings 
}) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Mail size={24} className="mr-2 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-800">Contact Manager</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowImportExport(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700
                        bg-white border border-gray-300 rounded-md hover:bg-gray-50
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <ArrowUpDown size={18} className="mr-2" />
              Import/Export
            </button>
            <button
              onClick={() => setShowEmailHistory(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700
                        bg-white border border-gray-300 rounded-md hover:bg-gray-50
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <History size={18} className="mr-2" />
              Email History
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700
                        bg-white border border-gray-300 rounded-md hover:bg-gray-50
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Settings size={18} className="mr-2" />
              Settings
            </button>
            <div className="flex items-center space-x-2 text-gray-700">
              <UserCircle size={24} className="text-gray-500" />
              <span className="text-sm font-medium">
                {user?.name || user?.username || 'Loading...'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 
                        bg-red-50 rounded-md hover:bg-red-100 focus:outline-none 
                        focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
            <div className="flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 
                            focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default FixedNavigation;
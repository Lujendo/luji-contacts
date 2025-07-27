import React from 'react';
import { Link } from 'react-router-dom';

const UserMenu = ({ onLogout, onSettingsClick }) => {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
      <button
        onClick={() => onSettingsClick('subscription')}
        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        Subscription
      </button>
      <button 
        onClick={onLogout}
        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        Logout
      </button>
    </div>
  );
};

export default UserMenu;
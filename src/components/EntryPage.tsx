import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const EntryPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const toggleMode = (): void => {
    setIsLogin(prev => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-96 max-w-md">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
        
        {isLogin ? <Login /> : <Register />}
        
        <div className="mt-4 text-center">
          <button 
            onClick={toggleMode}
            className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition-colors duration-200"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntryPage;

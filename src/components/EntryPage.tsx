import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const EntryPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const toggleMode = (): void => {
    setIsLogin(prev => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-black relative overflow-hidden">
      {/* Glowing orbs for enhanced effect */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-slate-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>

      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-96 max-w-md border border-white/20 relative z-10">
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

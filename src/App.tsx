import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { MobileProvider } from './context/MobileContext';
import { AppearanceProvider } from './contexts/AppearanceContext';
import { QueryProvider } from './providers/QueryProvider';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import EntryPage from './components/EntryPage';
import LandingPage from './components/LandingPage';
import ResponsiveApp from './components/ResponsiveApp';

const App: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <MobileProvider>
          <AppearanceProvider>
            <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<EntryPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ResponsiveApp />} />
            {/* Keep original dashboard route for desktop-specific access */}
            <Route path="/dashboard-desktop" element={<Dashboard />} />
          </Routes>
            </Router>
          </AppearanceProvider>
        </MobileProvider>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryProvider>
  );
};

export default App;

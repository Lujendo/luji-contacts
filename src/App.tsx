import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
    </QueryProvider>
  );
};

export default App;

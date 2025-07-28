import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Mail,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  Sparkles,
  Database,
  Cloud,
  Lock
} from 'lucide-react';
import FloatingElements from './ui/FloatingElements';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const { elementRef: featuresRef, isVisible: featuresVisible } = useScrollAnimation({ threshold: 0.2 });
  const { elementRef: ctaRef, isVisible: ctaVisible } = useScrollAnimation({ threshold: 0.3 });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Large glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-slate-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>

        {/* Floating Elements Component */}
        <FloatingElements />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 lg:px-12">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Luji Contacts</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSignIn}
            className="text-white/80 hover:text-white transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Sign In
          </button>
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className={`relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-blue-300" />
            <span className="text-blue-100 text-sm font-medium">Modern Contact Management</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Manage Your
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> Contacts</span>
            <br />
            Like Never Before
          </h1>

          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            A powerful, modern contact management system built for professionals. 
            Organize, connect, and grow your network with intelligent features and beautiful design.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <button
              onClick={handleGetStarted}
              className="group bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 flex items-center space-x-2"
            >
              <span>Start Free Today</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            
            <button
              onClick={handleSignIn}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-200 flex items-center space-x-2"
            >
              <span>Sign In</span>
            </button>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Database className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Smart Organization</h3>
              <p className="text-white/70 text-sm">Intelligent contact grouping and advanced search capabilities</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Cloud Sync</h3>
              <p className="text-white/70 text-sm">Access your contacts anywhere with secure cloud synchronization</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Privacy First</h3>
              <p className="text-white/70 text-sm">Enterprise-grade security with end-to-end encryption</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Powerful features designed to streamline your contact management and boost your productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group ${featuresVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`} style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:animate-glow transition-all duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-4">Smart Groups</h3>
              <p className="text-white/70 leading-relaxed">
                Organize contacts into intelligent groups with advanced filtering and tagging capabilities.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group ${featuresVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`} style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:animate-glow transition-all duration-300">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-4">Email Integration</h3>
              <p className="text-white/70 leading-relaxed">
                Send emails directly from the platform with templates and tracking capabilities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group ${featuresVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`} style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:animate-glow transition-all duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-4">Secure & Private</h3>
              <p className="text-white/70 leading-relaxed">
                Your data is protected with enterprise-grade security and privacy controls.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group ${featuresVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`} style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:animate-glow transition-all duration-300">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-4">Lightning Fast</h3>
              <p className="text-white/70 leading-relaxed">
                Built on modern technology for instant search and seamless performance.
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group ${featuresVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`} style={{ animationDelay: '0.5s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:animate-glow transition-all duration-300">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-4">Global Access</h3>
              <p className="text-white/70 leading-relaxed">
                Access your contacts from anywhere in the world with cloud synchronization.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group ${featuresVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`} style={{ animationDelay: '0.6s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:animate-glow transition-all duration-300">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-4">Premium Experience</h3>
              <p className="text-white/70 leading-relaxed">
                Beautiful, intuitive interface designed for modern professionals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div ref={ctaRef} className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/10 rounded-3xl p-12 transition-all duration-1000 ${ctaVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> Network?</span>
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who trust Luji Contacts to manage their most important relationships.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
              <button
                onClick={handleGetStarted}
                className="group bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>

            <div className="flex items-center justify-center space-x-8 text-white/60">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Free forever plan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-semibold">Luji Contacts</span>
          </div>
          <div className="text-white/60 text-sm">
            © 2025 Luji Contacts. Built with ❤️ for modern professionals.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

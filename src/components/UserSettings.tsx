import React, { useState, useEffect } from 'react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { User, UserFormData } from '../types';
import { 
  Settings, 
  Mail, 
  User as UserIcon,  
  Moon, 
  Sun, 
  Save,
  Loader,
  X,
  CreditCard,
  Shield,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
} from 'lucide-react';

// Component props interface
interface UserSettingsProps {
  onClose: () => void;
  initialTab?: 'profile' | 'email' | 'subscription' | 'security';
}

// Settings state interface
interface SettingsState {
  // Profile settings
  username: string;
  email: string;
  role: string;
  language: string;
  timezone: string;
  theme: 'light' | 'dark';
  
  // Email settings
  smtp_host: string;
  smtp_port: string;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name: string;
  
  // Plan and subscription settings
  plan: SubscriptionPlan | null;
  subscription: {
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
    current_period_end: string;
    cancel_at_period_end: boolean;
  };
  
  // Security settings
  two_factor_enabled: boolean;
  login_notifications: boolean;
  session_timeout: number;
}

// Subscription plan interface
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  contact_limit: number;
  email_limit: number;
}

// Form errors interface
interface FormErrors {
  [key: string]: string;
}

const UserSettings: React.FC<UserSettingsProps> = ({ onClose, initialTab = 'profile' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loading, setLoading] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Enhanced settings state
  const [settings, setSettings] = useState<SettingsState>({
    // Profile settings
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || '',
    language: 'en',
    timezone: 'UTC',
    theme: 'light',
    
    // Email settings
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: true,
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: '',
    
    // Plan and subscription settings
    plan: null,
    subscription: {
      status: 'active',
      current_period_end: '',
      cancel_at_period_end: false
    },
    
    // Security settings
    two_factor_enabled: false,
    login_notifications: true,
    session_timeout: 30
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user settings on mount
  useEffect(() => {
    const loadUserSettings = async (): Promise<void> => {
      if (!user) return;
      
      try {
        setLoading(true);
        const profile = await authApi.getProfile();
        
        setSettings(prev => ({
          ...prev,
          username: profile.username,
          email: profile.email,
          role: profile.role
        }));
      } catch (error) {
        console.error('Error loading user settings:', error);
        setError(error instanceof Error ? error.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();
  }, [user]);

  // Clear messages after timeout
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate profile form
  const validateProfileForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!settings.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (settings.username.length < 2) {
      newErrors.username = 'Username must be at least 2 characters';
    }

    if (!settings.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile settings
  const handleSaveProfile = async (): Promise<void> => {
    if (!validateProfileForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData: Partial<User> = {
        username: settings.username,
        email: settings.email
      };

      await authApi.updateProfile(updateData);
      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (): Promise<void> => {
    if (!validatePasswordForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Test email settings
  const handleTestEmail = async (): Promise<void> => {
    setTesting(true);
    setError('');
    setSuccess('');

    try {
      // This would be implemented in the API
      // await authApi.testEmailSettings(settings);
      setSuccess('Test email sent successfully');
    } catch (error) {
      console.error('Error testing email:', error);
      setError(error instanceof Error ? error.message : 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="h-6 w-6 mr-2" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Messages */}
            {error && (
              <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Settings</h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={settings.username}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter your username"
                      />
                      {errors.username && (
                        <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={settings.email}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        id="role"
                        value={settings.role}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">Role cannot be changed</p>
                    </div>

                    <div>
                      <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        id="theme"
                        name="theme"
                        value={settings.theme}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Profile
                    </button>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter current password"
                      />
                      {errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Enter new password"
                        />
                        {errors.newPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Confirm new password"
                        />
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleChangePassword}
                        disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <Shield className="h-4 w-4 mr-2" />
                        )}
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Email Settings</h3>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Email settings are currently not implemented. This feature will be available in a future update.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 opacity-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                        placeholder="smtp.gmail.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Port
                      </label>
                      <input
                        type="text"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      disabled
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Test Email Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Subscription & Billing</h3>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <Star className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        You are currently on the <strong>Free Plan</strong>. Upgrade to unlock more features and increase your contact limit.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">Current Plan</h4>
                      <p className="text-sm text-gray-500">Free Plan</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">$0</p>
                      <p className="text-sm text-gray-500">per month</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Plan Features:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Up to 50 contacts</li>
                      <li>• Basic contact management</li>
                      <li>• Group organization</li>
                      <li>• CSV import/export</li>
                    </ul>
                  </div>

                  <div className="mt-6">
                    <button
                      disabled
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upgrade Plan (Coming Soon)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>

                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Your account is secure. Review and update your security settings below.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <div>
                        <button
                          disabled
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Enable (Coming Soon)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Login Notifications</h4>
                        <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          name="login_notifications"
                          checked={settings.login_notifications}
                          onChange={handleInputChange}
                          disabled
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Session Timeout</h4>
                        <p className="text-sm text-gray-500">Automatically log out after period of inactivity</p>
                      </div>
                      <div>
                        <select
                          name="session_timeout"
                          value={settings.session_timeout}
                          onChange={handleInputChange}
                          disabled
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;

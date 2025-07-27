import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings, 
  Mail, 
  User,  
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

const UserSettings = ({ onClose, initialTab = 'profile' }) => {
  // Update the activeTab initialization to use the initialTab prop
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  // Enhanced settings state
  const [settings, setSettings] = useState({
    // Profile settings
    username: '',
    email: '',
    role: '',
    language: 'en',
    timezone: 'UTC',
    theme: 'light',
    
    // Email settings
    smtp_host: '',
    smtp_port: '',
    smtp_secure: true,
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: '',
    
    // Plan and subscription settings
    plan: null,
    subscription: {
      status: 'active',
      billing_cycle: 'monthly',
      end_date: null
    },
    billing_email: '',
    contact_limit: 20
  });

  // Available plans configuration
  const plans = [
    {
      id: 1,
      name: 'Free',
      price: 0,
      contact_limit: 20,
      features: [
        'Basic contact management',
        'CSV export',
        'Up to 1 group'
      ]
    },
    {
      id: 2,
      name: 'Pro',
      price: 9.99,
      contact_limit: 500,
      features: [
        'Email integration',
        'Multiple export formats',
        'Up to 5 groups',
        'Advanced search'
      ]
    },
    {
      id: 3,
      name: 'Business',
      price: 19.99,
      contact_limit: null,
      features: [
        'All Pro features',
        'API access',
        'Unlimited groups',
        'Priority support'
      ]
    }
  ];

  useEffect(() => {
    fetchSettings();
  }, []); // Empty dependency array means this runs once when component mounts

  // Add useEffect to update activeTab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/preferences`);
      const { 
        username, email, role,
        theme, language, timezone,
        smtp_host, smtp_port, smtp_secure,
        smtp_user, smtp_pass, from_email, from_name,
        plan,         // New plan object from backend
        billing_email,
        subscription_status,
        subscription_end_date,
        billing_cycle,
        contact_limit
      } = response.data;

      setSettings({
        username,
        email,
        role,
        language,
        timezone,
        theme,
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_user,
        smtp_pass,
        from_email,
        from_name,
        plan,        // Set entire plan object
        subscription: {
          status: subscription_status,
          billing_cycle,
          end_date: subscription_end_date
        },
        billing_email,
        contact_limit
      });
      setError('');
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = {
        // Profile settings
        username: settings.username,
        email: settings.email,
        
        // Appearance settings
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
        
        // Email settings
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_secure: settings.smtp_secure,
        smtp_user: settings.smtp_user,
        smtp_pass: settings.smtp_pass,
        from_email: settings.from_email,
        from_name: settings.from_name,
        
        // Plan & Subscription settings
        plan_id: settings.plan?.id,
        billing_email: settings.billing_email,
        billing_cycle: settings.subscription?.billing_cycle
      };

      await axios.put(`${import.meta.env.VITE_API_URL}/api/user/preferences`, updateData);
      setError('');
      onClose();
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const testEmailSettings = async () => {
    setTesting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/user/test-email`);
      alert('Test email sent successfully!');
      setError('');
    } catch (error) {
      console.error('Error testing email settings:', error);
      setError('Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

const handlePlanChange = async (newPlanId) => {
  if (!window.confirm('Are you sure you want to change your plan? This may affect your billing.')) {
    return;
  }

  setLoading(true);
  try {
    const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/user/preferences`, {
      plan_id: newPlanId
    });

    setSettings(prevSettings => ({
      ...prevSettings,
      plan: response.data.plan,
      contact_limit: response.data.contact_limit,
      subscription: response.data.subscription
    }));

    setError('');
  } catch (error) {
    console.error('Error changing plan:', error);
    setError('Failed to change plan');
  } finally {
    setLoading(false);
  }
};

  const getFeatureStatus = (feature) => {
    const planFeatures = settings.plan?.features || {};
    switch (feature) {
      case 'email':
        return planFeatures.email_enabled;
      case 'export':
        return (planFeatures.export_formats || []).length > 1;
      case 'groups':
        return planFeatures.max_lists > 1;
      default:
        return false;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Settings className="mr-2" /> User Settings
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex space-x-4 mb-6 border-b pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              activeTab === 'profile'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User size={18} className="mr-2" />
            Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              activeTab === 'email'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Mail size={18} className="mr-2" />
            Email Settings
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              activeTab === 'subscription'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CreditCard size={18} className="mr-2" />
            Subscription
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <User className="mr-2" /> User Profile
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={settings.username}
                      onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Shield size={16} className="text-gray-400" />
                      <span className="text-gray-600">{settings.role || 'User'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appearance Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Moon className="mr-2" /> Appearance
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="light"
                          checked={settings.theme === 'light'}
                          onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                          className="mr-2"
                        />
                        <Sun size={16} className="mr-1" />
                        Light
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="dark"
                          checked={settings.theme === 'dark'}
                          onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                          className="mr-2"
                        />
                        <Moon size={16} className="mr-1" />
                        Dark
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings Tab */}
          {activeTab === 'email' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                <Mail className="mr-2" /> Email Settings
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.smtp_host}
                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g., smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="587"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Username</label>
                  <input
                    type="text"
                    value={settings.smtp_user}
                    onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">SMTP Password</label>
                  <input
                    type="password"
                    value={settings.smtp_pass}
                    onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">From Email</label>
                  <input
                    type="email"
                    value={settings.from_email}
                    onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">From Name</label>
                  <input
                    type="text"
                    value={settings.from_name}
                    onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.smtp_secure}
                      onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Use SSL/TLS</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={testEmailSettings}
                className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                disabled={testing}
              >
                {testing ? (
                  <div className="flex items-center">
                    <Loader className="animate-spin mr-2" size={16} />
                    Testing...
                  </div>
                ) : (
                  'Test Settings'
                )}
              </button>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
{/* Current Plan */}
<div className="bg-gray-50 rounded-lg p-4">
  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
    <Star className="mr-2" /> Current Plan
  </h4>
  <div className="bg-white rounded-lg border p-4">
    <div className="flex justify-between items-center">
      <div>
        <h5 className="font-medium text-gray-900 capitalize">
          {settings.plan?.name || 'Free'} Plan
        </h5>
        <div className="flex items-center mt-1">
          {settings.subscription?.status === 'active' ? (
            <CheckCircle2 size={16} className="text-green-500 mr-2" />
          ) : (
            <AlertCircle size={16} className="text-yellow-500 mr-2" />
          )}
          <span className="text-sm text-gray-600 capitalize">
            {settings.subscription?.status || 'active'}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-600">
          <div className="mb-1">
            Contacts: {settings.contact_limit?.toLocaleString() || 'Unlimited'}
          </div>
          <div className="flex items-center justify-end">
            <Clock size={14} className="mr-1" />
            Renews: {formatDate(settings.subscription?.end_date)}
          </div>
        </div>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-4">
      <div className="text-sm">
        <div className="font-medium mb-1">Email Integration</div>
        <div className={`flex items-center ${getFeatureStatus('email') ? 'text-green-600' : 'text-gray-500'}`}>
          {getFeatureStatus('email') ? (
            <CheckCircle2 size={14} className="mr-1" />
          ) : (
            <X size={14} className="mr-1" />
          )}
          {getFeatureStatus('email') ? 'Enabled' : 'Disabled'}
        </div>
      </div>
      <div className="text-sm">
        <div className="font-medium mb-1">Export Formats</div>
        <div className={`flex items-center ${getFeatureStatus('export') ? 'text-green-600' : 'text-gray-500'}`}>
          {getFeatureStatus('export') ? (
            <CheckCircle2 size={14} className="mr-1" />
          ) : (
            <X size={14} className="mr-1" />
          )}
          {getFeatureStatus('export') ? 'Advanced' : 'Basic'}
        </div>
      </div>
      <div className="text-sm">
        <div className="font-medium mb-1">Group Management</div>
        <div className={`flex items-center ${getFeatureStatus('groups') ? 'text-green-600' : 'text-gray-500'}`}>
          {getFeatureStatus('groups') ? (
            <CheckCircle2 size={14} className="mr-1" />
          ) : (
            <X size={14} className="mr-1" />
          )}
          {getFeatureStatus('groups') ? 'Multiple' : 'Single'}
        </div>
      </div>
    </div>
  </div>
</div>

              {/* Available Plans */}
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Star className="mr-2" /> Available Plans
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border rounded-lg p-4 ${settings.plan?.id === plan.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                        }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-gray-900">{plan.name}</h5>
                        {settings.plan?.id === plan.id && (
                          <CheckCircle2 className="text-indigo-500" size={16} />
                        )}
                      </div>
                      <div className="text-lg font-bold mb-2">
                        ${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {plan.contact_limit === null
                          ? 'Unlimited contacts'
                          : `Up to ${plan.contact_limit.toLocaleString()} contacts`}
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1 mb-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle2 className="text-green-500 mr-2" size={14} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => handlePlanChange(plan.id)}
                        className={`w-full py-2 px-4 rounded-md ${settings.plan?.id === plan.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-indigo-600 border border-indigo-600'
                          }`}
                        disabled={settings.plan?.id === plan.id}
                      >
                        {settings.plan?.id === plan.id ? 'Current Plan' : 'Select Plan'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>



              {/* Billing Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <CreditCard className="mr-2" /> Billing Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Billing Email</label>
                    <input
                      type="email"
                      value={settings.billing_email}
                      onChange={(e) => setSettings({ ...settings, billing_email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="billing@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
                    <select
                      value={settings.billing_cycle}
                      onChange={(e) => setSettings({ ...settings, billing_cycle: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly (Save 20%)</option>
                    </select>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h5>
                  {settings.payment_method ? (
                    <div className="flex items-center justify-between bg-white p-3 rounded-md border">
                      <div className="flex items-center">
                        <CreditCard className="text-gray-400 mr-2" size={20} />
                        <span className="text-gray-600">•••• •••• •••• {settings.payment_method.last4}</span>
                      </div>
                      <button 
                        type="button"
                        className="text-indigo-600 hover:text-indigo-700 text-sm"
                      >
                        Update
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      className="flex items-center text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus size={16} className="mr-1" /> Add Payment Method
                    </button>
                  )}
                </div>
              </div>

              {/* Billing History */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Clock className="mr-2" /> Billing History
                </h4>
                <p className="text-sm text-gray-600 text-center py-4">
                  No billing history available
                </p>
              </div>
            </div>
          )}

          {/* Form Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                                    <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSettings;
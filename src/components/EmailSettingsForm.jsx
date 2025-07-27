import React, { useState, useEffect } from 'react';
import { X, Save, Mail, Lock, Server, User } from 'lucide-react';

const EmailSettingsForm = ({ onClose, onSave, currentSettings, isLoading }) => {
  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_secure: true,
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: '',
  });
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(settings);
      onClose();
    } catch (error) {
      console.error('Error saving email settings:', error);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestStatus('testing');
      // Add your test connection logic here
      const response = await axios.post('/api/email-settings/test', settings);
      setTestStatus('success');
    } catch (error) {
      setTestStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Mail className="mr-2 text-indigo-600" />
          Email Settings
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SMTP Server Settings */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-700 flex items-center">
              <Server size={16} className="mr-2" />
              SMTP Server Configuration
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="587"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.smtp_secure}
                onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Use SSL/TLS
              </label>
            </div>
          </div>

          {/* Authentication Settings */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-700 flex items-center">
              <Lock size={16} className="mr-2" />
              Authentication
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SMTP Username
              </label>
              <input
                type="text"
                value={settings.smtp_user}
                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SMTP Password
              </label>
              <input
                type="password"
                value={settings.smtp_pass}
                onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Sender Information */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-700 flex items-center">
              <User size={16} className="mr-2" />
              Sender Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  From Email
                </label>
                <input
                  type="email"
                  value={settings.from_email}
                  onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  From Name
                </label>
                <input
                  type="text"
                  value={settings.from_name}
                  onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Test Connection Status */}
          {testStatus && (
            <div className={`p-3 rounded-md ${
              testStatus === 'testing' ? 'bg-blue-50 text-blue-700' :
              testStatus === 'success' ? 'bg-green-50 text-green-700' :
              'bg-red-50 text-red-700'
            }`}>
              {testStatus === 'testing' && 'Testing connection...'}
              {testStatus === 'success' && 'Connection successful!'}
              {testStatus === 'error' && 'Connection failed. Please check your settings.'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100
                     rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2
                     focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              Test Connection
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white
                     bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none
                     focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailSettingsForm;
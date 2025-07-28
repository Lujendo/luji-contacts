import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { X, Save, Mail, Lock, Server, User, AlertCircle, CheckCircle2, Loader } from 'lucide-react';

// Email settings interface
interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name: string;
}

// Component props interface
interface EmailSettingsFormProps {
  onClose: () => void;
  onSave: (settings: EmailSettings) => Promise<void>;
  currentSettings?: Partial<EmailSettings>;
  isLoading?: boolean;
}

// Test status type
type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const EmailSettingsForm: React.FC<EmailSettingsFormProps> = ({ 
  onClose, 
  onSave, 
  currentSettings,
  isLoading = false 
}) => {
  const [settings, setSettings] = useState<EmailSettings>({
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: true,
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: '',
  });
  
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize settings from props
  useEffect(() => {
    if (currentSettings) {
      setSettings(prev => ({
        ...prev,
        ...currentSettings
      }));
    }
  }, [currentSettings]);

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    setError('');
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!settings.smtp_host || !settings.smtp_port || !settings.from_email) {
      setError('SMTP host, port, and from email are required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave(settings);
      onClose();
    } catch (error) {
      console.error('Error saving email settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to save email settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Test email connection
  const handleTestConnection = async (): Promise<void> => {
    if (!settings.smtp_host || !settings.smtp_port) {
      setError('SMTP host and port are required for testing');
      return;
    }

    setTestStatus('testing');
    setError('');

    try {
      // This would be implemented in the API
      // const response = await axios.post('/api/email-settings/test', settings);
      
      // Simulate test for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (error) {
      console.error('Error testing email connection:', error);
      setTestStatus('error');
      setError('Failed to test email connection');
      
      // Reset status after 3 seconds
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Mail className="h-6 w-6 mr-2 text-indigo-600" />
            Email Settings
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        {/* Not implemented notice */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <p className="text-sm text-yellow-700 font-medium">
                Email functionality is not fully implemented
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                This form is a placeholder for future email configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SMTP Server Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Server className="h-5 w-5 mr-2" />
              SMTP Server
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="smtp_host" className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  id="smtp_host"
                  name="smtp_host"
                  value={settings.smtp_host}
                  onChange={handleInputChange}
                  disabled={isSaving || isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700 mb-1">
                  Port *
                </label>
                <input
                  type="number"
                  id="smtp_port"
                  name="smtp_port"
                  value={settings.smtp_port}
                  onChange={handleInputChange}
                  disabled={isSaving || isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="587"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="smtp_secure"
                name="smtp_secure"
                checked={settings.smtp_secure}
                onChange={handleInputChange}
                disabled={isSaving || isLoading}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="smtp_secure" className="ml-2 text-sm text-gray-700">
                <Lock className="inline h-4 w-4 mr-1" />
                Use secure connection (TLS/SSL)
              </label>
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Authentication
            </h3>
            
            <div>
              <label htmlFor="smtp_user" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="smtp_user"
                name="smtp_user"
                value={settings.smtp_user}
                onChange={handleInputChange}
                disabled={isSaving || isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="your-email@gmail.com"
              />
            </div>

            <div>
              <label htmlFor="smtp_pass" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="smtp_pass"
                name="smtp_pass"
                value={settings.smtp_pass}
                onChange={handleInputChange}
                disabled={isSaving || isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Your email password or app password"
              />
            </div>
          </div>

          {/* From Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              From Settings
            </h3>
            
            <div>
              <label htmlFor="from_email" className="block text-sm font-medium text-gray-700 mb-1">
                From Email *
              </label>
              <input
                type="email"
                id="from_email"
                name="from_email"
                value={settings.from_email}
                onChange={handleInputChange}
                disabled={isSaving || isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="noreply@yourcompany.com"
                required
              />
            </div>

            <div>
              <label htmlFor="from_name" className="block text-sm font-medium text-gray-700 mb-1">
                From Name
              </label>
              <input
                type="text"
                id="from_name"
                name="from_name"
                value={settings.from_name}
                onChange={handleInputChange}
                disabled={isSaving || isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Your Company Name"
              />
            </div>
          </div>

          {/* Test Connection */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing' || isSaving || isLoading}
              className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testStatus === 'testing' ? (
                <div className="flex items-center justify-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Testing Connection...
                </div>
              ) : testStatus === 'success' ? (
                <div className="flex items-center justify-center text-green-600">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Connection Successful
                </div>
              ) : testStatus === 'error' ? (
                <div className="flex items-center justify-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Connection Failed
                </div>
              ) : (
                'Test Connection'
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <div className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailSettingsForm;

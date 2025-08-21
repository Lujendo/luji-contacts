import React, { useState } from 'react';
import { EmailAccount } from '../types/emailClient';

import {
  Mail,
  Server,
  Lock,
  User,
  Eye,
  EyeOff,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Settings
} from 'lucide-react';

interface EmailAccountSettingsProps {
  accounts: EmailAccount[];
  onAddAccount: (account: Omit<EmailAccount, 'id'>) => Promise<void>;
  onUpdateAccount: (id: string, updates: Partial<EmailAccount>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onTestConnection: (account: Partial<EmailAccount>) => Promise<boolean>;
}

const EmailAccountSettings: React.FC<EmailAccountSettingsProps> = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onTestConnection
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    provider: 'imap' as const,
    incoming: {
      host: '',
      port: 993,
      secure: true,
      username: '',
      password: '',
      authMethod: 'plain' as const
    },
    outgoing: {
      host: '',
      port: 587,
      secure: true,
      username: '',
      password: '',
      authMethod: 'plain' as const
    },
    syncInterval: 5
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      provider: 'imap',
      incoming: {
        host: '',
        port: 993,
        secure: true,
        username: '',
        password: '',
        authMethod: 'plain'
      },
      outgoing: {
        host: '',
        port: 587,
        secure: true,
        username: '',
        password: '',
        authMethod: 'plain'
      },
      syncInterval: 5
    });
    setEditingAccount(null);
    setShowForm(false);
    setTestStatus('idle');
    setTestError('');
  };

  const handleEdit = (account: EmailAccount) => {
    setFormData({
      name: account.name,
      email: account.email,
      provider: account.provider as any,
      incoming: { ...account.incoming } as any,
      outgoing: { ...account.outgoing } as any,
      syncInterval: account.syncInterval
    });
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const accountData = {
        ...formData,
        folders: [],
        isDefault: accounts.length === 0,
        isActive: true,
        lastSync: new Date()
      };

      if (editingAccount) {
        await onUpdateAccount(editingAccount.id, accountData);
      } else {
        await onAddAccount(accountData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestError('');

    try {
      const success = await onTestConnection(formData);
      setTestStatus(success ? 'success' : 'error');
      if (!success) {
        setTestError('Connection failed. Please check your settings.');
      }
    } catch (error) {
      setTestStatus('error');
      setTestError(error instanceof Error ? error.message : 'Connection test failed');
    }

    // Reset status after 3 seconds
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getProviderDefaults = (provider: string) => {
    switch (provider) {
      case 'custom_luji':
        return {
          incoming: { host: 'mail.lujiventrucci.com', port: 993, secure: true },
          outgoing: { host: 'mail.lujiventrucci.com', port: 587, secure: true }
        };
      case 'gmail':
        return {
          incoming: { host: 'imap.gmail.com', port: 993, secure: true },
          outgoing: { host: 'smtp.gmail.com', port: 587, secure: true }
        };
      case 'outlook':
        return {
          incoming: { host: 'outlook.office365.com', port: 993, secure: true },
          outgoing: { host: 'smtp-mail.outlook.com', port: 587, secure: true }
        };
      case 'yahoo':
        return {
          incoming: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
          outgoing: { host: 'smtp.mail.yahoo.com', port: 587, secure: true }
        };
      default:
        return {
          incoming: { host: '', port: 993, secure: true },
          outgoing: { host: '', port: 587, secure: true }
        };
    }
  };

  const handleProviderChange = (provider: string) => {
    const defaults = getProviderDefaults(provider);
    setFormData(prev => ({
      ...prev,
      provider: provider as any,
      incoming: { ...prev.incoming, ...defaults.incoming },
      outgoing: { ...prev.outgoing, ...defaults.outgoing }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Email Accounts</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </button>
      </div>

      {/* Account List */}
      <div className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">{account.name}</h4>
                  <p className="text-sm text-gray-500">{account.email}</p>
                  <p className="text-xs text-gray-400">
                    {account.provider.toUpperCase()} • Last sync: {account.lastSync.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {account.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => handleEdit(account)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteAccount(account.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No email accounts configured</p>
            <p className="text-sm">Add an account to start receiving emails</p>
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={resetForm}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingAccount ? 'Edit Email Account' : 'Add Email Account'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Basic Information</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Personal Email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Provider</label>
                    <select
                      value={formData.provider}
                      onChange={(e) => handleProviderChange(e.target.value)}
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="imap">IMAP (Generic)</option>
                      <option value="custom_luji">Custom: mail.lujiventrucci.com</option>
                      <option value="gmail">Gmail</option>
                      <option value="outlook">Outlook/Hotmail</option>
                      <option value="yahoo">Yahoo Mail</option>
                      <option value="pop3">POP3</option>
                    </select>
                    {formData.provider === ('gmail' as any) && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Authentication</label>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                const params = new URLSearchParams();
                                if (editingAccount) params.set('accountId', editingAccount.id);
                                params.set('returnUrl', window.location.origin);
                                // Ask API for authUrl to avoid redirecting from fetch
                                const resp = await fetch(`/api/oauth/google/authorize?${params.toString()}&manual=1`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                const data = await resp.json();
                                if (data.authUrl) {
                                  window.location.href = data.authUrl;
                                } else {
                                  alert('Failed to start Google sign-in');
                                }
                              } catch (e) {
                                alert('Failed to start Google sign-in');
                              }
                            }}
                            className="px-3 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                          >
                            Sign in with Google
                          </button>
                          <span className="text-xs text-gray-500">Uses OAuth2 (XOAUTH2) for IMAP access</span>
                        </div>
                        {editingAccount && editingAccount.incoming.authMethod === 'oauth2' && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  const resp = await fetch(`/api/oauth/tokens/${editingAccount.id}/clear`, {
                                    method: 'POST',
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (resp.ok) {
                                    alert('Disconnected Google OAuth for this account.');
                                    setFormData(prev => ({
                                      ...prev,
                                      incoming: { ...prev.incoming, authMethod: 'plain' as const }
                                    }));
                                  } else {
                                    alert('Failed to disconnect.');
                                  }
                                } catch (e) {
                                  alert('Failed to disconnect.');
                                }
                              }}
                              className="px-3 py-2 rounded border text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Disconnect Google
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Incoming Server Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Server className="h-4 w-4 mr-2" />
                    Incoming Server (IMAP/POP3)
                  </h4>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Server</label>
                      <input
                        type="text"
                        value={formData.incoming.host}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          incoming: { ...prev.incoming, host: e.target.value }
                        }))}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="imap.example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Port</label>
                      <input
                        type="number"
                        value={formData.incoming.port}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          incoming: { ...prev.incoming, port: parseInt(e.target.value) }
                        }))}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Hide credentials when Gmail + OAuth2 is active */}
                  {!(formData.provider === ('gmail' as any) && (editingAccount?.incoming.authMethod === ('oauth2' as any) || formData.incoming.authMethod === ('oauth2' as any))) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                          type="text"
                          value={formData.incoming.username}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            incoming: { ...prev.incoming, username: e.target.value }
                          }))}
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Usually your email address"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.incoming ? 'text' : 'password'}
                            value={formData.incoming.password}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              incoming: { ...prev.incoming, password: e.target.value }
                            }))}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('incoming')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.incoming ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="incoming-secure"
                      checked={formData.incoming.secure}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        incoming: { ...prev.incoming, secure: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    </div>

                </div>

                {/* Outgoing Server Settings */}
                    <div className="space-y-4 mt-6">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Server className="h-4 w-4 mr-2" />
                        Outgoing Server (SMTP)
                      </h4>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Server</label>
                          <input
                            type="text"
                            value={formData.outgoing.host}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              outgoing: { ...prev.outgoing, host: e.target.value }
                            }))}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="smtp.example.com"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Port</label>
                          <input
                            type="number"
                            value={formData.outgoing.port}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              outgoing: { ...prev.outgoing, port: parseInt(e.target.value) }
                            }))}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Username</label>
                          <input
                            type="text"
                            value={formData.outgoing.username}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              outgoing: { ...prev.outgoing, username: e.target.value }
                            }))}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Usually your email address"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.outgoing ? 'text' : 'password'}
                              value={formData.outgoing.password}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                outgoing: { ...prev.outgoing, password: e.target.value }
                              }))}
                              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('outgoing')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords.outgoing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="outgoing-secure"
                          checked={formData.outgoing.secure}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            outgoing: { ...prev.outgoing, secure: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="outgoing-secure" className="ml-2 block text-sm text-gray-900">
                          Use STARTTLS (recommended on port 587)
                        </label>
                      </div>

                      <p className="text-xs text-gray-500">If your server requires SSL/TLS on 465 instead of STARTTLS, set port to 465 and keep this checked.</p>
                    </div>

                {/* Test Connection Button */}
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                  </button>

                  {testStatus === 'success' && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Connection successful</span>
                    </div>
                  )}

                  {testStatus === 'error' && (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">{testError}</span>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    {editingAccount ? 'Update Account' : 'Add Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailAccountSettings;

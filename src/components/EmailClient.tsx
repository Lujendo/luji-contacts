import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  Settings,
  RefreshCw,
  Eye,
  MousePointer,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

interface EmailQueueItem {
  id: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  priority: 'high' | 'normal' | 'low';
  scheduledAt: string;
  sentAt?: string;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailHistory {
  id: string;
  subject: string;
  recipients_count: number;
  queue_id: string;
  created_at: string;
  status: string;
}

interface EmailAnalytics {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  statistics: {
    totalSent: number;
    totalRecipients: number;
    averageRecipients: number;
    queue: {
      pending: number;
      processing: number;
      sent: number;
      failed: number;
      cancelled: number;
      totalToday: number;
      averageProcessingTime: number;
      successRate: number;
    };
    providers: Array<{
      id: string;
      name: string;
      isActive: boolean;
      healthStatus: string;
      dailySent: number;
      dailyLimit?: number;
    }>;
  };
}

interface EmailClientProps {
  onClose: () => void;
}

const EmailClient: React.FC<EmailClientProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'analytics'>('queue');
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      if (activeTab === 'history') {
        const response = await fetch('/api/emails/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setEmailHistory(data.emails);
        } else {
          throw new Error('Failed to load email history');
        }
      } else if (activeTab === 'analytics') {
        const response = await fetch('/api/emails/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          throw new Error('Failed to load email analytics');
        }
      }
    } catch (error) {
      console.error('Error loading email data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Mail className="h-6 w-6 mr-2 text-indigo-600" />
            Email Client
          </h2>
          <button
            onClick={loadData}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'queue', label: 'Queue Status', icon: Clock },
              { id: 'history', label: 'Email History', icon: Mail },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
            <span className="text-gray-600">Loading...</span>
          </div>
        )}

        {/* Queue Status Tab */}
        {activeTab === 'queue' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{analytics.statistics.queue.pending}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <RefreshCw className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">Processing</p>
                    <p className="text-2xl font-bold text-blue-900">{analytics.statistics.queue.processing}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Sent</p>
                    <p className="text-2xl font-bold text-green-900">{analytics.statistics.queue.sent}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">Failed</p>
                    <p className="text-2xl font-bold text-red-900">{analytics.statistics.queue.failed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Providers</h3>
              <div className="space-y-3">
                {analytics.statistics.providers.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        provider.healthStatus === 'healthy' ? 'bg-green-500' : 
                        provider.healthStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{provider.name}</p>
                        <p className="text-sm text-gray-500">
                          {provider.dailySent} sent today
                          {provider.dailyLimit && ` / ${provider.dailyLimit} limit`}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      provider.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Email History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {emailHistory.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No emails sent yet</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recipients
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sent At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {emailHistory.map((email) => (
                        <tr key={email.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{email.subject}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{email.recipients_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                              {getStatusIcon(email.status)}
                              <span className="ml-1">{email.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(email.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <Send className="h-8 w-8 text-indigo-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Sent</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.statistics.totalSent}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Recipients</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.statistics.totalRecipients}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.statistics.queue.successRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailClient;

import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Calendar, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { Contact, Group } from '../../types';
import { contactsApi } from '../../api';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  groups: Group[];
}

interface AnalyticsData {
  totalContacts: number;
  totalGroups: number;
  contactsWithEmail: number;
  contactsWithPhone: number;
  contactsWithCompany: number;
  recentlyAdded: number;
  groupDistribution: { name: string; count: number }[];
  monthlyGrowth: { month: string; count: number }[];
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  contacts,
  groups
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      calculateAnalytics();
    }
  }, [isOpen, contacts, groups]);

  const calculateAnalytics = async () => {
    setLoading(true);
    
    try {
      // Calculate basic statistics
      const totalContacts = contacts.length;
      const totalGroups = groups.length;
      const contactsWithEmail = contacts.filter(c => c.email).length;
      const contactsWithPhone = contacts.filter(c => c.phone).length;
      const contactsWithCompany = contacts.filter(c => c.company).length;
      
      // Calculate recently added (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentlyAdded = contacts.filter(c => 
        new Date(c.created_at) > thirtyDaysAgo
      ).length;

      // Group distribution
      const groupDistribution = groups.map(group => ({
        name: group.name,
        count: group.contact_count || 0
      }));

      // Monthly growth (last 6 months)
      const monthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const count = contacts.filter(c => {
          const createdDate = new Date(c.created_at);
          return createdDate >= monthStart && createdDate <= monthEnd;
        }).length;

        monthlyGrowth.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          count
        });
      }

      setAnalytics({
        totalContacts,
        totalGroups,
        contactsWithEmail,
        contactsWithPhone,
        contactsWithCompany,
        recentlyAdded,
        groupDistribution,
        monthlyGrowth
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Calculating analytics...</span>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Contacts</p>
                      <p className="text-2xl font-bold text-blue-900">{analytics.totalContacts}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Total Groups</p>
                      <p className="text-2xl font-bold text-green-900">{analytics.totalGroups}</p>
                    </div>
                    <PieChart className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">With Email</p>
                      <p className="text-2xl font-bold text-purple-900">{analytics.contactsWithEmail}</p>
                      <p className="text-xs text-purple-600">
                        {((analytics.contactsWithEmail / analytics.totalContacts) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Mail className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Recently Added</p>
                      <p className="text-2xl font-bold text-orange-900">{analytics.recentlyAdded}</p>
                      <p className="text-xs text-orange-600">Last 30 days</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Contact Completeness */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                  Contact Completeness
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contacts with Email</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(analytics.contactsWithEmail / analytics.totalContacts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.contactsWithEmail}/{analytics.totalContacts}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contacts with Phone</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(analytics.contactsWithPhone / analytics.totalContacts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.contactsWithPhone}/{analytics.totalContacts}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contacts with Company</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(analytics.contactsWithCompany / analytics.totalContacts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.contactsWithCompany}/{analytics.totalContacts}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Distribution */}
              {analytics.groupDistribution.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-indigo-600" />
                    Group Distribution
                  </h3>
                  <div className="space-y-2">
                    {analytics.groupDistribution.map((group, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">{group.name}</span>
                        <span className="text-sm font-medium text-gray-900">{group.count} contacts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Growth */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                  Monthly Growth (Last 6 Months)
                </h3>
                <div className="flex items-end space-x-2 h-32">
                  {analytics.monthlyGrowth.map((month, index) => {
                    const maxCount = Math.max(...analytics.monthlyGrowth.map(m => m.count));
                    const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="bg-indigo-600 rounded-t w-full min-h-[4px] transition-all duration-300"
                          style={{ height: `${height}%` }}
                          title={`${month.month}: ${month.count} contacts`}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                        <span className="text-xs font-medium text-gray-700">{month.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Unable to load analytics data</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModal;

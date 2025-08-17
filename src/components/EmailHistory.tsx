import React from 'react';
import { Group } from '../types';
import { Mail, Calendar, Users, User } from 'lucide-react';
import { format } from 'date-fns';

// Email interface
interface Email {
  id: number;
  subject: string;
  body: string;
  sent_at: string;
  Groups: Group[];
  recipients_count?: number;
  status?: 'sent' | 'failed' | 'pending';
}

// Component props interface
interface EmailHistoryProps {
  emails?: Email[];
  onClose: () => void;
}

const EmailHistory: React.FC<EmailHistoryProps> = ({ emails = [] }) => {
  return (
    <div className="p-6">
      <div className="space-y-6">

        {/* Email not implemented notice */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <p className="text-sm text-yellow-700 font-medium">
                Email functionality is not fully implemented
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                This is a placeholder for email history. In a full implementation, this would show sent emails.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {emails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No emails sent yet</h3>
              <p className="text-sm text-gray-500">
                When you send emails to your contacts, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Email Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {email.subject || 'No Subject'}
                      </h3>
                      {email.status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          email.status === 'sent' 
                            ? 'bg-green-100 text-green-800'
                            : email.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 ml-4">
                      <Calendar size={14} className="mr-1" />
                      <time dateTime={email.sent_at}>
                        {format(new Date(email.sent_at), 'MMM d, yyyy HH:mm')}
                      </time>
                    </div>
                  </div>

                  {/* Email Body Preview */}
                  <div className="mb-3">
                    <div 
                      className="prose prose-sm max-w-none text-gray-600 line-clamp-3"
                      dangerouslySetInnerHTML={{ 
                        __html: email.body.length > 200 
                          ? email.body.substring(0, 200) + '...' 
                          : email.body 
                      }}
                    />
                  </div>

                  {/* Email Recipients */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      {email.Groups && email.Groups.length > 0 && (
                        <div className="flex items-center">
                          <Users size={14} className="mr-1" />
                          <span>
                            Sent to {email.Groups.length} group{email.Groups.length !== 1 ? 's' : ''}:
                            {' '}
                            <span className="font-medium">
                              {email.Groups.map(g => g.name).join(', ')}
                            </span>
                          </span>
                        </div>
                      )}
                      
                      {email.recipients_count && (
                        <div className="flex items-center">
                          <User size={14} className="mr-1" />
                          <span>{email.recipients_count} recipient{email.recipients_count !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // TODO: Implement view full email
                          console.log('View email:', email.id);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {emails.length > 0
              ? `Showing ${emails.length} email${emails.length !== 1 ? 's' : ''}`
              : 'No emails to display'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailHistory;

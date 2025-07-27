import React from 'react';
import { Mail, Calendar, Users, User } from 'lucide-react';
import { format } from 'date-fns';

const EmailHistory = ({ emails, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl m-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Mail className="mr-2 text-indigo-600" size={24} />
            Email History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {emails.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No emails sent yet
            </div>
          ) : (
            <div className="space-y-4">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{email.subject}</h3>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {format(new Date(email.sent_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-500 mb-2"
                       dangerouslySetInnerHTML={{ __html: email.body }}
                  />
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <div className="flex items-center mr-4">
                      <Users size={14} className="mr-1" />
                      <span>
                        Sent to {email.Groups.length} group{email.Groups.length !== 1 ? 's' : ''}:
                        {' '}
                        {email.Groups.map(g => g.name).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailHistory;
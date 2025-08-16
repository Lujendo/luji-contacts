import React, { useState } from 'react';
import { Contact } from '../types';

interface DiagnosticContactsViewProps {
  onContactSelect: (contact: Contact) => void;
  onContactSelection?: (contactId: number, selected: boolean) => void;
  onBulkSelection?: (selected: boolean) => void;
  selectedContacts?: number[];
  className?: string;
}

const DiagnosticContactsView: React.FC<DiagnosticContactsViewProps> = ({
  onContactSelect,
  onContactSelection,
  onBulkSelection,
  selectedContacts = [],
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Diagnostic Contacts View
        </h2>
        
        {/* Simple search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-medium mb-2">✅ Component Loaded Successfully</h3>
            <p className="text-green-700 text-sm">
              This diagnostic component is working properly. No JavaScript initialization errors detected.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-800 font-medium mb-2">🔍 Search State</h3>
            <p className="text-blue-700 text-sm">
              Current search query: "{searchQuery}"
            </p>
            <p className="text-blue-700 text-sm">
              Query length: {searchQuery.length}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-800 font-medium mb-2">📊 Props Status</h3>
            <div className="text-gray-700 text-sm space-y-1">
              <p>onContactSelect: {onContactSelect ? '✅ Provided' : '❌ Missing'}</p>
              <p>onContactSelection: {onContactSelection ? '✅ Provided' : '❌ Missing'}</p>
              <p>onBulkSelection: {onBulkSelection ? '✅ Provided' : '❌ Missing'}</p>
              <p>selectedContacts: {selectedContacts.length} selected</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-yellow-800 font-medium mb-2">⚠️ Debugging Information</h3>
            <div className="text-yellow-700 text-sm space-y-1">
              <p>React version: {React.version}</p>
              <p>Component render time: {new Date().toISOString()}</p>
              <p>Browser: {navigator.userAgent.split(' ')[0]}</p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-purple-800 font-medium mb-2">🧪 Test Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  console.log('Test button clicked - no errors');
                  alert('Test successful! Component is working.');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Test Component Interaction
              </button>
              
              <button
                onClick={() => {
                  const testContact: Contact = {
                    id: 999,
                    first_name: 'Test',
                    last_name: 'Contact',
                    email: 'test@example.com',
                    phone: '123-456-7890',
                    company: 'Test Company',
                    job_title: 'Tester',
                    notes: 'Test contact for debugging',
                    nickname: 'TestUser',
                    user_id: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  onContactSelect(testContact);
                }}
                className="ml-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Test Contact Selection
              </button>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">🚨 Error Detection</h3>
            <p className="text-red-700 text-sm">
              If you see this message without any JavaScript errors in the console, 
              then the initialization issue has been resolved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticContactsView;

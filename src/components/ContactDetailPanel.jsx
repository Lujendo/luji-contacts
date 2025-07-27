import React from 'react';
import { X } from 'lucide-react';

const ContactDetailPanel = ({ isOpen, onClose, contact }) => {
  if (!contact) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
          onClick={onClose}
        />
      )}

      {/* Sliding panel */}
      <div 
        className={`
          fixed inset-y-0 right-0 w-[1200px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Contact Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Panel content */}
        <div className="p-6 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    defaultValue={contact.first_name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    defaultValue={contact.last_name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    defaultValue={contact.email}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    defaultValue={contact.phone}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Groups */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Groups</h3>
              <div className="flex flex-wrap gap-2">
                {contact.Groups?.map(group => (
                  <span
                    key={group.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {group.name}
                    <button className="ml-2 text-indigo-600 hover:text-indigo-900">
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <button className="px-3 py-1 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700">
                  Add Group
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactDetailPanel;
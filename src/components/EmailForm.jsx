import React, { useState } from 'react';
import { X, Send, Loader } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const EmailForm = ({ 
  onClose, 
  onSend, 
  selectedGroups = [], 
  selectedContacts = [], 
  groups = [], 
  contacts = [] 
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    groupIds: selectedGroups.map(g => g.id),
    contactIds: selectedContacts.map(c => c.id)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.body.trim()) {
      setError('Subject and body are required');
      return;
    }

    setLoading(true);
    try {
      await onSend(formData);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Compose Email</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipients Summary */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Recipients</h3>
            <div className="space-y-2">
              {selectedGroups.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">Groups: </span>
                  <span className="text-sm">{selectedGroups.map(g => g.name).join(', ')}</span>
                </div>
              )}
              {selectedContacts.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">Contacts: </span>
                  <span className="text-sm">
                    {selectedContacts.map(c => `${c.first_name} ${c.last_name}`).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <ReactQuill
              value={formData.body}
              onChange={(value) => setFormData(prev => ({ ...prev, body: value }))}
              className="h-64 mb-12"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, false] }],
                  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                  [{'list': 'ordered'}, {'list': 'bullet'}],
                  ['link'],
                  ['clean']
                ]
              }}
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100
                       rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2
                       focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white
                       bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none
                       focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailForm;
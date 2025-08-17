import React, { useState, FormEvent } from 'react';
import { Contact, Group } from '../types';
import { X, Send, Loader, Mail, Users, AlertCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Email form data interface
interface EmailFormData {
  subject: string;
  body: string;
  groupIds: number[];
  contactIds: number[];
}

// Component props interface
interface EmailFormProps {
  onClose: () => void;
  onSend?: (formData: EmailFormData) => Promise<void>;
  selectedGroups?: Group[];
  selectedContacts?: Contact[];
  groups?: Group[];
  contacts?: Contact[];
}

const EmailForm: React.FC<EmailFormProps> = ({ 
  onClose, 
  onSend, 
  selectedGroups = [], 
  selectedContacts = [], 
  groups = [], 
  contacts = [] 
}) => {
  const [formData, setFormData] = useState<EmailFormData>({
    subject: '',
    body: '',
    groupIds: selectedGroups.map(g => g.id),
    contactIds: selectedContacts.map(c => c.id)
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Calculate total recipients
  const getRecipientCount = (): number => {
    const groupContacts = formData.groupIds.reduce((count, groupId) => {
      const group = groups.find(g => g.id === groupId);
      return count + (group?.contact_count || 0);
    }, 0);
    
    return groupContacts + formData.contactIds.length;
  };

  // Get recipient emails for preview
  const getRecipientEmails = (): string[] => {
    const emails: string[] = [];
    
    // Add emails from selected contacts
    formData.contactIds.forEach(contactId => {
      const contact = contacts.find(c => c.id === contactId);
      if (contact?.email) {
        emails.push(contact.email);
      }
    });

    // Add emails from selected groups
    formData.groupIds.forEach(groupId => {
      const group = groups.find(g => g.id === groupId);
      if (group?.contacts) {
        group.contacts.forEach(contact => {
          if (contact.email && !emails.includes(contact.email)) {
            emails.push(contact.email);
          }
        });
      }
    });

    return emails;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.body.trim()) {
      setError('Subject and body are required');
      return;
    }

    if (formData.groupIds.length === 0 && formData.contactIds.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (onSend) {
        await onSend(formData);
        onClose();
      } else {
        // Fallback: open default email client
        const emails = getRecipientEmails();
        const mailtoLink = `mailto:?bcc=${emails.join(',')}&subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(formData.body.replace(/<[^>]*>/g, ''))}`;
        window.location.href = mailtoLink;
        onClose();
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EmailFormData, value: string | number[]): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleGroupToggle = (groupId: number): void => {
    const newGroupIds = formData.groupIds.includes(groupId)
      ? formData.groupIds.filter(id => id !== groupId)
      : [...formData.groupIds, groupId];
    
    handleInputChange('groupIds', newGroupIds);
  };

  const handleContactToggle = (contactId: number): void => {
    const newContactIds = formData.contactIds.includes(contactId)
      ? formData.contactIds.filter(id => id !== contactId)
      : [...formData.contactIds, contactId];
    
    handleInputChange('contactIds', newContactIds);
  };

  const recipientCount = getRecipientCount();

  return (
    <div className="p-6">
      <div className="space-y-6">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Mail className="h-6 w-6 mr-2 text-indigo-600" />
            Compose Email
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Send email to selected contacts and groups
          </p>
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

        {/* Email not implemented notice */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <p className="text-sm text-yellow-700 font-medium">
                Email functionality is not fully implemented
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                This will open your default email client with the recipients and content pre-filled.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipients Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Recipients ({recipientCount})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Groups */}
              {groups.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Groups</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {groups.map(group => (
                      <label key={group.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.groupIds.includes(group.id)}
                          onChange={() => handleGroupToggle(group.id)}
                          disabled={loading}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {group.name} ({group.contact_count || 0} contacts)
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Contacts */}
              {contacts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Individual Contacts</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {contacts.map(contact => (
                      <label key={contact.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.contactIds.includes(contact.id)}
                          onChange={() => handleContactToggle(contact.id)}
                          disabled={loading || !contact.email}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className={`ml-2 text-sm ${contact.email ? 'text-gray-700' : 'text-gray-400'}`}>
                          {contact.first_name} {contact.last_name} 
                          {contact.email ? ` (${contact.email})` : ' (no email)'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter email subject"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-md">
              <ReactQuill
                value={formData.body}
                onChange={(value) => handleInputChange('body', value)}
                readOnly={loading}
                theme="snow"
                placeholder="Enter your email message..."
                style={{ minHeight: '200px' }}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline'],
                    ['link'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                  ],
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.subject.trim() || !formData.body.trim() || recipientCount === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="h-4 w-4 mr-2" />
                  Send Email ({recipientCount})
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailForm;

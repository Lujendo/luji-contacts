import React, { useState, useEffect } from 'react';
import { X, Send, Paperclip, Bold, Italic, Underline, Link, Image, Smile } from 'lucide-react';
import { Contact } from '../types';
import ContactLookup from './ContactLookup';

interface EnhancedComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  preSelectedContacts?: Contact[];
  onSend?: (emailData: {
    to: Contact[];
    cc?: Contact[];
    bcc?: Contact[];
    subject: string;
    body: string;
    attachments?: File[];
  }) => Promise<void>;
}

const EnhancedComposeModal: React.FC<EnhancedComposeModalProps> = ({
  isOpen,
  onClose,
  contacts,
  preSelectedContacts = [],
  onSend
}) => {
  const [toContacts, setToContacts] = useState<Contact[]>(preSelectedContacts);
  const [ccContacts, setCcContacts] = useState<Contact[]>([]);
  const [bccContacts, setBccContacts] = useState<Contact[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setToContacts(preSelectedContacts);
      setCcContacts([]);
      setBccContacts([]);
      setShowCc(false);
      setShowBcc(false);
      setSubject('');
      setBody('');
      setAttachments([]);
      setError('');
    }
  }, [isOpen, preSelectedContacts]);

  const handleSend = async () => {
    if (toContacts.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!body.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      if (onSend) {
        await onSend({
          to: toContacts,
          cc: ccContacts.length > 0 ? ccContacts : undefined,
          bcc: bccContacts.length > 0 ? bccContacts : undefined,
          subject,
          body,
          attachments: attachments.length > 0 ? attachments : undefined
        });
      } else {
        // Fallback to professional email API
        await sendViaAPI();
      }
      
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      setError(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const sendViaAPI = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');

    const response = await fetch('/api/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''),
        contactIds: toContacts.map(c => c.id),
        ccContactIds: ccContacts.map(c => c.id),
        bccContactIds: bccContacts.map(c => c.id),
        options: {
          priority: 'normal',
          trackOpens: true,
          trackClicks: true,
          tags: ['email-client', 'compose']
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Compose Email</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 rounded-md p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* To Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <ContactLookup
                contacts={contacts}
                selectedContacts={toContacts}
                onContactSelect={(contact) => setToContacts(prev => [...prev, contact])}
                onContactRemove={(contactId) => setToContacts(prev => prev.filter(c => c.id !== contactId))}
                placeholder="Add recipients..."
              />
            </div>

            {/* CC/BCC Toggle */}
            <div className="flex space-x-4 text-sm">
              {!showCc && (
                <button
                  onClick={() => setShowCc(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Add Cc
                </button>
              )}
              {!showBcc && (
                <button
                  onClick={() => setShowBcc(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Add Bcc
                </button>
              )}
            </div>

            {/* CC Field */}
            {showCc && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cc</label>
                <ContactLookup
                  contacts={contacts}
                  selectedContacts={ccContacts}
                  onContactSelect={(contact) => setCcContacts(prev => [...prev, contact])}
                  onContactRemove={(contactId) => setCcContacts(prev => prev.filter(c => c.id !== contactId))}
                  placeholder="Add Cc recipients..."
                />
              </div>
            )}

            {/* BCC Field */}
            {showBcc && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bcc</label>
                <ContactLookup
                  contacts={contacts}
                  selectedContacts={bccContacts}
                  onContactSelect={(contact) => setBccContacts(prev => [...prev, contact])}
                  onContactRemove={(contactId) => setBccContacts(prev => prev.filter(c => c.id !== contactId))}
                  placeholder="Add Bcc recipients..."
                />
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Formatting Toolbar */}
            <div className="border border-gray-300 rounded-md">
              <div className="flex items-center space-x-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
                <button className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded">
                  <Bold className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded">
                  <Italic className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded">
                  <Underline className="h-4 w-4" />
                </button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded">
                  <Link className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded">
                  <Image className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded">
                  <Smile className="h-4 w-4" />
                </button>
                <div className="flex-1"></div>
                <label className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded cursor-pointer">
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    multiple
                    onChange={handleFileAttachment}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Message Body */}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={12}
                className="w-full px-3 py-2 border-0 focus:outline-none resize-none"
              />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              {toContacts.length + ccContacts.length + bccContacts.length} recipient(s)
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || toContacts.length === 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedComposeModal;

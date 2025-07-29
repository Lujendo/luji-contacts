import React, { useState, useMemo } from 'react';
import { Contact } from '../../types';
import { Phone, Mail, MessageSquare, MoreVertical, Search } from 'lucide-react';
import ProfileImage from '../ui/ProfileImage';
import MobileContainer from './MobileContainer';

interface MobileContactListProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
  onCallContact: (contact: Contact) => void;
  onEmailContact: (contact: Contact) => void;
  onSmsContact: (contact: Contact) => void;
  loading?: boolean;
  className?: string;
}

const MobileContactList: React.FC<MobileContactListProps> = ({
  contacts,
  onContactClick,
  onCallContact,
  onEmailContact,
  onSmsContact,
  loading = false,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [swipedContactId, setSwipedContactId] = useState<number | null>(null);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact =>
      contact.first_name?.toLowerCase().includes(query) ||
      contact.last_name?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.phone?.includes(query) ||
      contact.company?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleSwipe = (contactId: number) => {
    setSwipedContactId(swipedContactId === contactId ? null : contactId);
  };

  const getInitials = (contact: Contact) => {
    const first = contact.first_name?.charAt(0) || '';
    const last = contact.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Simple phone formatting for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </MobileContainer>
    );
  }

  return (
    <div className={className}>
      {/* Search Bar */}
      <MobileContainer>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </MobileContainer>

      {/* Contact List */}
      <div className="space-y-1">
        {filteredContacts.length === 0 ? (
          <MobileContainer>
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No contacts found</div>
              <div className="text-gray-500 text-sm">
                {searchQuery ? 'Try adjusting your search' : 'Add your first contact to get started'}
              </div>
            </div>
          </MobileContainer>
        ) : (
          filteredContacts.map((contact) => (
            <div key={contact.id} className="relative overflow-hidden">
              {/* Swipe Actions Background */}
              <div className="absolute inset-y-0 right-0 flex items-center bg-gray-100">
                <button
                  onClick={() => onCallContact(contact)}
                  className="h-full px-4 bg-green-500 text-white flex items-center justify-center"
                  disabled={!contact.phone}
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onEmailContact(contact)}
                  className="h-full px-4 bg-blue-500 text-white flex items-center justify-center"
                  disabled={!contact.email}
                >
                  <Mail className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onSmsContact(contact)}
                  className="h-full px-4 bg-purple-500 text-white flex items-center justify-center"
                  disabled={!contact.phone}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>

              {/* Contact Item */}
              <div
                className={`bg-white border-b border-gray-100 transition-transform duration-200 ${
                  swipedContactId === contact.id ? 'transform -translate-x-48' : ''
                }`}
                onClick={() => onContactClick(contact)}
              >
                <div className="flex items-center p-4 space-x-3">
                  {/* Profile Image */}
                  <ProfileImage
                    src={contact.profile_image_url}
                    alt={`${contact.first_name} ${contact.last_name}`}
                    size="md"
                    fallbackInitials={getInitials(contact)}
                    className="flex-shrink-0"
                  />

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900 truncate">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwipe(contact.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mt-1 space-y-1">
                      {contact.phone && (
                        <p className="text-sm text-gray-600 truncate">
                          {formatPhoneNumber(contact.phone)}
                        </p>
                      )}
                      {contact.email && (
                        <p className="text-sm text-gray-600 truncate">
                          {contact.email}
                        </p>
                      )}
                      {contact.company && (
                        <p className="text-xs text-gray-500 truncate">
                          {contact.company}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileContactList;

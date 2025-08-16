import React, { useState, useMemo } from 'react';
import { Contact } from '../../types';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Users, 
  Upload,
  Star,
  Clock,
  TrendingUp
} from 'lucide-react';
import ProfileImage from '../ui/ProfileImage';
import MobileContainer from './MobileContainer';

interface MobileDashboardProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
  onCallContact: (contact: Contact) => void;
  onEmailContact: (contact: Contact) => void;
  onAddContact: () => void;
  onImportContacts: () => void;
  onSearchClick: () => void;
  loading?: boolean;
  className?: string;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  contacts,
  onContactClick,
  onCallContact,
  onEmailContact,
  onAddContact,
  onImportContacts,
  onSearchClick,
  loading = false,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get recent contacts (last 5)
  const recentContacts = useMemo(() => {
    return contacts
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5);
  }, [contacts]);

  // Get frequently contacted (mock data - in real app this would come from usage analytics)
  const frequentContacts = useMemo(() => {
    return contacts.slice(0, 4);
  }, [contacts]);

  // Filter contacts for search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return contacts
      .filter(contact =>
        contact.first_name?.toLowerCase().includes(query) ||
        contact.last_name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.includes(query) ||
        contact.company?.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [contacts, searchQuery]);

  const getInitials = (contact: Contact) => {
    const first = contact.first_name?.charAt(0) || '';
    const last = contact.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 min-h-full ${className}`}>
        <MobileContainer>
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
            
            {/* Quick actions skeleton */}
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
            
            {/* Recent contacts skeleton */}
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
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
          </div>
        </MobileContainer>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 min-h-full ${className}`}>
      {/* Header */}
      <div className="bg-white">
        <MobileContainer>
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome back!
            </h1>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={onSearchClick}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </MobileContainer>
      </div>

      {/* Search Results */}
      {searchQuery && filteredContacts.length > 0 && (
        <div className="mt-4">
          <MobileContainer>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Search Results</h2>
          </MobileContainer>
          
          <div className="bg-white">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onContactClick(contact)}
                className="flex items-center p-4 border-b border-gray-100 last:border-b-0 active:bg-gray-50"
              >
                <ProfileImage
                  src={contact.profile_image_url}
                  alt={`${contact.first_name} ${contact.last_name}`}
                  size="md"
                  fallbackInitials={getInitials(contact)}
                  className="flex-shrink-0 mr-3"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900 truncate">
                    {contact.first_name} {contact.last_name}
                  </h3>
                  {contact.phone && (
                    <p className="text-sm text-gray-600 truncate">
                      {formatPhoneNumber(contact.phone)}
                    </p>
                  )}
                  {contact.company && (
                    <p className="text-xs text-gray-500 truncate">
                      {contact.company}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!searchQuery && (
        <>
          <div className="mt-6">
            <MobileContainer>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onAddContact}
                  className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800"
                >
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Add Contact</span>
                </button>
                
                <button
                  onClick={onImportContacts}
                  className="flex flex-col items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800"
                >
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Import</span>
                </button>
                
                <button
                  onClick={onSearchClick}
                  className="flex flex-col items-center justify-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800"
                >
                  <Search className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Search</span>
                </button>
                
                <div className="flex flex-col items-center justify-center p-4 bg-gray-100 text-gray-600 rounded-lg">
                  <Users className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">{contacts.length} Contacts</span>
                </div>
              </div>
            </MobileContainer>
          </div>

          {/* Recent Contacts */}
          {recentContacts.length > 0 && (
            <div className="mt-6">
              <MobileContainer>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-gray-500" />
                    Recent
                  </h2>
                </div>
              </MobileContainer>
              
              <div className="bg-white">
                {recentContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => onContactClick(contact)}
                    className="flex items-center p-4 border-b border-gray-100 last:border-b-0 active:bg-gray-50"
                  >
                    <ProfileImage
                      src={contact.profile_image_url}
                      alt={`${contact.first_name} ${contact.last_name}`}
                      size="md"
                      fallbackInitials={getInitials(contact)}
                      className="flex-shrink-0 mr-3"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 truncate">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      {contact.phone && (
                        <p className="text-sm text-gray-600 truncate">
                          {formatPhoneNumber(contact.phone)}
                        </p>
                      )}
                      {contact.company && (
                        <p className="text-xs text-gray-500 truncate">
                          {contact.company}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-3">
                      {contact.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCallContact(contact);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      )}
                      {contact.email && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEmailContact(contact);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Frequently Contacted */}
          {frequentContacts.length > 0 && (
            <div className="mt-6 mb-8">
              <MobileContainer>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-gray-500" />
                    Frequently Contacted
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {frequentContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => onContactClick(contact)}
                      className="bg-white p-4 rounded-lg border border-gray-200 active:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <ProfileImage
                          src={contact.profile_image_url}
                          alt={`${contact.first_name} ${contact.last_name}`}
                          size="sm"
                          fallbackInitials={getInitials(contact)}
                          className="flex-shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {contact.first_name} {contact.last_name}
                          </h3>
                          {contact.company && (
                            <p className="text-xs text-gray-500 truncate">
                              {contact.company}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-center space-x-4 mt-3">
                        {contact.phone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCallContact(contact);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        )}
                        {contact.email && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEmailContact(contact);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </MobileContainer>
            </div>
          )}

          {/* Empty State */}
          {contacts.length === 0 && (
            <div className="mt-12">
              <MobileContainer className="text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
                <p className="text-gray-500 mb-6">
                  Add your first contact or import from your device to get started.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={onAddContact}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800"
                  >
                    Add Your First Contact
                  </button>
                  <button
                    onClick={onImportContacts}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300"
                  >
                    Import Contacts
                  </button>
                </div>
              </MobileContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MobileDashboard;

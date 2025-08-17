import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Mail, Building } from 'lucide-react';
import { Contact } from '../types';

interface ContactLookupProps {
  contacts: Contact[];
  selectedContacts: Contact[];
  onContactSelect: (contact: Contact) => void;
  onContactRemove: (contactId: number) => void;
  placeholder?: string;
  className?: string;
}

const ContactLookup: React.FC<ContactLookupProps> = ({
  contacts,
  selectedContacts,
  onContactSelect,
  onContactRemove,
  placeholder = "Type to search contacts...",
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter contacts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(contact => {
      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
      const email = (contact.email || '').toLowerCase();
      const company = (contact.company || '').toLowerCase();
      
      return (
        fullName.includes(query) ||
        email.includes(query) ||
        company.includes(query)
      ) && !selectedContacts.some(selected => selected.id === contact.id);
    });

    setFilteredContacts(filtered.slice(0, 10)); // Limit to 10 results
    setHighlightedIndex(-1);
  }, [searchQuery, contacts, selectedContacts]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredContacts.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredContacts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredContacts.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredContacts.length) {
          handleContactSelect(filteredContacts[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        inputRef.current?.blur();
        break;
    }
  };

  const handleContactSelect = (contact: Contact) => {
    onContactSelect(contact);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const getContactDisplayName = (contact: Contact) => {
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    return name || contact.email || 'Unknown Contact';
  };

  const getContactSubtitle = (contact: Contact) => {
    const parts = [];
    if (contact.email) parts.push(contact.email);
    if (contact.company) parts.push(contact.company);
    return parts.join(' • ');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
            >
              <User className="h-3 w-3 mr-1" />
              <span>{getContactDisplayName(contact)}</span>
              <button
                onClick={() => onContactRemove(contact.id)}
                className="ml-2 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (searchQuery.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Dropdown */}
      {isOpen && filteredContacts.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredContacts.map((contact, index) => (
            <button
              key={contact.id}
              onClick={() => handleContactSelect(contact)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {contact.profile_image_url ? (
                    <img
                      src={contact.profile_image_url}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {getContactDisplayName(contact)}
                  </div>
                  <div className="text-sm text-gray-500 truncate flex items-center">
                    {contact.email && (
                      <>
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="mr-2">{contact.email}</span>
                      </>
                    )}
                    {contact.company && (
                      <>
                        <Building className="h-3 w-3 mr-1" />
                        <span>{contact.company}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchQuery.trim() && filteredContacts.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
          No contacts found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default ContactLookup;

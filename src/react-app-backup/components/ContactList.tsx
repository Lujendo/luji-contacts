// Contact list component
import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { api } from '../context/AuthContext';
import { Contact, ContactFilters } from '../types';
import toast from 'react-hot-toast';

interface ContactListProps {
  onContactSelect: (contact: Contact) => void;
  onContactCreate: () => void;
  refreshTrigger: number;
}

export default function ContactList({ onContactSelect, onContactCreate, refreshTrigger }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ContactFilters>({
    search: '',
    sort: 'first_name',
    direction: 'asc'
  });

  useEffect(() => {
    fetchContacts();
  }, [refreshTrigger, filters]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.direction) params.append('direction', filters.direction);

      const response = await api.get(`/contacts?${params.toString()}`);
      setContacts(response.data.contacts || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleSortChange = (sort: string) => {
    setFilters(prev => ({
      ...prev,
      sort: sort as any,
      direction: prev.sort === sort && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getContactDisplayName = (contact: Contact) => {
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    }
    return contact.email || 'Unnamed Contact';
  };

  const getContactInitials = (contact: Contact) => {
    const firstName = contact.first_name || '';
    const lastName = contact.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    } else if (contact.email) {
      return contact.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
          <p className="text-gray-600">{contacts.length} contacts</p>
        </div>
        <button
          onClick={onContactCreate}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Contact
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleSortChange('first_name')}
            className={`px-3 py-1 text-sm rounded-md ${
              filters.sort === 'first_name' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Name {filters.sort === 'first_name' && (filters.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSortChange('email')}
            className={`px-3 py-1 text-sm rounded-md ${
              filters.sort === 'email' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Email {filters.sort === 'email' && (filters.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSortChange('company')}
            className={`px-3 py-1 text-sm rounded-md ${
              filters.sort === 'company' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Company {filters.sort === 'company' && (filters.direction === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Contact List */}
      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first contact.
          </p>
          <div className="mt-6">
            <button
              onClick={onContactCreate}
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Contact
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onContactSelect(contact)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {contact.profile_image_url ? (
                    <img
                      src={contact.profile_image_url}
                      alt={getContactDisplayName(contact)}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {getContactInitials(contact)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {getContactDisplayName(contact)}
                  </h3>
                  {contact.company && (
                    <p className="text-sm text-gray-500 truncate">{contact.company}</p>
                  )}
                  <div className="mt-2 space-y-1">
                    {contact.email && (
                      <div className="flex items-center text-xs text-gray-500">
                        <EnvelopeIcon className="h-3 w-3 mr-1" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center text-xs text-gray-500">
                        <PhoneIcon className="h-3 w-3 mr-1" />
                        <span className="truncate">{contact.phone}</span>
                      </div>
                    )}
                  </div>
                  {contact.groups && contact.groups.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {contact.groups.slice(0, 2).map((group) => (
                          <span
                            key={group.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {group.name}
                          </span>
                        ))}
                        {contact.groups.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{contact.groups.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { contactsApi } from '../api';
import ContactListItem from './ContactListItem';
import ContactListSkeleton from './ContactListSkeleton';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface SimpleContactListProps {
  search?: string;
  sort?: string;
  direction?: string;
  onContactClick: (contact: Contact) => void;
  onContactSelect?: (contact: Contact, selected: boolean) => void;
  onSortChange?: (field: string) => void;
  selectedContacts?: Set<number>;
  className?: string;
  containerHeight?: number;
}

const SimpleContactList: React.FC<SimpleContactListProps> = ({
  search = '',
  sort = '',
  direction = '',
  onContactClick,
  onContactSelect,
  onSortChange,
  selectedContacts = new Set(),
  className = '',
  containerHeight = 600
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Load contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = {
          page: '1',
          limit: '100',
          search: search || undefined,
          sort: sort || undefined,
          direction: direction || undefined
        };

        const response = await contactsApi.getContacts(queryParams);

        if (response.success && response.data) {
          setContacts(Array.isArray(response.data) ? response.data : []);
          setTotal(response.total || 0);
        } else {
          throw new Error('Failed to load contacts');
        }
      } catch (err) {
        console.error('Error loading contacts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [search, sort, direction]);

  // Sortable column header component
  const SortableHeader: React.FC<{
    field: string;
    label: string;
    className?: string;
    sortable?: boolean;
  }> = ({ field, label, className = '', sortable = true }) => {
    const isActive = sort === field;
    const isAsc = direction === 'asc';

    const handleClick = () => {
      if (sortable && onSortChange) {
        onSortChange(field);
      }
    };

    if (!sortable) {
      return <div className={className}>{label}</div>;
    }

    return (
      <button
        onClick={handleClick}
        className={`${className} flex items-center space-x-1 hover:text-gray-700 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        {isActive && (
          isAsc ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        )}
      </button>
    );
  };

  // Multi-option sortable header for name column
  const NameSortableHeader: React.FC<{
    className?: string;
  }> = ({ className = '' }) => {
    const isFirstNameActive = sort === 'first_name';
    const isLastNameActive = sort === 'last_name';
    const isAsc = direction === 'asc';

    return (
      <div className={`${className} flex items-center space-x-2`}>
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Name:</span>
        <button
          onClick={() => onSortChange && onSortChange('first_name')}
          className={`flex items-center space-x-1 hover:text-gray-700 transition-colors text-xs ${
            isFirstNameActive ? 'text-blue-600 font-medium' : 'text-gray-500'
          }`}
          title="Sort by First Name"
        >
          <span>First</span>
          {isFirstNameActive && (
            isAsc ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )
          )}
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => onSortChange && onSortChange('last_name')}
          className={`flex items-center space-x-1 hover:text-gray-700 transition-colors text-xs ${
            isLastNameActive ? 'text-blue-600 font-medium' : 'text-gray-500'
          }`}
          title="Sort by Last Name"
        >
          <span>Last</span>
          {isLastNameActive && (
            isAsc ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )
          )}
        </button>
      </div>
    );
  };

  if (error) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading contacts</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Stats */}
      {total > 0 && (
        <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-b flex items-center justify-between">
          <div>
            Showing {contacts.length} of {total} contacts
            {search && ` matching "${search}"`}
          </div>
          <div className="text-xs text-gray-500">
            Click column headers to sort
          </div>
        </div>
      )}

      {/* Sortable Table Header */}
      {contacts.length > 0 && (
        <div className="grid grid-cols-12 gap-4 items-center px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium uppercase tracking-wider">
          {onContactSelect && <div className="col-span-1"></div>}
          <NameSortableHeader
            className={onContactSelect ? 'col-span-3' : 'col-span-4'}
          />
          <SortableHeader
            field="email"
            label="Email"
            className="col-span-2"
          />
          <SortableHeader
            field="phone"
            label="Phone"
            className="col-span-2"
            sortable={false}
          />
          <SortableHeader
            field="company"
            label="Company"
            className="col-span-2"
          />
          <SortableHeader
            field="role"
            label="Role/Groups"
            className="col-span-2"
            sortable={false}
          />
        </div>
      )}

      {/* Contact list container */}
      <div
        className="flex-1 overflow-auto"
        style={{ height: containerHeight }}
      >
        {/* Contact items */}
        <div className="bg-white">
          {contacts.map((contact) => (
            <ContactListItem
              key={contact.id}
              contact={contact}
              onClick={() => onContactClick(contact)}
              onSelect={onContactSelect ? (selected) => onContactSelect(contact, selected) : undefined}
              selected={selectedContacts.has(contact.id)}
              className=""
            />
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="py-4">
            <ContactListSkeleton count={3} />
          </div>
        )}

        {/* Empty state */}
        {!loading && contacts.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-500 mb-2">
                {search ? 'No contacts found matching your search' : 'No contacts found'}
              </p>
              {search && (
                <p className="text-gray-400 text-sm">
                  Try adjusting your search terms
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleContactList;

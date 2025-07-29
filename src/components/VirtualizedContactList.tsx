import React, { useRef, useCallback, useEffect } from 'react';
import { Contact } from '../types';
import { useInfiniteContacts, useIntersectionObserver } from '../hooks/useInfiniteContacts';
import ContactListItem from './ContactListItem';
import ContactListSkeleton from './ContactListSkeleton';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface VirtualizedContactListProps {
  search?: string;
  sort?: string;
  direction?: string;
  onContactClick: (contact: Contact) => void;
  onContactSelect?: (contact: Contact, selected: boolean) => void;
  onSortChange?: (field: string) => void;
  selectedContacts?: Set<number>;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
}

const VirtualizedContactList: React.FC<VirtualizedContactListProps> = ({
  search = '',
  sort = '',
  direction = '',
  onContactClick,
  onContactSelect,
  onSortChange,
  selectedContacts = new Set(),
  className = '',
  itemHeight = 80,
  containerHeight = 600
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Infinite loading hook
  const {
    contacts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    total
  } = useInfiniteContacts({
    limit: 50,
    search,
    sort,
    direction,
    enabled: true
  });



  // Intersection observer for infinite loading
  const loadMoreRef = useIntersectionObserver(
    useCallback(() => {
      console.log('Intersection triggered:', { hasMore, loading, totalContacts: contacts.length });
      if (hasMore && !loading) {
        console.log('Loading more contacts...');
        loadMore();
      }
    }, [hasMore, loading, loadMore, contacts.length])
  );

  // Refresh when search/sort changes
  useEffect(() => {
    refresh();
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

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium mb-2">Error loading contacts</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Stats */}
      {total > 0 && (
        <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-b flex items-center justify-between">
          <div>
            Showing {contacts.length} of {total} contacts
            {search && ` matching "${search}"`}
            {/* Debug info */}
            <span className="ml-4 text-xs text-gray-400">
              (hasMore: {hasMore ? 'yes' : 'no'}, loading: {loading ? 'yes' : 'no'})
            </span>
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
          <SortableHeader
            field="first_name"
            label="Name"
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

      {/* Contact list container - simplified without virtual scrolling for now */}
      <div
        ref={containerRef}
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

        {/* Load more trigger */}
        {hasMore && !loading && (
          <div
            ref={loadMoreRef}
            className="py-4 text-center text-gray-500"
          >
            <div className="animate-pulse">Loading more contacts...</div>
          </div>
        )}

        {/* End of list */}
        {!hasMore && contacts.length > 0 && (
          <div className="py-4 text-center text-gray-500 text-sm">
            End of contacts list
          </div>
        )}
      </div>

      {/* Empty state */}
      {!loading && contacts.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search 
                ? `No contacts match "${search}"`
                : 'Add your first contact to get started'
              }
            </p>
            {search && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedContactList;

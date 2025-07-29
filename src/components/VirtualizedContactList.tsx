import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Contact } from '../types';
import { useVirtualScrolling, useScrollHandler } from '../hooks/useVirtualScrolling';
import { useInfiniteContacts, useIntersectionObserver } from '../hooks/useInfiniteContacts';
import ContactListItem from './ContactListItem';
import ContactListSkeleton from './ContactListSkeleton';

interface VirtualizedContactListProps {
  search?: string;
  sort?: string;
  direction?: string;
  onContactClick: (contact: Contact) => void;
  onContactSelect?: (contact: Contact, selected: boolean) => void;
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
  selectedContacts = new Set(),
  className = '',
  itemHeight = 80,
  containerHeight = 600
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

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

  // Virtual scrolling hook
  const {
    startIndex,
    endIndex,
    totalHeight,
    offsetY
  } = useVirtualScrolling({
    itemHeight,
    containerHeight,
    overscan: 5,
    totalItems: Array.isArray(contacts) ? contacts.length : 0
  });

  // Scroll handler
  const handleScroll = useScrollHandler((scrollTop) => {
    setScrollTop(scrollTop);
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

  // Get visible contacts with safety check
  const visibleContacts = Array.isArray(contacts) ? contacts.slice(startIndex, endIndex + 1) : [];

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
        <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-b">
          Showing {contacts.length} of {total} contacts
          {search && ` matching "${search}"`}
          {/* Debug info */}
          <span className="ml-4 text-xs text-gray-400">
            (hasMore: {hasMore ? 'yes' : 'no'}, loading: {loading ? 'yes' : 'no'})
          </span>
        </div>
      )}

      {/* Virtual scrolling container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {/* Total height spacer */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible items container */}
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleContacts.map((contact, index) => (
              <ContactListItem
                key={contact.id}
                contact={contact}
                onClick={() => onContactClick(contact)}
                onSelect={onContactSelect ? (selected) => onContactSelect(contact, selected) : undefined}
                selected={selectedContacts.has(contact.id)}
                style={{ height: itemHeight }}
                className="border-b border-gray-100"
              />
            ))}
          </div>
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

import React, { useRef, useCallback, useEffect } from 'react';
import { Contact } from '../types';
import { useInfiniteContacts } from '../hooks/useInfiniteContacts';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import ContactListItem from './ContactListItem';
import ContactListSkeleton from './ContactListSkeleton';
import {
  ChevronUp,
  ChevronDown,
  BarChart3,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock
} from 'lucide-react';

interface InfiniteContactListProps {
  search?: string;
  sort?: string;
  direction?: string;
  onContactClick: (contact: Contact) => void;
  onContactSelect?: (contact: Contact, selected: boolean) => void;
  onSortChange?: (field: string) => void;
  selectedContacts?: Set<number>;
  className?: string;
  containerHeight?: number;
  enableCache?: boolean;
  showCacheStats?: boolean;
  groupId?: number;
}

/**
 * Progressive loading contact list without virtual scrolling complexity
 * - Uses safe infinite loading hook with optional caching
 * - Simple intersection observer for load-more trigger
 * - Clean error handling and loading states
 * - No circular dependencies or global side effects
 */
const InfiniteContactList: React.FC<InfiniteContactListProps> = ({
  search = '',
  sort = '',
  direction = '',
  onContactClick,
  onContactSelect,
  onSortChange,
  selectedContacts = new Set(),
  className = '',
  containerHeight = 600,
  enableCache = true,
  showCacheStats = false,
  groupId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Safe infinite loading hook with caching
  const {
    contacts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
    cacheStats
  } = useInfiniteContacts({
    limit: 50,
    search,
    sort,
    direction,
    enabled: true,
    enableCache,
    groupId
  });

  // Intersection observer for infinite loading
  const loadMoreRef = useIntersectionObserver(
    useCallback((entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting && hasMore && !loading) {
        console.log('Loading more contacts...', { hasMore, loading, totalContacts: contacts.length });
        loadMore();
      }
    }, [hasMore, loading, loadMore, contacts.length])
  );

  // Refresh when search/sort/group changes
  useEffect(() => {
    refresh();
  }, [search, sort, direction, groupId, refresh]);

  // Enhanced sortable column header component
  const SortableHeader: React.FC<{
    field: string;
    label: string;
    className?: string;
    sortable?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
  }> = ({ field, label, className = '', sortable = true, icon: Icon }) => {
    const isActive = sort === field;
    const isAsc = direction === 'asc';

    const handleClick = () => {
      if (sortable && onSortChange) {
        onSortChange(field);
      }
    };

    if (!sortable) {
      return (
        <div className={`${className} flex items-center space-x-1 text-gray-400`}>
          {Icon && <Icon className="w-3 h-3" />}
          <span>{label}</span>
        </div>
      );
    }

    return (
      <button
        onClick={handleClick}
        className={`${className} group flex items-center space-x-1 hover:text-blue-600 transition-all duration-200 ${
          isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
        } ${loading ? 'cursor-wait' : 'cursor-pointer'}`}
        title={`Sort by ${label}${isActive ? (isAsc ? ' (ascending)' : ' (descending)') : ''}`}
        disabled={loading}
      >
        {Icon && <Icon className="w-3 h-3" />}
        <span className="select-none">{label}</span>
        <div className="flex items-center">
          {loading && isActive ? (
            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : isActive ? (
            isAsc ? (
              <ChevronUp className="w-3 h-3 text-blue-600" />
            ) : (
              <ChevronDown className="w-3 h-3 text-blue-600" />
            )
          ) : (
            <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </div>
      </button>
    );
  };

  // Enhanced multi-option sortable header for name column
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
          className={`group flex items-center space-x-1 hover:text-blue-600 transition-all duration-200 text-xs ${
            isFirstNameActive ? 'text-blue-600 font-medium' : 'text-gray-500'
          } ${loading ? 'cursor-wait' : 'cursor-pointer'}`}
          title={`Sort by First Name${isFirstNameActive ? (isAsc ? ' (ascending)' : ' (descending)') : ''}`}
          disabled={loading}
        >
          <span className="select-none">First</span>
          {loading && isFirstNameActive ? (
            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : isFirstNameActive ? (
            isAsc ? (
              <ChevronUp className="w-3 h-3 text-blue-600" />
            ) : (
              <ChevronDown className="w-3 h-3 text-blue-600" />
            )
          ) : (
            <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => onSortChange && onSortChange('last_name')}
          className={`group flex items-center space-x-1 hover:text-blue-600 transition-all duration-200 text-xs ${
            isLastNameActive ? 'text-blue-600 font-medium' : 'text-gray-500'
          } ${loading ? 'cursor-wait' : 'cursor-pointer'}`}
          title={`Sort by Last Name${isLastNameActive ? (isAsc ? ' (ascending)' : ' (descending)') : ''}`}
          disabled={loading}
        >
          <span className="select-none">Last</span>
          {loading && isLastNameActive ? (
            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : isLastNameActive ? (
            isAsc ? (
              <ChevronUp className="w-3 h-3 text-blue-600" />
            ) : (
              <ChevronDown className="w-3 h-3 text-blue-600" />
            )
          ) : (
            <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </button>
      </div>
    );
  };

  // Cache stats display
  const CacheStatsDisplay: React.FC = () => {
    const stats = cacheStats();
    if (!stats || !showCacheStats) return null;

    return (
      <div className="px-4 py-2 bg-blue-50 border-b text-xs text-blue-700 flex items-center space-x-4">
        <BarChart3 className="w-4 h-4" />
        <span>Cache: {stats.size}/{stats.maxSize} entries</span>
        <span>Hit Rate: {(stats.hitRate * 100).toFixed(1)}%</span>
        <span>Hits: {stats.hitCount}</span>
        <span>Misses: {stats.missCount}</span>
      </div>
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
      {/* Cache Stats */}
      <CacheStatsDisplay />

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

      {/* Enhanced Sortable Table Header */}
      {contacts.length > 0 && (
        <div className="grid grid-cols-12 gap-4 items-center px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 text-xs font-medium uppercase tracking-wider">
          {onContactSelect && <div className="col-span-1"></div>}
          <NameSortableHeader
            className={onContactSelect ? 'col-span-3' : 'col-span-4'}
          />
          <SortableHeader
            field="email"
            label="Email"
            icon={Mail}
            className="col-span-2"
          />
          <SortableHeader
            field="phone"
            label="Phone"
            icon={Phone}
            className="col-span-2"
            sortable={true}
          />
          <SortableHeader
            field="company"
            label="Company"
            icon={Building}
            className="col-span-2"
          />
          <SortableHeader
            field="created_at"
            label="Added"
            icon={Calendar}
            className="col-span-1"
          />
          <div className="col-span-1"></div> {/* Actions column */}
        </div>
      )}

      {/* Contact list container - progressive loading without virtual scrolling */}
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
            End of contacts list ({total} total)
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

export default InfiniteContactList;

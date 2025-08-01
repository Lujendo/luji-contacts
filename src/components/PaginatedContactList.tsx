import React, { useState, useCallback } from 'react';
import { Contact } from '../types';
import { useOptimizedPagination } from '../hooks/useOptimizedPagination';
import ContactListItem from './ContactListItem';
import ContactListSkeleton from './ContactListSkeleton';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Zap } from 'lucide-react';

interface PaginatedContactListProps {
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
  onEditContact?: (contact: Contact) => void;
  onSendEmail?: (contact: Contact) => void;
  onAddToGroup?: (contact: Contact) => void;
  onViewDetails?: (contact: Contact) => void;
  groupId?: number;
}

const PaginatedContactList: React.FC<PaginatedContactListProps> = ({
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
  onEditContact,
  onSendEmail,
  onAddToGroup,
  onViewDetails,
  groupId
}) => {
  // Page size options
  const pageSizeOptions = [10, 25, 50, 100];
  const [initialPageSize] = useState(25);

  // Use optimized pagination hook with caching and prefetching
  const {
    contacts,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,
    refresh,
    cacheStats
  } = useOptimizedPagination({
    pageSize: initialPageSize,
    search,
    sort,
    direction,
    enabled: true,
    enableCache,
    prefetchAdjacent: true,
    groupId
  });

  // Calculate display info
  const pageSize = Math.ceil(total / totalPages) || initialPageSize;
  const startRecord = total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, total);

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      if (currentPage <= 4) {
        // Near beginning
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

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

  // Cache stats display component
  const CacheStatsDisplay: React.FC = () => {
    const stats = cacheStats();
    if (!stats || !showCacheStats) return null;

    return (
      <div className="px-4 py-2 bg-blue-50 border-b text-xs text-blue-700 flex items-center space-x-4">
        <Zap className="w-4 h-4" />
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

      {/* Stats and Page Size Selector */}
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {total > 0 ? (
              <>
                Showing {startRecord}-{endRecord} of {total} contacts
                {search && ` matching "${search}"`}
                {loading && (
                  <span className="ml-2 text-blue-600 text-xs">
                    ⚡ Loading...
                  </span>
                )}
              </>
            ) : (
              'No contacts found'
            )}
          </div>
          
          {/* Page Size Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500">per page</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          Click column headers to sort
        </div>
      </div>

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
        style={{ height: containerHeight - 120 }} // Account for pagination controls
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
              onEdit={onEditContact}
              onSendEmail={onSendEmail}
              onAddToGroup={onAddToGroup}
              onViewDetails={onViewDetails}
              className=""
            />
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="py-4">
            <ContactListSkeleton count={Math.min(pageSize, 5)} />
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-gray-500">...</span>
                ) : (
                  <button
                    onClick={() => goToPage(page as number)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

export default PaginatedContactList;

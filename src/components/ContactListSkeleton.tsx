import React from 'react';

interface ContactListSkeletonProps {
  count?: number;
  className?: string;
}

const ContactListSkeleton: React.FC<ContactListSkeletonProps> = ({
  count = 5,
  className = ''
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center p-4 border-b border-gray-100 animate-pulse"
        >
          {/* Profile image skeleton */}
          <div className="flex-shrink-0 mr-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          </div>

          {/* Content skeleton */}
          <div className="flex-1 min-w-0">
            {/* Name skeleton */}
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="flex space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>

            {/* Details skeleton */}
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-200 rounded mr-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-200 rounded mr-2"></div>
                <div className="h-3 bg-gray-200 rounded w-36"></div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-200 rounded mr-2"></div>
                <div className="h-3 bg-gray-200 rounded w-28"></div>
              </div>
            </div>

            {/* Groups skeleton */}
            <div className="mt-2 flex space-x-1">
              <div className="h-5 bg-gray-200 rounded-full w-16"></div>
              <div className="h-5 bg-gray-200 rounded-full w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactListSkeleton;

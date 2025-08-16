import React, { useState } from 'react';
import { User } from 'lucide-react';

interface ProfileImageProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackInitials?: string;
  showBorder?: boolean;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackInitials,
  showBorder = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset error state when src changes
  React.useEffect(() => {
    if (src) {
      setImageError(false);
      setIsLoading(true);
    }
  }, [src]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-2xl'
  };

  const borderClass = showBorder ? 'border-4 border-gray-200 shadow-lg' : '';
  const baseClasses = `${sizeClasses[size]} rounded-full object-cover ${borderClass} ${className}`;

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  // Show image if src exists and no error occurred
  if (src && !imageError) {
    return (
      <div className="relative">
        <img
          src={src}
          alt={alt}
          className={baseClasses}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {isLoading && (
          <div className={`${baseClasses} absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center`}>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          </div>
        )}
      </div>
    );
  }

  // Show fallback with initials or user icon
  return (
    <div className={`${baseClasses} bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center`}>
      {fallbackInitials ? (
        <span className={`text-indigo-600 font-medium ${textSizes[size]}`}>
          {fallbackInitials}
        </span>
      ) : (
        <User className={`${iconSizes[size]} text-indigo-400`} />
      )}
    </div>
  );
};

export default ProfileImage;

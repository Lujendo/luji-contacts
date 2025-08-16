import React, { ReactNode } from 'react';

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  background?: 'white' | 'gray' | 'transparent';
}

const MobileContainer: React.FC<MobileContainerProps> = ({
  children,
  className = '',
  padding = 'md',
  background = 'transparent'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    transparent: 'bg-transparent'
  };

  return (
    <div className={`${paddingClasses[padding]} ${backgroundClasses[background]} ${className}`}>
      {children}
    </div>
  );
};

export default MobileContainer;

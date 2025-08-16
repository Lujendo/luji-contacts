import React, { ReactNode } from 'react';
import { useMobile } from '../../context/MobileContext';
import MobileHeader from './MobileHeader';
import MobileBottomNav from './MobileBottomNav';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showBottomNav?: boolean;
  headerActions?: ReactNode;
  className?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  onBackClick,
  showBottomNav = true,
  headerActions,
  className = ''
}) => {
  const { showMobileView } = useMobile();

  if (!showMobileView) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader
        title={title}
        showBackButton={showBackButton}
        onBackClick={onBackClick}
        actions={headerActions}
      />

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${className}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
};

export default MobileLayout;

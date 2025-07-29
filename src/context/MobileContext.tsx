import React, { createContext, useContext, ReactNode } from 'react';
import { useMobileDetection, MobileDetectionResult } from '../hooks/useMobileDetection';

interface MobileContextType extends MobileDetectionResult {
  // Additional mobile-specific state and methods can be added here
  showMobileView: boolean;
  forceMobileView: boolean;
  setForceMobileView: (force: boolean) => void;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

interface MobileProviderProps {
  children: ReactNode;
}

export const MobileProvider: React.FC<MobileProviderProps> = ({ children }) => {
  const detection = useMobileDetection();
  const [forceMobileView, setForceMobileView] = React.useState(false);
  
  // Determine if we should show mobile view
  const showMobileView = forceMobileView || detection.isMobile || detection.isTablet;
  
  const contextValue: MobileContextType = {
    ...detection,
    showMobileView,
    forceMobileView,
    setForceMobileView
  };

  return (
    <MobileContext.Provider value={contextValue}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobile = (): MobileContextType => {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
};

// Utility hook for conditional rendering
export const useResponsiveComponent = <T extends Record<string, React.ComponentType<any>>>(
  components: T
): T[keyof T] => {
  const { deviceType } = useMobile();
  
  if (deviceType === 'mobile' && components.mobile) {
    return components.mobile;
  }
  
  if (deviceType === 'tablet' && components.tablet) {
    return components.tablet;
  }
  
  if (components.desktop) {
    return components.desktop;
  }
  
  // Fallback to first available component
  return Object.values(components)[0];
};

import { useState, useEffect } from 'react';

export interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  touchSupported: boolean;
}

export const useMobileDetection = (): MobileDetectionResult => {
  const [detection, setDetection] = useState<MobileDetectionResult>(() => {
    // Initial detection on mount
    return detectDevice();
  });

  useEffect(() => {
    const handleResize = () => {
      setDetection(detectDevice());
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(() => {
        setDetection(detectDevice());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return detection;
};

function detectDevice(): MobileDetectionResult {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const userAgent = navigator.userAgent;
  
  // Check for touch support
  const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Mobile device detection based on user agent
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?=.*\bMobile\b)(?=.*\bTablet\b)|Android(?=.*\bTablet\b)/i;
  
  // Screen size breakpoints
  const isMobileScreen = screenWidth < 768;
  const isTabletScreen = screenWidth >= 768 && screenWidth < 1024;
  const isDesktopScreen = screenWidth >= 1024;
  
  // User agent detection
  const isMobileUA = mobileRegex.test(userAgent) && !tabletRegex.test(userAgent);
  const isTabletUA = tabletRegex.test(userAgent);
  
  // Combined detection logic
  const isMobile = isMobileScreen || (isMobileUA && !isTabletUA);
  const isTablet = (isTabletScreen && touchSupported) || isTabletUA;
  const isDesktop = !isMobile && !isTablet;
  
  // Determine device type
  let deviceType: 'mobile' | 'tablet' | 'desktop';
  if (isMobile) {
    deviceType = 'mobile';
  } else if (isTablet) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }
  
  // Determine orientation
  const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    userAgent,
    deviceType,
    orientation,
    touchSupported
  };
}

// Utility functions for responsive design
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
} as const;

export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.mobile - 1}px)`,
  tablet: `(min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px)`,
  desktop: `(min-width: ${breakpoints.tablet}px)`,
  touch: '(hover: none) and (pointer: coarse)'
} as const;

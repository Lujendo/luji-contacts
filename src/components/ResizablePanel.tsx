import React, { useState, useEffect, useCallback, useRef, ReactNode, MouseEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Component props interface
interface ResizablePanelProps {
  children: ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  side?: 'left' | 'right';
  isVisible?: boolean;
  onToggle?: () => void;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({ 
  children, 
  minWidth = 200, 
  maxWidth = 600, 
  defaultWidth = 256,
  side = 'left',
  isVisible = true,
  onToggle
}) => {
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(defaultWidth);
  const [hideToggle, setHideToggle] = useState<boolean>(true);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [lastMouseActivity, setLastMouseActivity] = useState<number>(Date.now());
  
  const contentRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  
  const startResizing = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    startXRef.current = e.pageX;
    startWidthRef.current = width;
    setIsResizing(true);
  }, [width]);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (isResizing) {
      const diff = e.pageX - startXRef.current;
      const newWidth = side === 'left' ? 
        startWidthRef.current + diff : 
        startWidthRef.current - diff;
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(constrainedWidth);
    } else {
      setLastMouseActivity(Date.now());
      const edgePosition = side === 'left' ? 0 : window.innerWidth;
      const mouseX = e.clientX;
      const distance = side === 'left' ? mouseX : Math.abs(edgePosition - mouseX);
      setHideToggle(distance > 100);
    }
  }, [isResizing, minWidth, maxWidth, side]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    localStorage.setItem(`${side}PanelWidth`, width.toString());
  }, [width, side]);

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem(`${side}PanelWidth`);
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        setWidth(parsedWidth);
      }
    }
  }, [minWidth, maxWidth, side]);

  // Add/remove event listeners for resizing and mouse tracking
  useEffect(() => {
    const handleMouseMoveGlobal = (e: globalThis.MouseEvent) => handleMouseMove(e);
    const handleMouseUp = () => stopResizing();

    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, stopResizing]);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setIsScrolled(contentRef.current.scrollTop > 0);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Auto-hide toggle button after inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastMouseActivity > 3000) {
        setHideToggle(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastMouseActivity]);

  if (!isVisible) {
    return null;
  }

  const resizeHandleClass = side === 'left' 
    ? 'right-0 cursor-col-resize' 
    : 'left-0 cursor-col-resize';
  
  const toggleButtonClass = side === 'left' 
    ? 'right-2' 
    : 'left-2';
  
  const toggleIcon = side === 'left' ? ChevronLeft : ChevronRight;
  const ToggleIcon = toggleIcon;

  return (
    <div 
      className={`relative bg-white border-gray-200 flex-shrink-0 overflow-hidden ${
        side === 'left' ? 'border-r' : 'border-l'
      }`}
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 bg-transparent hover:bg-gray-300 transition-colors z-10 ${resizeHandleClass} ${
          isResizing ? 'bg-indigo-500' : ''
        }`}
        onMouseDown={startResizing}
        title="Drag to resize panel"
      />

      {/* Toggle button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className={`absolute top-4 z-20 p-1 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200 ${toggleButtonClass} ${
            hideToggle ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          title="Close panel"
        >
          <ToggleIcon className="h-4 w-4 text-gray-600" />
        </button>
      )}

      {/* Content */}
      <div 
        ref={contentRef}
        className={`h-full overflow-y-auto ${isScrolled ? 'shadow-inner' : ''}`}
        style={{ paddingLeft: side === 'right' ? '4px' : '0', paddingRight: side === 'left' ? '4px' : '0' }}
      >
        {children}
      </div>

      {/* Resize indicator */}
      {isResizing && (
        <div className={`absolute top-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded z-30 ${
          side === 'left' ? 'right-4' : 'left-4'
        }`}>
          {width}px
        </div>
      )}
    </div>
  );
};

export default ResizablePanel;

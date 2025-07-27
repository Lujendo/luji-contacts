import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ResizableRightPanel = ({ 
  children, 
  minWidth = 300, 
  maxWidth = 800, 
  defaultWidth = 384,
  isVisible = true,
  onToggle
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const [hideToggle, setHideToggle] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastMouseActivity, setLastMouseActivity] = useState(Date.now());
  const contentRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  
  const startResizing = useCallback((e) => {
    e.preventDefault();
    startXRef.current = e.pageX;
    startWidthRef.current = width;
    setIsResizing(true);
  }, [width]);

  const handleMouseMove = useCallback((e) => {
    if (isResizing) {
      const diff = e.pageX - startXRef.current;
      const newWidth = startWidthRef.current - diff;
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(constrainedWidth);
    } else {
      setLastMouseActivity(Date.now());
      const rightEdge = window.innerWidth;
      const mouseX = e.clientX;
      setHideToggle(rightEdge - mouseX > 100);
    }
  }, [isResizing, minWidth, maxWidth]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    localStorage.setItem('rightPanelWidth', width.toString());
  }, [width]);

  // Load saved width
  useEffect(() => {
    const savedWidth = localStorage.getItem('rightPanelWidth');
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        setWidth(parsedWidth);
      }
    }
  }, [minWidth, maxWidth]);

  // Event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  // Scroll handling
  const handleScroll = useCallback((e) => {
    setIsScrolled(e.target.scrollTop > 100);
  }, []);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Auto-hide toggle button
  useEffect(() => {
    const hideTimeout = setInterval(() => {
      const now = Date.now();
      if (now - lastMouseActivity > 2000) {
        setHideToggle(true);
      }
    }, 200);
    return () => clearInterval(hideTimeout);
  }, [lastMouseActivity]);

  return (
    <div className="flex h-full relative">
      {/* Resize Strip */}
      <div
        className={`w-1 bg-gray-200 hover:bg-indigo-500 cursor-col-resize
                   transition-colors duration-200 ${isResizing ? 'bg-indigo-600' : ''}`}
        onMouseDown={startResizing}
      >
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-8 bg-current opacity-50" />
      </div>

      {/* Panel Content */}
      <div 
        style={{ 
          width: isVisible ? `${width}px` : 0,
          transition: isResizing ? 'none' : 'width 0.3s ease'
        }}
        className="flex-shrink-0 overflow-hidden"
      >
        {/* Toggle Button */}
        <div
  className={`fixed right-0 z-[40] transition-opacity duration-300 ease-in-out
               ${hideToggle ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
               bottom-4`}
        >
          <div className="w-12 h-24 flex items-center justify-center">
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-200
                       flex items-center justify-center hover:bg-gray-50
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                       -translate-x-3"
            >
              {isVisible ? 
                <ChevronRight size={16} className="text-gray-600" /> : 
                <ChevronLeft size={16} className="text-gray-600" />
              }
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="h-full overflow-auto">
          {isVisible && children}
        </div>
      </div>
    </div>
  );
};

export default ResizableRightPanel;

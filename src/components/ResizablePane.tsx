import React, { useState, useCallback, useEffect, useRef } from 'react';

interface ResizablePaneProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  initialLeftWidth?: number; // Percentage (0-100)
  minLeftWidth?: number; // Percentage
  maxLeftWidth?: number; // Percentage
  className?: string;
  onResize?: (leftWidth: number) => void;
}

const ResizablePane: React.FC<ResizablePaneProps> = ({
  leftPane,
  rightPane,
  initialLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  className = '',
  onResize
}) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Clamp the width between min and max
    const clampedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newLeftWidth));
    
    setLeftWidth(clampedWidth);
    onResize?.(clampedWidth);
  }, [isResizing, minLeftWidth, maxLeftWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className={`flex h-full ${className}`}>
      {/* Left Pane */}
      <div 
        style={{ width: `${leftWidth}%` }}
        className="flex-shrink-0 overflow-hidden"
      >
        {leftPane}
      </div>

      {/* Resizer */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex-shrink-0 relative group ${
          isResizing ? 'bg-blue-400' : ''
        }`}
      >
        {/* Visual indicator */}
        <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Hover area for easier grabbing */}
        <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
      </div>

      {/* Right Pane */}
      <div 
        style={{ width: `${100 - leftWidth}%` }}
        className="flex-shrink-0 overflow-hidden"
      >
        {rightPane}
      </div>
    </div>
  );
};

export default ResizablePane;

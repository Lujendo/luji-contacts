import React, { useState, useEffect, useCallback, ReactNode, MouseEvent } from 'react';

// Component props interface
interface ResizableMainPanelProps {
  children: ReactNode;
  onRightResize?: (width: number) => void;
}

const ResizableMainPanel: React.FC<ResizableMainPanelProps> = ({ 
  children, 
  onRightResize 
}) => {
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false);
  const [marginRight, setMarginRight] = useState<number>(800); // Match right panel default width

  const startResizingRight = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizingRight(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizingRight(false);
    localStorage.setItem('mainPanelMarginRight', marginRight.toString());
  }, [marginRight]);

  const resize = useCallback((e: globalThis.MouseEvent) => {
    if (isResizingRight) {
      const windowWidth = window.innerWidth;
      const newMargin = windowWidth - e.clientX;
      if (newMargin >= 500 && newMargin <= 1200) { // Match right panel min/max
        setMarginRight(newMargin);
        if (onRightResize) {
          onRightResize(newMargin); // Notify parent about resize
        }
      }
    }
  }, [isResizingRight, onRightResize]);

  // Load saved width from localStorage on mount
  useEffect(() => {
    const savedRight = localStorage.getItem('mainPanelMarginRight');
    if (savedRight) {
      const parsedRight = parseInt(savedRight, 10);
      if (parsedRight >= 500 && parsedRight <= 1200) {
        setMarginRight(parsedRight);
      }
    }
  }, []);

  // Add/remove event listeners for resizing
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => resize(e);
    const handleMouseUp = () => stopResizing();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resize, stopResizing]);

  return (
    <div className="flex h-full relative">
      {/* Main content with dynamic margin */}
      <div 
        className="flex-1 bg-white"
        style={{ marginRight: `${marginRight}px` }}
      >
        {children}
      </div>

      {/* Right resize handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400 transition-colors ${
          isResizingRight ? 'bg-indigo-500' : ''
        }`}
        style={{ right: `${marginRight - 2}px` }}
        onMouseDown={startResizingRight}
        title="Drag to resize panel"
      />
    </div>
  );
};

export default ResizableMainPanel;

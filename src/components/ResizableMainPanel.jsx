import React, { useState, useEffect, useCallback } from 'react';

const ResizableMainPanel = ({ children, onRightResize }) => {
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [marginRight, setMarginRight] = useState(800); // Match right panel default width

  const startResizingRight = useCallback((e) => {
    e.preventDefault();
    setIsResizingRight(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizingRight(false);
    localStorage.setItem('mainPanelMarginRight', marginRight.toString());
  }, [marginRight]);

  const resize = useCallback((e) => {
    if (isResizingRight) {
      const windowWidth = window.innerWidth;
      const newMargin = windowWidth - e.clientX;
      if (newMargin >= 500 && newMargin <= 1200) { // Match right panel min/max
        setMarginRight(newMargin);
        onRightResize && onRightResize(newMargin); // Notify parent about resize
      }
    }
  }, [isResizingRight, onRightResize]);

  useEffect(() => {
    const savedRight = localStorage.getItem('mainPanelMarginRight');
    if (savedRight) {
      const parsedRight = parseInt(savedRight, 10);
      if (parsedRight >= 500 && parsedRight <= 1200) {
        setMarginRight(parsedRight);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);

    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="flex h-full relative">
      {/* Main content with dynamic margin */}
      <div
        className="flex-1 flex flex-col relative"
        style={{
          marginRight: `${marginRight}px`
        }}
      >
        {children}
      </div>

      {/* Right resize handle */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-gray-200 
                   hover:bg-indigo-500 active:bg-indigo-600 transition-colors duration-200
                   flex items-center justify-center z-10
                   ${isResizingRight ? 'bg-indigo-600' : ''}`}
        onMouseDown={startResizingRight}
      >
        <div className="w-0.5 h-8 bg-current opacity-50" />
      </div>
    </div>
  );
};

export default ResizableMainPanel;
import { useState, useEffect, useCallback, useMemo } from 'react';

export interface VirtualScrollingOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside visible area
  totalItems: number;
}

export interface VirtualScrollingResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  totalHeight: number;
  offsetY: number;
  scrollToIndex: (index: number) => void;
}

export const useVirtualScrolling = (
  options: VirtualScrollingOptions
): VirtualScrollingResult => {
  const { itemHeight, containerHeight, overscan = 5, totalItems } = options;
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      totalItems - 1
    );

    const startIndex = Math.max(0, visibleStart - overscan);
    const endIndex = Math.min(totalItems - 1, visibleEnd + overscan);

    return {
      startIndex,
      endIndex,
      visibleItems: endIndex - startIndex + 1
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, totalItems]);

  const totalHeight = totalItems * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = index * itemHeight;
    setScrollTop(targetScrollTop);
  }, [itemHeight]);

  return {
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    visibleItems: visibleRange.visibleItems,
    totalHeight,
    offsetY,
    scrollToIndex
  };
};

// Hook for handling scroll events
export const useScrollHandler = (
  onScroll: (scrollTop: number) => void,
  throttleMs: number = 16 // ~60fps
) => {
  const [isThrottled, setIsThrottled] = useState(false);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (isThrottled) return;

    setIsThrottled(true);
    const scrollTop = event.currentTarget.scrollTop;
    onScroll(scrollTop);

    setTimeout(() => {
      setIsThrottled(false);
    }, throttleMs);
  }, [onScroll, throttleMs, isThrottled]);

  return handleScroll;
};

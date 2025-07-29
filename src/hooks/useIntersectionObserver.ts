import { useRef, useEffect } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useIntersectionObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: UseIntersectionObserverOptions = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(callback);
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '100px',
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};

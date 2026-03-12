"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook that triggers a CSS class when the element scrolls into view.
 * Re-triggers on every client-side navigation (App Router).
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options?: { threshold?: number; rootMargin?: string; once?: boolean }
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { threshold = 0.15, rootMargin = "0px 0px -40px 0px", once = true } = options || {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset visibility on mount (handles client-side navigation)
    setIsVisible(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}

/**
 * Wrapper component-style hook for stagger-animated children.
 * Returns ref + className to apply.
 */
export function useStaggerAnimation<T extends HTMLElement = HTMLDivElement>(
  options?: { threshold?: number; rootMargin?: string }
) {
  const { ref, isVisible } = useScrollAnimation<T>(options);
  return { ref, isVisible, className: isVisible ? "stagger-animate" : "stagger-hidden" };
}

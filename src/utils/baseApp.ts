/**
 * Base App Detection and Optimization Utilities
 * 
 * Provides functions to detect when the app is running inside Base App
 * and apply appropriate optimizations for mobile experience.
 */

export interface BaseAppContext {
  isBaseApp: boolean;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  hasBaseAppAPI: boolean;
  hasFarcasterAPI: boolean;
}

/**
 * Detects if app is running inside Base App
 * 
 * Checks multiple indicators:
 * - User agent contains 'BaseApp'
 * - window.baseApp property exists
 * - window.farcaster property exists
 */
export function isBaseApp(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check user agent
  const userAgent = navigator.userAgent || '';
  if (userAgent.includes('BaseApp')) {
    return true;
  }

  // Check for Base App specific properties
  if ('baseApp' in window) {
    return true;
  }

  // Check for Farcaster API (indicates Base App or Farcaster client)
  if ('farcaster' in window) {
    return true;
  }

  return false;
}

/**
 * Gets detailed Base App context information
 */
export function getBaseAppContext(): BaseAppContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const inBaseApp = isBaseApp();

  return {
    isBaseApp: inBaseApp,
    userAgent: navigator.userAgent || '',
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    hasBaseAppAPI: 'baseApp' in window,
    hasFarcasterAPI: 'farcaster' in window,
  };
}

/**
 * Applies Base App specific optimizations
 * 
 * Optimizations include:
 * - Disabling pull-to-refresh
 * - Disabling tap highlight
 * - Disabling touch callout
 * - Preventing text selection during gameplay
 * - Setting overscroll behavior
 */
export function optimizeForBaseApp(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!isBaseApp()) {
    return;
  }

  const body = document.body;

  // Add Base App class for CSS targeting
  body.classList.add('base-app');

  // Disable pull-to-refresh
  body.style.overscrollBehavior = 'none';
  body.style.webkitOverscrollBehavior = 'none';

  // Disable tap highlight
  body.style.webkitTapHighlightColor = 'transparent';
  body.style.tapHighlightColor = 'transparent';

  // Disable touch callout (long-press menu on iOS)
  body.style.webkitTouchCallout = 'none';

  // Prevent text selection during gameplay
  body.style.userSelect = 'none';
  body.style.webkitUserSelect = 'none';
  body.style.msUserSelect = 'none';
  body.style.mozUserSelect = 'none';

  // Optimize touch scrolling
  body.style.webkitOverflowScrolling = 'touch';

  console.log('✓ Base App optimizations applied');
}

/**
 * Removes Base App optimizations
 * Useful for testing or when switching contexts
 */
export function removeBaseAppOptimizations(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const body = document.body;

  // Remove Base App class
  body.classList.remove('base-app');

  // Reset styles
  body.style.overscrollBehavior = '';
  body.style.webkitOverscrollBehavior = '';
  body.style.webkitTapHighlightColor = '';
  body.style.tapHighlightColor = '';
  body.style.webkitTouchCallout = '';
  body.style.userSelect = '';
  body.style.webkitUserSelect = '';
  body.style.msUserSelect = '';
  body.style.mozUserSelect = '';
  body.style.webkitOverflowScrolling = '';

  console.log('✓ Base App optimizations removed');
}

/**
 * Initialize Base App detection and optimizations
 * Call this once when the app starts
 */
export function initBaseApp(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const context = getBaseAppContext();

  if (context?.isBaseApp) {
    console.log('🎯 Base App detected:', context);
    optimizeForBaseApp();
  } else {
    console.log('🌐 Running in standard browser');
  }
}

/**
 * Hook for React components to detect Base App
 * Returns true if running in Base App
 */
export function useIsBaseApp(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return isBaseApp();
}

/**
 * Check if device prefers reduced motion
 * Useful for accessibility and performance
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Get optimal animation duration based on context
 * Returns shorter duration in Base App for better performance
 */
export function getAnimationDuration(defaultMs: number): number {
  if (prefersReducedMotion()) {
    return 0;
  }

  if (isBaseApp()) {
    // Reduce animation duration by 25% in Base App for better performance
    return Math.floor(defaultMs * 0.75);
  }

  return defaultMs;
}

/**
 * Check if device is in portrait orientation
 */
export function isPortrait(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.innerHeight > window.innerWidth;
}

/**
 * Check if device is mobile-sized
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth < 768;
}

/**
 * Get safe area insets for notched devices
 * Returns padding values for safe areas
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('--sat') || '0'),
    right: parseInt(style.getPropertyValue('--sar') || '0'),
    bottom: parseInt(style.getPropertyValue('--sab') || '0'),
    left: parseInt(style.getPropertyValue('--sal') || '0'),
  };
}


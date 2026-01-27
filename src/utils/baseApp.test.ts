import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isBaseApp,
  getBaseAppContext,
  optimizeForBaseApp,
  removeBaseAppOptimizations,
  prefersReducedMotion,
  getAnimationDuration,
  isPortrait,
  isMobileViewport,
} from './baseApp';

describe('baseApp utilities', () => {
  describe('isBaseApp', () => {
    it('returns false in standard browser', () => {
      expect(isBaseApp()).toBe(false);
    });

    it('returns true when BaseApp in user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 BaseApp/1.0',
        configurable: true,
      });
      expect(isBaseApp()).toBe(true);
    });

    it('returns true when window.baseApp exists', () => {
      (window as any).baseApp = {};
      expect(isBaseApp()).toBe(true);
      delete (window as any).baseApp;
    });

    it('returns true when window.farcaster exists', () => {
      (window as any).farcaster = {};
      expect(isBaseApp()).toBe(true);
      delete (window as any).farcaster;
    });
  });

  describe('getBaseAppContext', () => {
    beforeEach(() => {
      // Reset user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0',
        configurable: true,
      });
      // Clean up window properties
      delete (window as any).baseApp;
      delete (window as any).farcaster;
    });

    it('returns context with isBaseApp false in standard browser', () => {
      const context = getBaseAppContext();
      expect(context).toBeDefined();
      expect(context?.isBaseApp).toBe(false);
    });

    it('returns context with viewport dimensions', () => {
      const context = getBaseAppContext();
      expect(context?.viewport).toBeDefined();
      expect(context?.viewport.width).toBeGreaterThan(0);
      expect(context?.viewport.height).toBeGreaterThan(0);
    });

    it('returns context with API availability', () => {
      const context = getBaseAppContext();
      expect(context?.hasBaseAppAPI).toBeDefined();
      expect(context?.hasFarcasterAPI).toBeDefined();
    });
  });

  describe('optimizeForBaseApp', () => {
    beforeEach(() => {
      // Mock Base App environment
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 BaseApp/1.0',
        configurable: true,
      });
    });

    afterEach(() => {
      removeBaseAppOptimizations();
    });

    it('adds base-app class to body', () => {
      optimizeForBaseApp();
      expect(document.body.classList.contains('base-app')).toBe(true);
    });

    it('sets overscroll behavior', () => {
      optimizeForBaseApp();
      expect(document.body.style.overscrollBehavior).toBe('none');
    });

    it('disables tap highlight', () => {
      optimizeForBaseApp();
      expect(document.body.style.webkitTapHighlightColor).toBe('transparent');
    });

    it('disables touch callout', () => {
      optimizeForBaseApp();
      expect(document.body.style.webkitTouchCallout).toBe('none');
    });

    it('prevents text selection', () => {
      optimizeForBaseApp();
      expect(document.body.style.userSelect).toBe('none');
    });
  });

  describe('removeBaseAppOptimizations', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 BaseApp/1.0',
        configurable: true,
      });
      optimizeForBaseApp();
    });

    it('removes base-app class from body', () => {
      removeBaseAppOptimizations();
      expect(document.body.classList.contains('base-app')).toBe(false);
    });

    it('resets overscroll behavior', () => {
      removeBaseAppOptimizations();
      expect(document.body.style.overscrollBehavior).toBe('');
    });

    it('resets tap highlight', () => {
      removeBaseAppOptimizations();
      expect(document.body.style.webkitTapHighlightColor).toBe('');
    });
  });

  describe('prefersReducedMotion', () => {
    it('returns false when reduced motion not preferred', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      } as MediaQueryList);

      expect(prefersReducedMotion()).toBe(false);
    });

    it('returns true when reduced motion preferred', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
      } as MediaQueryList);

      expect(prefersReducedMotion()).toBe(true);
    });
  });

  describe('getAnimationDuration', () => {
    beforeEach(() => {
      // Reset user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0',
        configurable: true,
      });
    });

    it('returns 0 when reduced motion preferred', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
      } as MediaQueryList);

      expect(getAnimationDuration(300)).toBe(0);
    });

    it('returns reduced duration in Base App', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 BaseApp/1.0',
        configurable: true,
      });

      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      } as MediaQueryList);

      expect(getAnimationDuration(300)).toBe(225); // 75% of 300
    });

    it('returns default duration in standard browser', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      } as MediaQueryList);

      expect(getAnimationDuration(300)).toBe(300);
    });
  });

  describe('isPortrait', () => {
    it('returns true when height > width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
      expect(isPortrait()).toBe(true);
    });

    it('returns false when width > height', () => {
      Object.defineProperty(window, 'innerWidth', { value: 667, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 375, configurable: true });
      expect(isPortrait()).toBe(false);
    });
  });

  describe('isMobileViewport', () => {
    it('returns true for mobile width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      expect(isMobileViewport()).toBe(true);
    });

    it('returns false for desktop width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
      expect(isMobileViewport()).toBe(false);
    });

    it('returns false at exactly 768px', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });
      expect(isMobileViewport()).toBe(false);
    });
  });
});

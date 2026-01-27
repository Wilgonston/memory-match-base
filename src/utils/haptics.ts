/**
 * Haptic Feedback Utility
 * 
 * Provides haptic feedback for touch interactions on mobile devices.
 * Checks for API availability and gracefully degrades if not supported.
 * 
 * Requirements: 15.7
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

/**
 * Check if haptic feedback is available
 */
export function isHapticAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    'navigator' in window &&
    'vibrate' in navigator
  );
}

/**
 * Trigger haptic feedback
 * 
 * @param style - The style of haptic feedback
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (!isHapticAvailable()) {
    return;
  }

  // Map styles to vibration patterns (in milliseconds)
  const patterns: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    selection: 5,
    success: [10, 50, 10],
    warning: [20, 100, 20],
    error: [30, 100, 30, 100, 30],
  };

  const pattern = patterns[style];

  try {
    if (Array.isArray(pattern)) {
      navigator.vibrate(pattern);
    } else {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Trigger haptic feedback for card flip
 */
export function hapticCardFlip(): void {
  triggerHaptic('light');
}

/**
 * Trigger haptic feedback for match
 */
export function hapticMatch(): void {
  triggerHaptic('success');
}

/**
 * Trigger haptic feedback for button press
 */
export function hapticButtonPress(): void {
  triggerHaptic('medium');
}

/**
 * Trigger haptic feedback for level complete
 */
export function hapticLevelComplete(): void {
  triggerHaptic('success');
}

/**
 * Trigger haptic feedback for error
 */
export function hapticError(): void {
  triggerHaptic('error');
}

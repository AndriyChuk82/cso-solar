/**
 * Haptic feedback utility for mobile devices
 * Provides tactile feedback for user interactions
 */

/**
 * Trigger a light haptic feedback (for taps, selections)
 */
export function hapticLight() {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

/**
 * Trigger a medium haptic feedback (for confirmations, saves)
 */
export function hapticMedium() {
  if (navigator.vibrate) {
    navigator.vibrate(20);
  }
}

/**
 * Trigger a strong haptic feedback (for errors, important actions)
 */
export function hapticStrong() {
  if (navigator.vibrate) {
    navigator.vibrate([30, 10, 30]);
  }
}

/**
 * Trigger a success pattern (for completed actions)
 */
export function hapticSuccess() {
  if (navigator.vibrate) {
    navigator.vibrate([10, 5, 10]);
  }
}

/**
 * Trigger an error pattern (for failed actions)
 */
export function hapticError() {
  if (navigator.vibrate) {
    navigator.vibrate([50, 20, 50, 20, 50]);
  }
}

/**
 * Reduced Motion Utilities
 * 
 * Utilities for handling reduced motion preferences.
 * Ensures all animations respect accessibility settings.
 */

import { useReducedMotion as useSystemReducedMotion } from '@/hooks/useReducedMotion';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Check if reduced motion is enabled
 * Combines system preference with app-level setting
 */
export const useReducedMotion = () => {
  const systemReducedMotion = useSystemReducedMotion();
  return systemReducedMotion;
};

/**
 * Check if animations should be simplified
 */
export const useSimplifiedMotion = () => {
  return useSettingsStore((state) => state.settings.reducedMotion);
};

/**
 * Get motion intensity level
 */
export const useMotionIntensity = () => {
  return useSettingsStore((state) => state.settings.reducedMotion) ? 'none' : 'normal';
};

/**
 * Check if haptics are enabled
 */
export const useHapticsEnabled = () => {
  return useSettingsStore((state) => state.settings.hapticFeedbackEnabled);
};

/**
 * Check if specific animation type should run
 */
export const useAnimationEnabled = (type: 'focus' | 'orientation' | 'state' | 'delight') => {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) {
    return false;
  }
  return Boolean(type);
};

/**
 * Get animation duration multiplier
 */
export const useDurationMultiplier = () => {
  return useSettingsStore((state) => state.settings.reducedMotion) ? 0 : 1;
};

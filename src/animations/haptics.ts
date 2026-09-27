/**
 * Haptic Utilities
 * 
 * Centralized haptic feedback using expo-haptics.
 * Haptics are used sparingly and intentionally.
 */

import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { HapticPattern } from '@/types/accessibility';

/**
 * Check if haptics are enabled
 */
export function areHapticsEnabled(): boolean {
  return useSettingsStore.getState().settings.hapticFeedbackEnabled;
}

/**
 * Get haptic intensity
 */
function getHapticIntensity(): Haptics.ImpactFeedbackStyle {
  return Haptics.ImpactFeedbackStyle.Medium;
}

/**
 * Soft impact haptic - for gentle confirmations
 */
export const softImpact = () => {
  if (!areHapticsEnabled()) return;
  
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Medium impact haptic - for standard confirmations
 */
export const mediumImpact = () => {
  if (!areHapticsEnabled()) return;
  
  Haptics.impactAsync(getHapticIntensity());
};

/**
 * Strong impact haptic - for important completions
 */
export const strongImpact = () => {
  if (!areHapticsEnabled()) return;
  
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Selection haptic - for selection feedback
 */
export const selectionHaptic = () => {
  if (!areHapticsEnabled()) return;
  
  Haptics.selectionAsync();
};

/**
 * Success notification haptic
 */
export const successHaptic = () => {
  if (!areHapticsEnabled()) return;
  
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Warning notification haptic
 */
export const warningHaptic = () => {
  if (!areHapticsEnabled()) return;
  
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Error notification haptic
 */
export const errorHaptic = () => {
  if (!areHapticsEnabled()) return;
  
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Onboarding progression haptic - gentle feedback
 */
export const onboardingProgressHaptic = () => {
  if (!areHapticsEnabled()) return;
  
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Onboarding completion haptic - warm completion feedback
 */
export const onboardingCompleteHaptic = () => {
  if (!areHapticsEnabled()) return;
  
  // Sequence: soft impact + success notification
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).then(() => {
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 100);
  });
};

/**
 * Task completion haptic
 */
export const taskCompleteHaptic = () => {
  if (!areHapticsEnabled()) return;
  
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Generic haptic trigger based on pattern
 */
export const triggerHaptic = (pattern: HapticPattern) => {
  if (!areHapticsEnabled()) return;
  
  switch (pattern.type) {
    case 'impact':
      const impactStyle = pattern.style === 'light'
        ? Haptics.ImpactFeedbackStyle.Light
        : pattern.style === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium;
      Haptics.impactAsync(impactStyle);
      break;
      
    case 'notification':
      const notificationStyle = pattern.style === 'warning'
        ? Haptics.NotificationFeedbackType.Warning
        : pattern.style === 'error'
        ? Haptics.NotificationFeedbackType.Error
        : Haptics.NotificationFeedbackType.Success;
      Haptics.notificationAsync(notificationStyle);
      break;
      
    case 'selection':
      Haptics.selectionAsync();
      break;
  }
};

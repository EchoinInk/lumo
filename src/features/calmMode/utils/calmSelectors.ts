/**
 * Calm Mode Selectors
 *
 * Selector utilities for Calm Mode state.
 * These provide efficient memoized access to calm mode state.
 */

import { useCalmModeStore } from '../store/useCalmModeStore';

type CalmModeStoreState = ReturnType<typeof useCalmModeStore.getState>;

/**
 * Select whether calm mode is enabled.
 */
export const selectIsCalmModeEnabled = (state: CalmModeStoreState) => state.isCalmModeEnabled;

/**
 * Select the current environmental intensity.
 */
export const selectEnvironmentalIntensity = (state: CalmModeStoreState) => state.environmentalIntensity;

/**
 * Select whether reduced motion is enabled.
 */
export const selectReducedMotionEnabled = (state: CalmModeStoreState) => state.reducedMotionEnabled;

/**
 * Select whether softened gradients are enabled.
 */
export const selectSoftenedGradientsEnabled = (state: CalmModeStoreState) => state.softenedGradientsEnabled;

/**
 * Select whether decorative elements are reduced.
 */
export const selectReducedDecorativeElements = (state: CalmModeStoreState) => state.reducedDecorativeElements;

/**
 * Select whether reduced contrast mode is enabled.
 */
export const selectReducedContrastMode = (state: CalmModeStoreState) => state.reducedContrastMode;

/**
 * Select the last enabled timestamp.
 */
export const selectLastEnabledAt = (state: CalmModeStoreState) => state.lastEnabledAt;

/**
 * Short-lived, in-memory permission to complete a password recovery.
 *
 * This deliberately is not persisted: reopening the app after an interrupted
 * recovery requires the user to open a fresh recovery link. Tokens remain in
 * Supabase's secure session storage and are never copied into this guard.
 */
let recoverySessionActive = false;

export function beginRecoverySession(): void {
  recoverySessionActive = true;
}

export function hasRecoverySession(): boolean {
  return recoverySessionActive;
}

export function clearRecoverySession(): void {
  recoverySessionActive = false;
}

/**
 * Supabase Auth Layer
 *
 * Public API for Supabase auth integration.
 * All Supabase-specific code is isolated in this directory.
 *
 * Import from here:
 *   import { getCurrentSession, signOutSession } from '@/services/api/auth';
 *
 * Never import Supabase SDK directly outside this layer.
 */

// Re-export auth configuration
export {
    getSupabaseConfig,
    isSupabaseConfigured,
    resetAuthConfig
} from "./auth.config";

// Re-export auth session operations
export {
    establishSessionFromAuthCallback, getAuthCallbackIntent, getCurrentSession,
    refreshSession, restorePersistedSession, sendPasswordRecoveryEmail, signInWithEmailPassword, signOutSession, signUpWithEmailPassword, subscribeToAuthChanges, updatePasswordFromRecoverySession
} from "./supabaseAuth.session";

// Re-export auth mappers
export {
    extractCloudOwnerId,
    extractEmail, mapSupabaseSessionToAuthUser, mapSupabaseSessionToRepositoryContext, mapSupabaseUserToAuthUser
} from "./supabaseAuth.mapper";

// Re-export types (for internal use only)
export type {
    SupabaseAuthConfig, SupabaseAuthError,
    SupabaseAuthResult, SupabaseAuthSession
} from "./supabaseAuth.types";

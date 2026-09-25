import {
  getStorageAdapter,
  StorageNamespaces,
} from "./storageAdapter";

/**
 * MMKV Storage Instance
 *
 * Centralized MMKV storage instance for the application.
 * Initialized once to avoid duplication and ensure consistency.
 * Web-safe: uses localStorage fallback on web platform.
 */
export const storageInstance = getStorageAdapter(StorageNamespaces.DEFAULT);

/**
 * Get a string value from storage
 */
export const getString = (key: string): string | undefined => {
  return storageInstance.getString(key);
};

/**
 * Set a string value in storage
 */
export const setString = (key: string, value: string): void => {
  storageInstance.set(key, value);
};

/**
 * Get a number value from storage
 */
export const getNumber = (key: string): number | undefined => {
  return storageInstance.getNumber(key);
};

/**
 * Set a number value in storage
 */
export const setNumber = (key: string, value: number): void => {
  storageInstance.set(key, value);
};

/**
 * Get a boolean value from storage
 */
export const getBool = (key: string): boolean | undefined => {
  return storageInstance.getBoolean(key);
};

/**
 * Set a boolean value in storage
 */
export const setBool = (key: string, value: boolean): void => {
  storageInstance.set(key, value);
};

/**
 * Delete a key from storage
 */
export const deleteKey = (key: string): void => {
  storageInstance.remove(key);
};

/**
 * Clear all keys from storage
 */
export const clearAll = (): void => {
  storageInstance.clearAll();
};

/**
 * Check if a key exists in storage
 */
export const contains = (key: string): boolean => {
  return storageInstance.contains(key);
};

/**
 * Get all keys from storage
 */
export const getAllKeys = (): string[] => {
  return storageInstance.getAllKeys();
};

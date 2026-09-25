import {
  getStorageAdapter,
  StorageNamespaces,
} from "../services/storage/storageAdapter";

export const storageInstance = getStorageAdapter(StorageNamespaces.ZUSTAND);

export function getItem(key: string): string | null {
  if (!storageInstance) {
    return null;
  }

  return storageInstance.getString(key) ?? null;
}

export function setItem(key: string, value: string): void {
  if (!storageInstance) {
    return;
  }

  storageInstance.set(key, value);
}

export function removeItem(key: string): void {
  if (!storageInstance) {
    return;
  }

  storageInstance.remove(key);
}

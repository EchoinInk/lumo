import { Platform } from "react-native";

export const StorageNamespaces = {
  DEFAULT: "default",
  ZUSTAND: "lumo-storage",
} as const;

export type StorageNamespace =
  (typeof StorageNamespaces)[keyof typeof StorageNamespaces];

export interface StringStorageAdapter {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | number | boolean) => void;
  getNumber: (key: string) => number | undefined;
  getBoolean: (key: string) => boolean | undefined;
  remove: (key: string) => void;
  delete: (key: string) => void;
  clearAll: () => void;
  contains: (key: string) => boolean;
  getAllKeys: () => string[];
}

const WEB_NAMESPACE_PREFIX = "__lumo_mmkv__";
const memoryNamespaces = new Map<string, Map<string, string>>();
const adapterCache = new Map<string, StringStorageAdapter>();

function getMemoryNamespace(namespace: string): Map<string, string> {
  let values = memoryNamespaces.get(namespace);
  if (!values) {
    values = new Map<string, string>();
    memoryNamespaces.set(namespace, values);
  }
  return values;
}

function getBrowserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function getWebKey(namespace: string, key: string): string {
  if (namespace === StorageNamespaces.DEFAULT) {
    return key;
  }
  return `${WEB_NAMESPACE_PREFIX}${namespace}__${key}`;
}

function getWebPrefix(namespace: string): string {
  return namespace === StorageNamespaces.DEFAULT
    ? ""
    : `${WEB_NAMESPACE_PREFIX}${namespace}__`;
}

function isReservedWebKey(key: string): boolean {
  return key.startsWith(WEB_NAMESPACE_PREFIX);
}

function createWebAdapter(namespace: string): StringStorageAdapter {
  const fallback = getMemoryNamespace(namespace);

  const getString = (key: string): string | undefined => {
    const browserStorage = getBrowserStorage();
    if (!browserStorage) {
      return fallback.get(key);
    }
    return browserStorage.getItem(getWebKey(namespace, key)) ?? undefined;
  };

  const remove = (key: string) => {
    const browserStorage = getBrowserStorage();
    if (!browserStorage) {
      fallback.delete(key);
      return;
    }
    browserStorage.removeItem(getWebKey(namespace, key));
  };

  return {
    getString,
    set: (key, value) => {
      const stringValue = String(value);
      const browserStorage = getBrowserStorage();
      if (!browserStorage) {
        fallback.set(key, stringValue);
        return;
      }
      browserStorage.setItem(getWebKey(namespace, key), stringValue);
    },
    getNumber: (key) => {
      const value = getString(key);
      if (value === undefined) return undefined;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    },
    getBoolean: (key) => {
      const value = getString(key);
      if (value === undefined) return undefined;
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    },
    remove,
    delete: remove,
    clearAll: () => {
      const browserStorage = getBrowserStorage();
      if (!browserStorage) {
        fallback.clear();
        return;
      }
      const keys = Array.from(
        { length: browserStorage.length },
        (_, index) => browserStorage.key(index),
      ).filter((key): key is string => key !== null);
      const prefix = getWebPrefix(namespace);
      for (const key of keys) {
        const belongsToNamespace = prefix
          ? key.startsWith(prefix)
          : !isReservedWebKey(key);
        if (belongsToNamespace) {
          browserStorage.removeItem(key);
        }
      }
    },
    contains: (key) => getString(key) !== undefined,
    getAllKeys: () => {
      const browserStorage = getBrowserStorage();
      if (!browserStorage) {
        return Array.from(fallback.keys());
      }
      const prefix = getWebPrefix(namespace);
      return Array.from(
        { length: browserStorage.length },
        (_, index) => browserStorage.key(index),
      )
        .filter((key): key is string => key !== null)
        .filter((key) =>
          prefix ? key.startsWith(prefix) : !isReservedWebKey(key),
        )
        .map((key) => (prefix ? key.slice(prefix.length) : key));
    },
  };
}

function createNativeAdapter(namespace: string): StringStorageAdapter {
  const { createMMKV } = require("react-native-mmkv") as {
    createMMKV: (configuration?: { id: string }) => StringStorageAdapter;
  };

  const nativeStorage = namespace === StorageNamespaces.DEFAULT
    ? createMMKV()
    : createMMKV({ id: namespace });
  const remove = (key: string) => {
    if (typeof nativeStorage.remove === "function") {
      nativeStorage.remove(key);
      return;
    }
    nativeStorage.delete(key);
  };

  return {
    getString: (key) => nativeStorage.getString(key),
    set: (key, value) => nativeStorage.set(key, value),
    getNumber: (key) => nativeStorage.getNumber(key),
    getBoolean: (key) => nativeStorage.getBoolean(key),
    remove,
    delete: remove,
    clearAll: () => nativeStorage.clearAll(),
    contains: (key) => nativeStorage.contains(key),
    getAllKeys: () => nativeStorage.getAllKeys(),
  };
}

export function createStorageAdapter(
  namespace: StorageNamespace = StorageNamespaces.DEFAULT,
): StringStorageAdapter {
  if (Platform.OS === "web") {
    return createWebAdapter(namespace);
  }
  return createNativeAdapter(namespace);
}

export function getStorageAdapter(
  namespace: StorageNamespace = StorageNamespaces.DEFAULT,
): StringStorageAdapter {
  const existing = adapterCache.get(namespace);
  if (existing) return existing;

  const adapter = createStorageAdapter(namespace);
  adapterCache.set(namespace, adapter);
  return adapter;
}

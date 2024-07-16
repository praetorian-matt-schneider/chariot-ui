import { AuthState } from '@/types';
import { decode, encode } from '@/utils/encrypt.util';
import { PropertyPath } from '@/utils/lodash.util';
import { StorageKey } from '@/utils/storage/useStorage.util';

export const appStorageKey = 'appStorage';

function appStorageFn() {
  function getItem<T>(key: PropertyPath): T | undefined {
    const item = localStorage.getItem(getPropertyPathString(key)) || '';

    return decode<T>(item);
  }

  function setItem<T>(key: PropertyPath, value: T): void {
    localStorage.setItem(getPropertyPathString(key), encode(value));
  }

  function removeItem(key: PropertyPath) {
    localStorage.removeItem(getPropertyPathString(key));
  }

  function clear() {
    for (const key in localStorage) {
      if (localStorage.getItem(key) && key.startsWith(appStorageKey)) {
        localStorage.removeItem(key);
      }
    }
  }

  return {
    getItem,
    setItem,
    removeItem,
    clear,
  };
}

export const appStorage = appStorageFn();

function getPropertyPathString(propertyPath: PropertyPath): string {
  const authString =
    localStorage.getItem(`${appStorageKey}.${StorageKey.AUTH}`) || '';
  const auth = decode<AuthState>(authString);
  const user = auth?.friend?.email || auth?.me;

  if (propertyPath === StorageKey.AUTH) {
    return `${appStorageKey}.${StorageKey.AUTH}`;
  }

  if (Array.isArray(propertyPath)) {
    return [appStorageKey, user, ...propertyPath].join('.');
  }

  return `${appStorageKey}.${user}.${propertyPath.toString()}`;
}

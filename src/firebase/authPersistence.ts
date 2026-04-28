import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Persistence } from 'firebase/auth';

// Firebase 12에서 getReactNativePersistence 제거 → 내부 인터페이스 직접 구현
// SDK 내부 타입(PersistenceInternal)은 공개되지 않으므로 unknown을 거쳐 캐스팅
export const asyncStoragePersistence = {
  type: 'LOCAL',
  async _isAvailable() {
    try {
      await AsyncStorage.setItem('__probe__', '1');
      await AsyncStorage.removeItem('__probe__');
      return true;
    } catch {
      return false;
    }
  },
  async _set(key: string, value: string) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async _get(key: string) {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : null;
  },
  async _remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
  _addListener(_key: string, _listener: unknown) {},
  _removeListener(_key: string, _listener: unknown) {},
} as unknown as Persistence;

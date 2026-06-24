import { DatabaseState } from './db';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const CONFIG_KEY = 'firebase_sync_config';
const CENTER_ID_KEY = 'firebase_sync_center_id';
const AUTO_SYNC_KEY = 'firebase_sync_auto_enabled';
const LAST_SYNC_TIME_KEY = 'firebase_sync_last_time';

const isBrowser = typeof window !== 'undefined';

// --- Local Config Management Helpers ---

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  // 1. Try to load from environment variables first (Next.js env config)
  if (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  ) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined
    };
  }

  // 2. Fallback to localStorage for custom/runtime config
  if (!isBrowser) return null;
  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as FirebaseConfig;
  } catch (e) {
    return null;
  }
}

export function getSavedCenterId(): string {
  if (process.env.NEXT_PUBLIC_FIREBASE_CENTER_ID) {
    return process.env.NEXT_PUBLIC_FIREBASE_CENTER_ID;
  }
  if (!isBrowser) return 'toanl2k';
  return localStorage.getItem(CENTER_ID_KEY) || 'toanl2k';
}

export function isAutoSyncEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    // Default to true if env is set, unless explicitly turned off
    if (!isBrowser) return true;
    const stored = localStorage.getItem(AUTO_SYNC_KEY);
    return stored !== 'false';
  }
  if (!isBrowser) return false;
  const stored = localStorage.getItem(AUTO_SYNC_KEY);
  return stored === 'true'; // Default to false if not set
}

export function saveFirebaseConfig(config: FirebaseConfig, centerId: string, autoSync: boolean): void {
  if (!isBrowser) return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  localStorage.setItem(CENTER_ID_KEY, centerId.trim());
  localStorage.setItem(AUTO_SYNC_KEY, String(autoSync));
}

export function clearFirebaseConfig(): void {
  if (!isBrowser) return;
  localStorage.removeItem(CONFIG_KEY);
  localStorage.removeItem(CENTER_ID_KEY);
  localStorage.removeItem(AUTO_SYNC_KEY);
  localStorage.removeItem(LAST_SYNC_TIME_KEY);
}

export function getSavedLastSyncTime(): string {
  if (!isBrowser) return '';
  return localStorage.getItem(LAST_SYNC_TIME_KEY) || '';
}

export function saveLastSyncTime(timeIsoString: string): void {
  if (!isBrowser) return;
  localStorage.setItem(LAST_SYNC_TIME_KEY, timeIsoString);
}

// --- Firebase Initialization Engine ---

async function getFirestoreInstance(config: FirebaseConfig) {
  // Dynamically import to prevent SSR bundling issues in Next.js build
  // @ts-ignore
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  // @ts-ignore
  const { getFirestore, doc, setDoc, getDoc } = await import('firebase/firestore');

  const app = getApps().length === 0 ? initializeApp(config) : getApp();
  const db = getFirestore(app);
  return { db, doc, setDoc, getDoc };
}

// --- Firebase Synchronization API ---

/**
 * Đẩy toàn bộ trạng thái dữ liệu hiện tại lên Firestore dưới dạng một tài liệu (document)
 */
export async function pushToFirebase(centerId: string, state: DatabaseState, config: FirebaseConfig): Promise<void> {
  try {
    const { db, doc, setDoc } = await getFirestoreInstance(config);
    const centerDocRef = doc(db, 'centers', centerId);
    
    const updateTime = state.updatedAt || new Date().toISOString();
    const payload = {
      ...state,
      updatedAt: updateTime
    };

    await setDoc(centerDocRef, payload, { merge: false });
    saveLastSyncTime(updateTime);
    console.log('Đã đồng bộ thành công dữ liệu lên Firebase Firestore tại', updateTime);
  } catch (error) {
    console.error('Lỗi khi đồng bộ lên Firebase:', error);
    throw error;
  }
}

/**
 * Tải trạng thái dữ liệu mới nhất từ Firestore về
 */
export async function pullFromFirebase(centerId: string, config: FirebaseConfig): Promise<DatabaseState | null> {
  try {
    const { db, doc, getDoc } = await getFirestoreInstance(config);
    const centerDocRef = doc(db, 'centers', centerId);
    const docSnap = await getDoc(centerDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.updatedAt) {
        saveLastSyncTime(data.updatedAt);
      }
      return data as DatabaseState;
    }
    return null;
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu từ Firebase:', error);
    throw error;
  }
}

/**
 * Lắng nghe thay đổi thời gian thực từ Firestore
 * Trả về hàm unsubscribe để hủy lắng nghe khi unmount
 */
export async function subscribeToFirebase(
  centerId: string,
  config: FirebaseConfig,
  onUpdate: (state: DatabaseState) => void
): Promise<() => void> {
  try {
    const { db, doc } = await getFirestoreInstance(config);
    // @ts-ignore
    const { onSnapshot } = await import('firebase/firestore');
    const centerDocRef = doc(db, 'centers', centerId);
    
    const unsubscribe = onSnapshot(centerDocRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DatabaseState;
        onUpdate(data);
      }
    }, (error: any) => {
      console.error('Lỗi lắng nghe Firestore thời gian thực:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Không thể thiết lập lắng nghe thời gian thực:', error);
    return () => {};
  }
}

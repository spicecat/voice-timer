/**
 * IndexedDB persistence layer for cached audio buffers.
 * Enables instant offline voice & chime audio playback across sessions.
 */

const DB_NAME = 'VoiceTimerAudioCache';
const DB_VERSION = 1;
const STORE_NAME = 'audio_buffers';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (err) => {
        console.warn('Failed to open IndexedDB for audio caching:', err);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB error:', err);
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Retrieves cached ArrayBuffer from IndexedDB.
 */
export async function getCachedAudioArrayBuffer(
  key: string,
): Promise<ArrayBuffer | null> {
  const db = await getDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result instanceof ArrayBuffer) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Stores ArrayBuffer audio data into IndexedDB.
 */
export async function setCachedAudioArrayBuffer(
  key: string,
  buffer: ArrayBuffer,
): Promise<void> {
  const db = await getDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(buffer, key);

      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

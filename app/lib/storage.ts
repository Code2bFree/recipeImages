import type { HistoryItem } from "./types";

const KEY = "rpg_history_v1";

// We keep the full images out of localStorage (too small) and store them in IndexedDB.
const DB_NAME = "rpg_db_v1";
const DB_VERSION = 1;
const IMAGE_STORE = "images";

type StoredHistoryItem = Omit<HistoryItem, "imageDataUrl"> & {
  hasImage?: boolean;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPutImage(id: string, imageDataUrl: string) {
  const db = await openDb();
  const tx = db.transaction(IMAGE_STORE, "readwrite");
  const store = tx.objectStore(IMAGE_STORE);
  await txRequest(store.put({ id, imageDataUrl, updatedAt: Date.now() }));
  tx.commit?.();
}

async function idbGetImage(id: string): Promise<string | undefined> {
  const db = await openDb();
  const tx = db.transaction(IMAGE_STORE, "readonly");
  const store = tx.objectStore(IMAGE_STORE);
  const result = (await txRequest(store.get(id))) as
    | { id: string; imageDataUrl?: string }
    | undefined;
  return result?.imageDataUrl;
}

async function idbClearImages() {
  const db = await openDb();
  const tx = db.transaction(IMAGE_STORE, "readwrite");
  const store = tx.objectStore(IMAGE_STORE);
  await txRequest(store.clear());
  tx.commit?.();
}

function safeParseStoredHistory(raw: string): StoredHistoryItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredHistoryItem[];
  } catch {
    return [];
  }
}

function serializeForLocalStorage(items: HistoryItem[]): StoredHistoryItem[] {
  return items.map((it) => {
    const { imageDataUrl, ...rest } = it;
    return { ...rest, hasImage: Boolean(imageDataUrl) };
  });
}

function trySaveMetadataToLocalStorage(items: HistoryItem[]) {
  // localStorage is small (~5MB). Even metadata can grow, so we also cap the size.
  const MAX_ITEMS = 50;
  const clipped = items.slice(0, MAX_ITEMS);
  const payload = serializeForLocalStorage(clipped);

  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // If it still fails, keep fewer items.
    try {
      localStorage.setItem(KEY, JSON.stringify(payload.slice(0, 10)));
    } catch {
      // Give up silently; the app should still work.
    }
  }
}

function queueIdbImageWrites(items: HistoryItem[]) {
  // Fire-and-forget: store images in IndexedDB.
  for (const it of items) {
    if (it.status === "done" && it.imageDataUrl) {
      void idbPutImage(it.id, it.imageDataUrl).catch(() => {
        // ignore
      });
    }
  }
}

export async function loadHistory(): Promise<HistoryItem[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const stored = safeParseStoredHistory(raw);

    // Hydrate imageDataUrl from IndexedDB
    const hydrated = await Promise.all(
      stored.map(async (it) => {
        if (!it.hasImage) return it as HistoryItem;
        const imageDataUrl = await idbGetImage(it.id).catch(() => undefined);
        return { ...(it as HistoryItem), imageDataUrl };
      }),
    );

    return hydrated;
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  // Store metadata in localStorage (fast + small)
  trySaveMetadataToLocalStorage(items);

  // Store image bytes in IndexedDB (bigger quota)
  queueIdbImageWrites(items);
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);

  // Clear images in IndexedDB too
  void idbClearImages().catch(() => {
    // ignore
  });
}

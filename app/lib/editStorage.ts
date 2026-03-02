import type { EditHistoryItem } from "./editTypes";

const KEY = "rpg_edit_history_v1";

// Separate DB + store for editor so it remains isolated from recipe generator.
const DB_NAME = "rpg_edit_db_v1";
const DB_VERSION = 1;
const OUTPUT_STORE = "output_images";

type StoredEditHistoryItem = Omit<EditHistoryItem, "outputImageDataUrl"> & {
  hasOutputImage?: boolean;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OUTPUT_STORE)) {
        db.createObjectStore(OUTPUT_STORE, { keyPath: "id" });
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

async function idbPutOutputImage(id: string, outputImageDataUrl: string) {
  const db = await openDb();
  const tx = db.transaction(OUTPUT_STORE, "readwrite");
  const store = tx.objectStore(OUTPUT_STORE);
  await txRequest(store.put({ id, outputImageDataUrl, updatedAt: Date.now() }));
  tx.commit?.();
}

async function idbGetOutputImage(id: string): Promise<string | undefined> {
  const db = await openDb();
  const tx = db.transaction(OUTPUT_STORE, "readonly");
  const store = tx.objectStore(OUTPUT_STORE);
  const result = (await txRequest(store.get(id))) as
    | { id: string; outputImageDataUrl?: string }
    | undefined;
  return result?.outputImageDataUrl;
}

async function idbClearImages() {
  const db = await openDb();
  const tx = db.transaction(OUTPUT_STORE, "readwrite");
  const store = tx.objectStore(OUTPUT_STORE);
  await txRequest(store.clear());
  tx.commit?.();
}

function safeParseStoredHistory(raw: string): StoredEditHistoryItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredEditHistoryItem[];
  } catch {
    return [];
  }
}

function serializeForLocalStorage(items: EditHistoryItem[]): StoredEditHistoryItem[] {
  return items.map((it) => {
    const { outputImageDataUrl, ...rest } = it;
    return { ...rest, hasOutputImage: Boolean(outputImageDataUrl) };
  });
}

function trySaveMetadataToLocalStorage(items: EditHistoryItem[]) {
  const MAX_ITEMS = 50;
  const clipped = items.slice(0, MAX_ITEMS);
  const payload = serializeForLocalStorage(clipped);

  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(payload.slice(0, 10)));
    } catch {
      // ignore
    }
  }
}

function queueIdbImageWrites(items: EditHistoryItem[]) {
  for (const it of items) {
    if (it.status === "done" && it.outputImageDataUrl) {
      void idbPutOutputImage(it.id, it.outputImageDataUrl).catch(() => {
        // ignore
      });
    }
  }
}

export async function loadEditHistory(): Promise<EditHistoryItem[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const stored = safeParseStoredHistory(raw);

    const hydrated = await Promise.all(
      stored.map(async (it) => {
        if (!it.hasOutputImage) return it as EditHistoryItem;
        const outputImageDataUrl = await idbGetOutputImage(it.id).catch(
          () => undefined,
        );
        return { ...(it as EditHistoryItem), outputImageDataUrl };
      }),
    );

    return hydrated;
  } catch {
    return [];
  }
}

export function saveEditHistory(items: EditHistoryItem[]) {
  if (typeof window === "undefined") return;
  trySaveMetadataToLocalStorage(items);
  queueIdbImageWrites(items);
}

export function clearEditHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  void idbClearImages().catch(() => {
    // ignore
  });
}

import type { AppData } from "./types";
import { createDefaultAppData } from "./default-data";

type SessionStoreMap = Map<string, AppData>;

const globalStore = globalThis as typeof globalThis & {
  __promesasSessionStores?: SessionStoreMap;
};

function stores(): SessionStoreMap {
  if (!globalStore.__promesasSessionStores) {
    globalStore.__promesasSessionStores = new Map();
  }
  return globalStore.__promesasSessionStores;
}

/** Datos de la sesión en memoria (Vercel / fallback sin disco). */
export function getMemoryStore(sessionId: string): AppData {
  const map = stores();
  if (!map.has(sessionId)) {
    map.set(sessionId, createDefaultAppData());
  }
  return structuredClone(map.get(sessionId)!);
}

export function setMemoryStore(sessionId: string, data: AppData): void {
  stores().set(sessionId, structuredClone(data));
}

/** Limpia al cerrar sesión. */
export function clearMemoryStore(sessionId: string): void {
  stores().delete(sessionId);
}

export function isMemoryBackendForced(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.STORAGE_MODE === "memory"
  );
}

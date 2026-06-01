import { promises as fs } from "fs";
import path from "path";
import { getSessionStoreId } from "./auth";
import { createDefaultAppData } from "./default-data";
import {
  getMemoryStore,
  isMemoryBackendForced,
  setMemoryStore,
} from "./memory-store";
import type {
  AppData,
  ConfigNotificaciones,
  NotificacionLog,
  PromesaPago,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "app-data.json");

let fileStoreAvailable: boolean | null = null;

function useMemoryBackend(): boolean {
  if (isMemoryBackendForced()) return true;
  if (fileStoreAvailable === false) return true;
  return false;
}

async function readFileStore(): Promise<AppData> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    fileStoreAvailable = true;
    return JSON.parse(raw) as AppData;
  } catch {
    const data = createDefaultAppData();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    fileStoreAvailable = true;
    return data;
  }
}

async function writeFileStore(data: AppData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  fileStoreAvailable = true;
}

async function loadAppData(sessionId: string | null): Promise<AppData> {
  if (useMemoryBackend()) {
    if (!sessionId) return createDefaultAppData();
    return getMemoryStore(sessionId);
  }

  try {
    return await readFileStore();
  } catch {
    fileStoreAvailable = false;
    if (!sessionId) return createDefaultAppData();
    return getMemoryStore(sessionId);
  }
}

async function persistAppData(
  sessionId: string | null,
  data: AppData
): Promise<void> {
  if (useMemoryBackend()) {
    if (sessionId) setMemoryStore(sessionId, data);
    return;
  }

  try {
    await writeFileStore(data);
  } catch {
    fileStoreAvailable = false;
    if (sessionId) setMemoryStore(sessionId, data);
  }
}

async function withData<T>(
  fn: (data: AppData) => T | Promise<T>
): Promise<T> {
  const sessionId = await getSessionStoreId();
  const data = await loadAppData(sessionId);
  const result = await fn(data);
  await persistAppData(sessionId, data);
  return result;
}

async function withDataRead<T>(
  fn: (data: AppData) => T | Promise<T>
): Promise<T> {
  const sessionId = await getSessionStoreId();
  const data = await loadAppData(sessionId);
  return fn(data);
}

export async function getAppData(): Promise<AppData> {
  return withDataRead((d) => d);
}

export async function getPromesas(): Promise<PromesaPago[]> {
  const data = await getAppData();
  return data.promesas;
}

export async function addPromesa(promesa: PromesaPago): Promise<PromesaPago> {
  await withData((data) => {
    data.promesas.push(promesa);
  });
  return promesa;
}

export async function updatePromesa(
  id: string,
  patch: Partial<PromesaPago>
): Promise<PromesaPago | null> {
  let updated: PromesaPago | null = null;
  await withData((data) => {
    const idx = data.promesas.findIndex((p) => p.id === id);
    if (idx === -1) return;
    data.promesas[idx] = {
      ...data.promesas[idx],
      ...patch,
      actualizadoEn: new Date().toISOString(),
    };
    updated = data.promesas[idx];
  });
  return updated;
}

export async function getConfig(): Promise<ConfigNotificaciones> {
  const data = await getAppData();
  return data.config;
}

export async function setConfig(config: ConfigNotificaciones): Promise<void> {
  await withData((data) => {
    data.config = config;
  });
}

export async function addNotificacion(log: NotificacionLog): Promise<void> {
  await withData((data) => {
    data.notificaciones.unshift(log);
    if (data.notificaciones.length > 200) {
      data.notificaciones = data.notificaciones.slice(0, 200);
    }
  });
}

export async function getNotificaciones(): Promise<NotificacionLog[]> {
  const data = await getAppData();
  return data.notificaciones;
}

export function formatMonto(monto: number): string {
  return monto.toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatFecha(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

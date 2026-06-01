import { promises as fs } from "fs";
import path from "path";
import type { AppData, ConfigNotificaciones, PromesaPago, NotificacionLog } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "app-data.json");

const DEFAULT_CONFIG: ConfigNotificaciones = {
  recordatorioDiasAntes: 1,
  plantillaPromesa:
    "Hola {cliente}, le recordamos su compromiso de pago de L {monto} para el {fecha} con Inversiones Express. Crédito #{credito}.",
  plantillaRecordatorio:
    "Hola {cliente}, mañana vence su promesa de pago de L {monto} (crédito #{credito}). Por favor cumpla su compromiso.",
  whatsappSimulado: true,
};

function defaultData(): AppData {
  const hoy = new Date();
  const en3 = new Date(hoy);
  en3.setDate(en3.getDate() + 3);
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  const promesasSeed: PromesaPago[] = [
    {
      id: "seed-1",
      idCliente: 1042,
      idCredito: 3087,
      clienteNombre: "María Rodríguez López",
      telefono: "+504 9876-5432",
      montoPrometido: 1500,
      fechaCompromiso: en3.toISOString().slice(0, 10),
      diasRecordatorio: 1,
      estado: "pendiente",
      notas: "Cliente acordó abono parcial",
      creadoPor: "admin",
      creadoEn: hoy.toISOString(),
      actualizadoEn: hoy.toISOString(),
    },
    {
      id: "seed-2",
      idCliente: 1156,
      idCredito: 2914,
      clienteNombre: "José Martínez Hernández",
      telefono: "+504 3344-2211",
      montoPrometido: 2000,
      fechaCompromiso: ayer.toISOString().slice(0, 10),
      diasRecordatorio: 1,
      estado: "incumplida",
      creadoPor: "cobranza",
      creadoEn: hoy.toISOString(),
      actualizadoEn: hoy.toISOString(),
    },
  ];

  return {
    promesas: promesasSeed,
    notificaciones: [],
    config: DEFAULT_CONFIG,
  };
}

async function ensureDataFile(): Promise<AppData> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as AppData;
  } catch {
    const data = defaultData();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return data;
  }
}

async function save(data: AppData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getAppData(): Promise<AppData> {
  return ensureDataFile();
}

export async function getPromesas(): Promise<PromesaPago[]> {
  const data = await getAppData();
  return data.promesas;
}

export async function addPromesa(promesa: PromesaPago): Promise<PromesaPago> {
  const data = await getAppData();
  data.promesas.push(promesa);
  await save(data);
  return promesa;
}

export async function updatePromesa(
  id: string,
  patch: Partial<PromesaPago>
): Promise<PromesaPago | null> {
  const data = await getAppData();
  const idx = data.promesas.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  data.promesas[idx] = {
    ...data.promesas[idx],
    ...patch,
    actualizadoEn: new Date().toISOString(),
  };
  await save(data);
  return data.promesas[idx];
}

export async function getConfig(): Promise<ConfigNotificaciones> {
  const data = await getAppData();
  return data.config;
}

export async function setConfig(config: ConfigNotificaciones): Promise<void> {
  const data = await getAppData();
  data.config = config;
  await save(data);
}

export async function addNotificacion(log: NotificacionLog): Promise<void> {
  const data = await getAppData();
  data.notificaciones.unshift(log);
  if (data.notificaciones.length > 200) {
    data.notificaciones = data.notificaciones.slice(0, 200);
  }
  await save(data);
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

import {
  addNotificacion,
  getAppData,
  getConfig,
  updatePromesa,
} from "./store";
import type { NotificacionLog, PromesaPago } from "./types";
import { formatFecha, formatMonto } from "./store";

function plantilla(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (msg, [key, val]) => msg.replace(new RegExp(`\\{${key}\\}`, "g"), val),
    template
  );
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function yaNotificado(
  logs: { promesaId: string; tipo: string; enviadoEn: string }[],
  promesaId: string,
  tipo: string,
  fechaRef: string
): boolean {
  return logs.some(
    (l) =>
      l.promesaId === promesaId &&
      l.tipo === tipo &&
      l.enviadoEn.slice(0, 10) === fechaRef
  );
}

async function enviar(
  promesa: PromesaPago,
  tipo: NotificacionLog["tipo"],
  mensaje: string
): Promise<NotificacionLog> {
  const log: NotificacionLog = {
    id: crypto.randomUUID(),
    promesaId: promesa.id,
    tipo,
    telefono: promesa.telefono,
    mensaje,
    enviadoEn: new Date().toISOString(),
    estado: "enviado",
  };
  await addNotificacion(log);
  return log;
}

export async function procesarNotificacionesPendientes(): Promise<{
  procesadas: number;
  logs: NotificacionLog[];
}> {
  const data = await getAppData();
  const config = await getConfig();
  const hoy = hoyISO();
  const logs: NotificacionLog[] = [];
  let procesadas = 0;

  for (const promesa of data.promesas) {
    if (promesa.estado !== "pendiente") continue;

    const vars = {
      cliente: promesa.clienteNombre,
      monto: formatMonto(promesa.montoPrometido),
      fecha: formatFecha(promesa.fechaCompromiso),
      credito: String(promesa.idCredito),
    };

    const fechaRecordatorio = addDays(
      promesa.fechaCompromiso,
      -promesa.diasRecordatorio
    );

    if (
      hoy === fechaRecordatorio &&
      !yaNotificado(data.notificaciones, promesa.id, "recordatorio", hoy)
    ) {
      const msg = plantilla(config.plantillaRecordatorio, vars);
      logs.push(await enviar(promesa, "recordatorio", msg));
      procesadas++;
    }

    if (
      hoy === promesa.fechaCompromiso &&
      !yaNotificado(data.notificaciones, promesa.id, "fecha_promesa", hoy)
    ) {
      const msg = plantilla(config.plantillaPromesa, vars);
      logs.push(await enviar(promesa, "fecha_promesa", msg));
      procesadas++;
    }

    if (hoy > promesa.fechaCompromiso) {
      await updatePromesa(promesa.id, { estado: "incumplida" });
      if (
        !yaNotificado(data.notificaciones, promesa.id, "incumplimiento", hoy)
      ) {
        const msg = `Estimado/a ${promesa.clienteNombre}, su promesa de pago de L ${formatMonto(promesa.montoPrometido)} del ${formatFecha(promesa.fechaCompromiso)} no fue cumplida. Comuníquese con cobranza — Inversiones Express.`;
        logs.push(await enviar(promesa, "incumplimiento", msg));
        procesadas++;
      }
    }
  }

  return { procesadas, logs };
}

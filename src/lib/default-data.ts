import type { AppData, ConfigNotificaciones, PromesaPago } from "./types";

export const DEFAULT_CONFIG: ConfigNotificaciones = {
  recordatorioDiasAntes: 1,
  plantillaPromesa:
    "Hola {cliente}, le recordamos su compromiso de pago de L {monto} para el {fecha} con Inversiones Express. Crédito #{credito}.",
  plantillaRecordatorio:
    "Hola {cliente}, mañana vence su promesa de pago de L {monto} (crédito #{credito}). Por favor cumpla su compromiso.",
  whatsappSimulado: true,
};

export function createDefaultAppData(): AppData {
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
    config: { ...DEFAULT_CONFIG },
  };
}

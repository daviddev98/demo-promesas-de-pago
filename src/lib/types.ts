export type RolUsuario = "administrador" | "cobranza";

export type EstadoPromesa = "pendiente" | "cumplida" | "incumplida";

export interface Usuario {
  id: string;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
}

export interface ClienteMora {
  idCliente: number;
  nombre: string;
  apellido: string;
  identidad: string;
  telefono: string;
  diasMora: number;
  saldoMora: number;
  idCredito: number;
  numeroCredito: number;
  descripcionArticulo: string;
}

export interface PromesaPago {
  id: string;
  idCliente: number;
  idCredito: number;
  clienteNombre: string;
  telefono: string;
  montoPrometido: number;
  fechaCompromiso: string;
  diasRecordatorio: number;
  estado: EstadoPromesa;
  notas?: string;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ConfigNotificaciones {
  recordatorioDiasAntes: number;
  plantillaPromesa: string;
  plantillaRecordatorio: string;
  whatsappSimulado: boolean;
}

export interface NotificacionLog {
  id: string;
  promesaId: string;
  tipo: "recordatorio" | "fecha_promesa" | "incumplimiento";
  telefono: string;
  mensaje: string;
  enviadoEn: string;
  estado: "enviado" | "fallido";
}

export interface AppData {
  promesas: PromesaPago[];
  notificaciones: NotificacionLog[];
  config: ConfigNotificaciones;
}

export interface SessionPayload {
  user: Usuario;
  exp: number;
  /** Identificador del almacén en memoria (Vercel / fallback). */
  sid: string;
}

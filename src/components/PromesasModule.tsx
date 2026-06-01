"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ClienteMora,
  ConfigNotificaciones,
  EstadoPromesa,
  NotificacionLog,
  PromesaPago,
} from "@/lib/types";

type Tab = "panel" | "registrar" | "historial" | "config" | "notificaciones";

const ESTADOS: { value: EstadoPromesa | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "cumplida", label: "Cumplida" },
  { value: "incumplida", label: "Incumplida" },
];

function estadoBadge(estado: EstadoPromesa) {
  const map = {
    pendiente: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    cumplida: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    incumplida: "bg-red-500/20 text-red-300 border-red-500/40",
  };
  return map[estado];
}

function formatL(m: number) {
  return `L ${m.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
}

function formatF(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function PromesasModule() {
  const [tab, setTab] = useState<Tab>("panel");
  const [stats, setStats] = useState({
    total: 0,
    pendiente: 0,
    cumplida: 0,
    incumplida: 0,
    vencenHoy: 0,
    montoPendiente: 0,
  });
  const [promesas, setPromesas] = useState<PromesaPago[]>([]);
  const [clientes, setClientes] = useState<ClienteMora[]>([]);
  const [notificaciones, setNotificaciones] = useState<NotificacionLog[]>([]);
  const [config, setConfig] = useState<ConfigNotificaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<"file" | "memory" | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<EstadoPromesa | "">("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");

  const [form, setForm] = useState({
    idCliente: "",
    monto: "",
    fecha: "",
    diasRecordatorio: "1",
    notas: "",
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.set("estado", filtroEstado);
      if (filtroDesde) params.set("desde", filtroDesde);
      if (filtroHasta) params.set("hasta", filtroHasta);
      if (filtroCliente) params.set("idCliente", filtroCliente);

      const [s, p, c, n, cfg, meta] = await Promise.all([
        fetch("/api/promesas/stats").then((r) => r.json()),
        fetch(`/api/promesas?${params}`).then((r) => r.json()),
        fetch("/api/clientes-mora").then((r) => r.json()),
        fetch("/api/notificaciones").then((r) => r.json()),
        fetch("/api/config").then((r) => r.json()),
        fetch("/api/meta").then((r) => r.json()),
      ]);
      setStorageMode(meta.storageMode ?? "file");
      setStats(s.stats);
      setPromesas(p.promesas);
      setClientes(c.clientes);
      setNotificaciones(n.notificaciones);
      setConfig(cfg.config);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroDesde, filtroHasta, filtroCliente]);

  useEffect(() => {
    loadAll();
    fetch("/api/notificaciones/procesar", { method: "POST" }).then(() =>
      loadAll()
    );
  }, [loadAll]);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const cliente = clientes.find((c) => String(c.idCliente) === form.idCliente);
    if (!cliente) {
      setMsg("Seleccione un cliente en mora");
      return;
    }
    const res = await fetch("/api/promesas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idCliente: cliente.idCliente,
        idCredito: cliente.idCredito,
        montoPrometido: parseFloat(form.monto),
        fechaCompromiso: form.fecha,
        diasRecordatorio: parseInt(form.diasRecordatorio, 10),
        notas: form.notas || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Error al registrar");
      return;
    }
    setMsg("Promesa registrada correctamente");
    setForm({
      idCliente: "",
      monto: "",
      fecha: "",
      diasRecordatorio: "1",
      notas: "",
    });
    setTab("historial");
    loadAll();
  }

  async function cambiarEstado(id: string, estado: EstadoPromesa) {
    await fetch(`/api/promesas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    loadAll();
  }

  async function guardarConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setMsg("Configuración guardada");
    loadAll();
  }

  async function ejecutarMotor() {
    const res = await fetch("/api/notificaciones/procesar", { method: "POST" });
    const data = await res.json();
    setMsg(
      data.procesadas > 0
        ? `Motor ejecutado: ${data.procesadas} notificación(es) simulada(s)`
        : "Motor ejecutado: sin envíos pendientes para hoy"
    );
    loadAll();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "panel", label: "Panel" },
    { id: "registrar", label: "Nueva promesa" },
    { id: "historial", label: "Historial" },
    { id: "config", label: "Configuración" },
    { id: "notificaciones", label: "WhatsApp (simulado)" },
  ];

  const clienteSel = clientes.find((c) => String(c.idCliente) === form.idCliente);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">
          Control automatizado de promesas
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Registro, seguimiento y notificaciones WhatsApp para clientes en mora
        </p>
        {storageMode === "memory" && (
          <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Modo demo en la nube: los cambios se guardan en memoria por sesión y
            se borran al cerrar sesión.
          </p>
        )}
      </header>

      {msg && (
        <div className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-3 text-sm text-orange-200">
          {msg}
          <button
            type="button"
            className="ml-3 text-[var(--accent-muted)] underline"
            onClick={() => setMsg(null)}
          >
            cerrar
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Cargando datos...</p>
      )}

      {tab === "panel" && !loading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              { label: "Pendientes", value: stats.pendiente, color: "text-amber-300" },
              { label: "Cumplidas", value: stats.cumplida, color: "text-emerald-300" },
              { label: "Incumplidas", value: stats.incumplida, color: "text-red-300" },
              { label: "Vencen hoy", value: stats.vencenHoy, color: "text-sky-300" },
              {
                label: "Monto pendiente",
                value: formatL(stats.montoPendiente),
                color: "text-[#b86e00]",
                wide: true,
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`rounded-xl border border-white/10 bg-[#222428] p-4 ${
                  card.wide ? "sm:col-span-2" : ""
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {card.label}
                </p>
                <p className={`mt-2 text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setTab("registrar")}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              + Registrar promesa
            </button>
            <button
              type="button"
              onClick={ejecutarMotor}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
            >
              Ejecutar motor de notificaciones
            </button>
          </div>

          <section>
            <h3 className="mb-3 text-lg font-medium text-white">
              Promesas recientes
            </h3>
            <PromesaTable
              promesas={promesas.slice(0, 8)}
              onEstado={cambiarEstado}
            />
          </section>
        </div>
      )}

      {tab === "registrar" && (
        <form
          onSubmit={registrar}
          className="max-w-xl space-y-4 rounded-xl border border-white/10 bg-[#222428] p-6"
        >
          <h3 className="text-lg font-medium text-white">Nueva promesa de pago</h3>

          <label className="block text-sm">
            <span className="text-gray-400">Cliente en mora *</span>
            <select
              required
              value={form.idCliente}
              onChange={(e) => setForm({ ...form, idCliente: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-white"
            >
              <option value="">Seleccionar...</option>
              {clientes.map((c) => (
                <option key={c.idCliente} value={c.idCliente}>
                  {c.nombre} {c.apellido} — Crédito #{c.numeroCredito} ({c.diasMora}{" "}
                  días mora)
                </option>
              ))}
            </select>
          </label>

          {clienteSel && (
            <div className="rounded-lg bg-[#16181c] p-3 text-sm text-gray-300">
              <p>Saldo en mora: {formatL(clienteSel.saldoMora)}</p>
              <p>Teléfono WhatsApp: {clienteSel.telefono}</p>
              <p>Artículo: {clienteSel.descripcionArticulo}</p>
            </div>
          )}

          <label className="block text-sm">
            <span className="text-gray-400">Monto prometido (HNL) *</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-white"
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-400">Fecha de compromiso *</span>
            <input
              type="date"
              required
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-white"
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-400">
              Recordatorio (días antes del vencimiento)
            </span>
            <input
              type="number"
              min="0"
              max="30"
              value={form.diasRecordatorio}
              onChange={(e) =>
                setForm({ ...form, diasRecordatorio: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-white"
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-400">Notas</span>
            <textarea
              rows={2}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-white"
            />
          </label>

          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Guardar promesa
          </button>
        </form>
      )}

      {tab === "historial" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 rounded-xl border border-white/10 bg-[#222428] p-4">
            <select
              value={filtroEstado}
              onChange={(e) =>
                setFiltroEstado(e.target.value as EstadoPromesa | "")
              }
              className="rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-sm text-white"
            >
              {ESTADOS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              className="rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-sm text-white"
              title="Desde"
            />
            <input
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              className="rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-sm text-white"
              title="Hasta"
            />
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="min-w-[200px] rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-sm text-white"
            >
              <option value="">Todos los clientes</option>
              {clientes.map((c) => (
                <option key={c.idCliente} value={c.idCliente}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadAll}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Filtrar
            </button>
          </div>
          <PromesaTable promesas={promesas} onEstado={cambiarEstado} />
        </div>
      )}

      {tab === "config" && config && (
        <form
          onSubmit={guardarConfig}
          className="max-w-2xl space-y-4 rounded-xl border border-white/10 bg-[#222428] p-6"
        >
          <h3 className="text-lg font-medium text-white">
            Configuración de notificaciones
          </h3>
          <p className="text-sm text-gray-400">
            Variables: {"{cliente}"}, {"{monto}"}, {"{fecha}"}, {"{credito}"}
          </p>

          <label className="block text-sm">
            <span className="text-gray-400">Días de recordatorio por defecto</span>
            <input
              type="number"
              min="0"
              value={config.recordatorioDiasAntes}
              onChange={(e) =>
                setConfig({
                  ...config,
                  recordatorioDiasAntes: parseInt(e.target.value, 10),
                })
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-white"
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-400">Plantilla — día de la promesa</span>
            <textarea
              rows={3}
              value={config.plantillaPromesa}
              onChange={(e) =>
                setConfig({ ...config, plantillaPromesa: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-white"
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-400">Plantilla — recordatorio previo</span>
            <textarea
              rows={3}
              value={config.plantillaRecordatorio}
              onChange={(e) =>
                setConfig({ ...config, plantillaRecordatorio: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#16181c] px-3 py-2 text-white"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={config.whatsappSimulado}
              onChange={(e) =>
                setConfig({ ...config, whatsappSimulado: e.target.checked })
              }
            />
            Modo simulado (demo — no envía WhatsApp real)
          </label>

          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Guardar configuración
          </button>
        </form>
      )}

      {tab === "notificaciones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Historial de mensajes simulados enviados por el motor automático
            </p>
            <button
              type="button"
              onClick={ejecutarMotor}
              className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10"
            >
              Ejecutar motor ahora
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#16181c] text-gray-400">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Mensaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#222428]">
                {notificaciones.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Sin notificaciones aún. Ejecute el motor o espere fechas de
                      compromiso.
                    </td>
                  </tr>
                ) : (
                  notificaciones.map((n) => (
                    <tr key={n.id} className="text-gray-300">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(n.enviadoEn).toLocaleString("es-HN")}
                      </td>
                      <td className="px-4 py-3 capitalize">{n.tipo.replace("_", " ")}</td>
                      <td className="px-4 py-3">{n.telefono}</td>
                      <td className="max-w-md px-4 py-3 text-gray-400">{n.mensaje}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PromesaTable({
  promesas,
  onEstado,
}: {
  promesas: PromesaPago[];
  onEstado: (id: string, estado: EstadoPromesa) => void;
}) {
  if (promesas.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-[#222428] px-4 py-8 text-center text-gray-500">
        No hay promesas con los filtros seleccionados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="bg-[#16181c] text-gray-400">
          <tr>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Crédito</th>
            <th className="px-4 py-3">Monto</th>
            <th className="px-4 py-3">Compromiso</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-[#222428] text-gray-300">
          {promesas.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-white">{p.clienteNombre}</div>
                <div className="text-xs text-gray-500">{p.telefono}</div>
              </td>
              <td className="px-4 py-3">#{p.idCredito}</td>
              <td className="px-4 py-3">{formatL(p.montoPrometido)}</td>
              <td className="px-4 py-3">{formatF(p.fechaCompromiso)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-xs capitalize ${estadoBadge(p.estado)}`}
                >
                  {p.estado}
                </span>
              </td>
              <td className="px-4 py-3">
                {p.estado === "pendiente" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEstado(p.id, "cumplida")}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      Cumplida
                    </button>
                    <button
                      type="button"
                      onClick={() => onEstado(p.id, "incumplida")}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Incumplida
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

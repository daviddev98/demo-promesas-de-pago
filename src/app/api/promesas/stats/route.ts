import { NextResponse } from "next/server";
import { getPromesas } from "@/lib/store";

export async function GET() {
  const promesas = await getPromesas();
  const hoy = new Date().toISOString().slice(0, 10);

  const stats = {
    total: promesas.length,
    pendiente: promesas.filter((p) => p.estado === "pendiente").length,
    cumplida: promesas.filter((p) => p.estado === "cumplida").length,
    incumplida: promesas.filter((p) => p.estado === "incumplida").length,
    vencenHoy: promesas.filter(
      (p) => p.estado === "pendiente" && p.fechaCompromiso === hoy
    ).length,
    montoPendiente: promesas
      .filter((p) => p.estado === "pendiente")
      .reduce((s, p) => s + p.montoPrometido, 0),
  };

  return NextResponse.json({ stats });
}

import { NextResponse } from "next/server";
import { CLIENTES_EN_MORA } from "@/lib/seed";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  let list = CLIENTES_EN_MORA;
  if (q) {
    list = list.filter(
      (c) =>
        `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
        c.identidad.includes(q) ||
        String(c.numeroCredito).includes(q)
    );
  }

  return NextResponse.json({ clientes: list });
}

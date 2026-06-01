import { NextResponse } from "next/server";
import { updatePromesa } from "@/lib/store";
import type { EstadoPromesa } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { estado } = body as { estado?: EstadoPromesa };

  if (!estado || !["pendiente", "cumplida", "incumplida"].includes(estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const updated = await updatePromesa(id, { estado });
  if (!updated) {
    return NextResponse.json({ error: "Promesa no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ promesa: updated });
}

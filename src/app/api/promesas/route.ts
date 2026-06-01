import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { CLIENTES_EN_MORA } from "@/lib/seed";
import { addPromesa, getPromesas } from "@/lib/store";
import type { EstadoPromesa, PromesaPago } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado") as EstadoPromesa | null;
  const idCliente = searchParams.get("idCliente");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  let list = await getPromesas();

  if (estado) list = list.filter((p) => p.estado === estado);
  if (idCliente) list = list.filter((p) => p.idCliente === Number(idCliente));
  if (desde) list = list.filter((p) => p.fechaCompromiso >= desde);
  if (hasta) list = list.filter((p) => p.fechaCompromiso <= hasta);

  list = [...list].sort(
    (a, b) =>
      new Date(b.fechaCompromiso).getTime() -
      new Date(a.fechaCompromiso).getTime()
  );

  return NextResponse.json({ promesas: list });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const {
    idCliente,
    idCredito,
    montoPrometido,
    fechaCompromiso,
    diasRecordatorio,
    notas,
  } = body as {
    idCliente: number;
    idCredito: number;
    montoPrometido: number;
    fechaCompromiso: string;
    diasRecordatorio?: number;
    notas?: string;
  };

  const cliente = CLIENTES_EN_MORA.find(
    (c) => c.idCliente === idCliente && c.idCredito === idCredito
  );

  if (!cliente) {
    return NextResponse.json(
      { error: "Cliente o crédito no encontrado en mora" },
      { status: 400 }
    );
  }

  if (!montoPrometido || montoPrometido <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  if (!fechaCompromiso) {
    return NextResponse.json(
      { error: "Fecha de compromiso requerida" },
      { status: 400 }
    );
  }

  const promesa: PromesaPago = {
    id: crypto.randomUUID(),
    idCliente: cliente.idCliente,
    idCredito: cliente.idCredito,
    clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
    telefono: cliente.telefono,
    montoPrometido,
    fechaCompromiso,
    diasRecordatorio: diasRecordatorio ?? 1,
    estado: "pendiente",
    notas,
    creadoPor: user.usuario,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  };

  await addPromesa(promesa);
  return NextResponse.json({ promesa }, { status: 201 });
}

import { NextResponse } from "next/server";
import { procesarNotificacionesPendientes } from "@/lib/notifications";

export async function POST() {
  const result = await procesarNotificacionesPendientes();
  return NextResponse.json(result);
}

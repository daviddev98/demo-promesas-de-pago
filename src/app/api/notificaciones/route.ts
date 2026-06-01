import { NextResponse } from "next/server";
import { getNotificaciones } from "@/lib/store";

export async function GET() {
  const notificaciones = await getNotificaciones();
  return NextResponse.json({ notificaciones });
}

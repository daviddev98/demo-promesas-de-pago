import { NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/store";
import type { ConfigNotificaciones } from "@/lib/types";

export async function GET() {
  const config = await getConfig();
  return NextResponse.json({ config });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const config = body as ConfigNotificaciones;
  await setConfig(config);
  return NextResponse.json({ config });
}

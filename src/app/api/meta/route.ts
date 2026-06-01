import { NextResponse } from "next/server";
import { isMemoryBackendForced } from "@/lib/memory-store";
import { getSessionStoreId } from "@/lib/auth";

export async function GET() {
  const sid = await getSessionStoreId();
  const memory = isMemoryBackendForced() && !!sid;
  return NextResponse.json({
    storageMode: memory ? "memory" : "file",
  });
}

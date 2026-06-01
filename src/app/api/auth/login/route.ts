import { NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { usuario, clave } = body as { usuario?: string; clave?: string };

  if (!usuario?.trim() || !clave) {
    return NextResponse.json(
      { error: "Usuario y contraseña son requeridos" },
      { status: 400 }
    );
  }

  const user = await login(usuario.trim(), clave);
  if (!user) {
    return NextResponse.json(
      { error: "Credenciales incorrectas" },
      { status: 401 }
    );
  }

  return NextResponse.json({ user });
}

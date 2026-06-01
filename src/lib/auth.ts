import { cookies } from "next/headers";
import type { SessionPayload, Usuario } from "./types";
import { USUARIOS_DEMO } from "./seed";

const COOKIE_NAME = "promesas_session";
const MAX_AGE = 60 * 60 * 8;

function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeSession(value: string): SessionPayload | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function login(
  usuario: string,
  clave: string
): Promise<Usuario | null> {
  const found = USUARIOS_DEMO.find(
    (u) => u.usuario === usuario && u.clave === clave
  );
  if (!found) return null;
  const user: Usuario = {
    id: found.id,
    usuario: found.usuario,
    nombre: found.nombre,
    rol: found.rol,
  };
  const payload: SessionPayload = {
    user,
    exp: Date.now() + MAX_AGE * 1000,
  };
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return user;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Usuario | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const payload = decodeSession(raw);
  return payload?.user ?? null;
}

export function getSessionFromCookieValue(
  value: string | undefined
): Usuario | null {
  if (!value) return null;
  const payload = decodeSession(value);
  return payload?.user ?? null;
}

export { COOKIE_NAME };

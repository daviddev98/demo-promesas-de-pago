"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error de autenticación");
        return;
      }
      const from = searchParams.get("from") || "/promesas";
      router.push(from);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#16181c] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#222428] p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          Inversiones Express
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">
          Promesas de pago
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Demo — Control automatizado de cobranza
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="text-gray-400">Usuario</span>
            <input
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#16181c] px-3 py-2.5 text-white outline-none focus:border-[var(--accent)]"
              placeholder="admin"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-400">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#16181c] px-3 py-2.5 text-white outline-none focus:border-[var(--accent)]"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-[#16181c] p-3 text-xs text-gray-500">
          <p className="font-medium text-gray-400">Credenciales demo:</p>
          <p>admin / admin123 (administrador)</p>
          <p>cobranza / cobranza123 (cobranza)</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-gray-500">
          Cargando...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

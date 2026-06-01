"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Usuario } from "@/lib/types";

const nav = [{ href: "/promesas", label: "Promesas de pago", icon: "📋" }];

export function Sidebar({ user }: { user: Usuario }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-[#16181c] text-gray-200">
      <div className="border-b border-white/10 px-5 py-6">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
          Inversiones Express
        </p>
        <h1 className="mt-1 text-lg font-semibold text-white">
          Promesas de pago
        </h1>
        <p className="mt-2 text-xs text-gray-400">Demo — Control automatizado</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate text-sm font-medium text-white">{user.nombre}</p>
        <p className="text-xs capitalize text-gray-400">{user.rol}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

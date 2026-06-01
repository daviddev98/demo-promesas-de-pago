import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#1a1c20]">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}

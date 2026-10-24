import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Sidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const [{ n }] = await db.select({ n: count() }).from(schema.orders).where(eq(schema.orders.status, "paid"));
  return (
    <div className="min-h-dvh">
      <Sidebar name={session.name} logout={logout} pendingOrders={n} />
      <div className="lg:ps-64">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccessManager } from "@/components/beheer/AccessManager";
import { Shell } from "@/components/beheer/Shell";
import { parseList } from "@/lib/portal/access";
import { getSession } from "@/lib/portal/session";
import { listUsers } from "@/lib/portal/users";

export const metadata: Metadata = { title: "Toegang" };

/**
 * Wie er in /beheer mag. Zie lib/portal/users.ts voor de twee lagen: de vaste
 * lijsten in Vercel, en wie hier is toegevoegd.
 */
export default async function ToegangPage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  if (session.role !== "admin") {
    return (
      <Shell session={session} title="Toegang">
        <p className="text-muted">Alleen een beheerder kan toegang geven of intrekken.</p>
      </Shell>
    );
  }

  const admins = parseList(process.env.PORTAL_ADMINS);
  const fixed = [
    ...admins.map((email) => ({ email, role: "admin" as const })),
    ...parseList(process.env.PORTAL_MEMBERS)
      .filter((email) => !admins.includes(email))
      .map((email) => ({ email, role: "member" as const })),
  ];
  const users = await listUsers();

  return (
    <Shell session={session} title="Toegang">
      <AccessManager me={session.email} fixed={fixed} users={users} />
    </Shell>
  );
}

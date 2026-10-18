import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ScreenEditor } from "@/components/beheer/ScreenEditor";
import { Shell } from "@/components/beheer/Shell";
import { getSession } from "@/lib/portal/session";
import { loadScreen } from "@/lib/screen-store";
import { getPhotos } from "@/lib/site-content";

export const metadata: Metadata = { title: "Scherm" };

/**
 * Het scherm vullen: de teksten en foto's die op /scherm in een lus
 * voorbijkomen. Zie lib/screen.ts en components/screen/ScreenLoop.tsx.
 */
export default async function SchermPage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  if (session.role !== "admin") {
    return (
      <Shell session={session} title="Scherm">
        <p className="text-muted">Alleen een beheerder kan het scherm aanpassen.</p>
      </Shell>
    );
  }

  const [config, sitePhotos] = await Promise.all([loadScreen(), getPhotos()]);

  return (
    <Shell session={session} title="Scherm">
      <ScreenEditor initial={config} sitePhotos={sitePhotos.map((p) => ({ url: p.src, alt: p.alt }))} />
    </Shell>
  );
}

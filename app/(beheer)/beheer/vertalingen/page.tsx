import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Shell } from "@/components/beheer/Shell";
import {
  TranslationList,
  type TranslationItem,
} from "@/components/beheer/TranslationList";
import { fetchBandAppPublic } from "@/lib/band-app";
import { getSession } from "@/lib/portal/session";
import { translateConfigured } from "@/lib/portal/translate";
import { collect, loadTranslations, statusOf } from "@/lib/portal/translations";

export const metadata: Metadata = { title: "Vertalingen" };

/**
 * De Engelse versie van wat uit de Band App komt.
 *
 * De teksten die de website zelf bezit staan al per taal in /beheer/inhoud. Wat
 * hier staat komt uit de Band App, die maar één taal kent.
 */
export default async function VertalingenPage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  if (session.role !== "admin") {
    return (
      <Shell session={session} title="Vertalingen">
        <p className="text-muted">Alleen een beheerder kan vertalen.</p>
      </Shell>
    );
  }

  const [data, stored] = await Promise.all([
    fetchBandAppPublic(),
    loadTranslations(),
  ]);

  const items: TranslationItem[] = collect(data).map((item) => ({
    id: item.id,
    label: item.label,
    source: item.source,
    translation: stored[item.id]?.text ?? "",
    status: statusOf(item, stored[item.id]),
  }));

  return (
    <Shell session={session} title="Vertalingen">
      <div className="flex flex-col gap-6">
        <p className="text-muted">
          De bandbio en de teksten per lid komen uit de Band App en staan daar
          alleen in het Nederlands. Hier vertaal je ze voor <span className="font-mono text-12">/en</span>.
          Wat je vertaalt kun je daarna gewoon bijstellen — de vertaling is een
          voorstel, geen eindproduct.
        </p>

        <p className="text-muted">
          Wijzigt de Nederlandse tekst later in de Band App, dan wordt de
          vertaling hier als verouderd gemarkeerd en toont de site zolang het
          Nederlands.
        </p>

        {!translateConfigured() ? (
          <p className="text-danger">
            Er is geen <span className="font-mono text-12">ANTHROPIC_API_KEY</span>{" "}
            ingesteld, dus automatisch vertalen kan niet. Met de hand invullen en
            opslaan werkt wel.
          </p>
        ) : null}

        <TranslationList items={items} />
      </div>
    </Shell>
  );
}

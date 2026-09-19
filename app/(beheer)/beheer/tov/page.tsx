import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Shell } from "@/components/beheer/Shell";
import { TovForm } from "@/components/beheer/TovForm";
import { getSession } from "@/lib/portal/session";
import {
  MAX_BRIEF_CHARS,
  MAX_INPUT_CHARS,
  TEXT_TYPES,
  loadToneOfVoice,
} from "@/lib/tov/config";
import { loadSourceOptions } from "@/lib/tov/sources";

export const metadata: Metadata = { title: "Tone of voice" };

/**
 * Teksten schrijven in de stem van de band.
 *
 * Open voor elk bandlid en niet alleen de beheerder: de band schrijft zijn eigen
 * social posts, en een module waar je iemand anders voor nodig hebt wordt niet
 * gebruikt.
 *
 * De tone of voice zelf staat in content/tone-of-voice.md, los van de code, en
 * kan in de database overschreven worden. Zie lib/tov/config.ts.
 */
export default async function TovPage() {
  const session = await getSession();
  if (!session) redirect("/beheer/login");

  // De keuzelijsten hangen aan de Band App. Valt die weg, dan blijft het scherm
  // werken: herschrijven heeft hem niet nodig, en de schrijfstand zegt het erbij.
  const [tov, options] = await Promise.all([
    loadToneOfVoice(),
    loadSourceOptions().catch(() => ({
      members: [],
      upcoming: [],
      past: [],
      available: false,
    })),
  ]);

  return (
    <Shell session={session} title="Tone of voice">
      <div className="flex flex-col gap-6">
        <p className="text-muted">
          Twee manieren. <strong className="text-primary">Herschrijven</strong>:
          je hebt een tekst en die komt terug in de stem van de band.{" "}
          <strong className="text-primary">Schrijven</strong>: je geeft een
          opdracht en vinkt aan waar de feiten vandaan mogen komen. Allebei
          leveren ze een Nederlandse en een Engelse versie, rechtstreeks uit de
          bron geschreven en niet uit elkaar vertaald.
        </p>

        <p className="text-muted">
          De feiten komen nooit uit het model. Bij herschrijven is je eigen tekst
          de bron, bij schrijven zijn dat de aangevinkte bronnen en je
          aantekeningen. Wat daar niet in staat, hoort niet in de tekst te komen
          — en staat het er toch, dan zegt de module dat erbij.
        </p>

        <p className="text-muted">
          Wat eruit komt is een eerste versie. Lees het na voor je het gebruikt.
        </p>

        {tov ? (
          <p className="font-mono text-11 text-faint uppercase">
            Tone of voice {tov.version} · uit {tov.source}
          </p>
        ) : (
          <p className="text-danger">
            De tone of voice is niet gevonden. Staat{" "}
            <span className="font-mono text-12">content/tone-of-voice.md</span> er
            nog?
          </p>
        )}

        <TovForm
          types={TEXT_TYPES}
          maxChars={MAX_INPUT_CHARS}
          maxBriefChars={MAX_BRIEF_CHARS}
          options={options}
        />
      </div>
    </Shell>
  );
}

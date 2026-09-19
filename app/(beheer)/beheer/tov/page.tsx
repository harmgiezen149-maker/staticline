import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Shell } from "@/components/beheer/Shell";
import { TovForm } from "@/components/beheer/TovForm";
import { getSession } from "@/lib/portal/session";
import { MAX_INPUT_CHARS, TEXT_TYPES, loadToneOfVoice } from "@/lib/tov/config";

export const metadata: Metadata = { title: "Tone of voice" };

/**
 * Teksten herschrijven naar de stem van de band.
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

  const tov = await loadToneOfVoice();

  return (
    <Shell session={session} title="Tone of voice">
      <div className="flex flex-col gap-6">
        <p className="text-muted">
          Plak een tekst, kies het type, en krijg hem terug in de stem van de
          band — in het Nederlands en het Engels. Je invoer mag in beide talen;
          allebei de versies worden rechtstreeks uit je tekst geschreven en niet
          uit elkaar vertaald.
        </p>

        <p className="text-muted">
          Wat eruit komt is een eerste versie. Feiten, namen, datums, links en
          hashtags worden nagerekend en horen ongewijzigd te zijn; klopt daar iets
          niet, dan staat het erbij. Lees het na voor je het gebruikt.
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

        <TovForm types={TEXT_TYPES} maxChars={MAX_INPUT_CHARS} />
      </div>
    </Shell>
  );
}

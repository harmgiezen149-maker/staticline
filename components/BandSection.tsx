import Image from "next/image";
import Link from "next/link";

import type { BandAppMember } from "@/lib/band-app";
import { localePath, type Locale } from "@/lib/i18n";
import { getSiteCopy } from "@/lib/site-content";

/**
 * De bandsectie op de homepage.
 *
 * GEËXTRAPOLEERD. De handoff tekent deze sectie niet; hij volgt de patronen van
 * ShowList ernaast — dezelfde sectiepadding, dezelfde kop met de lijn eronder —
 * en de ledenkaarten van /band, alleen compacter.
 *
 * Bewust een samenvatting en geen kopie van /band. Alleen de eerste alinea van de
 * bio, met een link naar de rest. Wie hier binnenkomt via de QR-code op een
 * sticker wil weten wie er speelt en wanneer, niet het hele verhaal.
 *
 * Bio en leden komen uit de Band App. Die aanroep staat ook in getShows(); Next
 * hergebruikt hetzelfde antwoord binnen één paginaweergave, dus dat is één
 * verzoek en niet twee.
 */
type Props = {
  locale: Locale;
  bio: string;
  members: BandAppMember[];
};

export async function BandSection({ locale, bio, members }: Props) {
  const copy = await getSiteCopy(locale);

  // Alleen de eerste alinea. De bio in de Band App is vrije tekst waarin een
  // lege regel een alinea scheidt — dezelfde afspraak als op /band.
  const opening = bio.split(/\n{2,}/)[0]?.trim() ?? "";

  // Zonder bio én zonder leden valt de hele sectie weg. Een kop met daaronder
  // twee lege staten is slechter dan geen sectie: het ziet eruit alsof er iets
  // stuk is in plaats van dat er nog iets moet komen.
  if (!opening && members.length === 0) return null;

  return (
    <section
      id="band"
      className="flex flex-col gap-4 px-5 py-6 sm:gap-6 sm:px-8 sm:py-12 lg:px-12 lg:py-16"
    >
      {/* Dezelfde kop als "Alle shows" ernaast, met dezelfde entree. */}
      <div
        className="kop-lijn flex items-baseline gap-4 border-b-2 border-primary pb-2 sm:pb-3"
        data-reveal="mask"
      >
        <h2 className="font-display text-26 leading-[1.05] font-bold tracking-tight2 uppercase sm:text-[clamp(28px,4vw,44px)]">
          <span className="mask-line">
            <span>{copy.band.title}</span>
          </span>
        </h2>
      </div>

      {opening && (
        <p
          className="max-w-[640px] text-14 leading-[22px] sm:text-16 sm:leading-[26px]"
          data-reveal="rise"
        >
          {opening}
        </p>
      )}

      {members.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {members.map((member) => (
            <li key={member.id} className="contents">
              {/* De hele kaart is de link en niet alleen de foto. Op een telefoon
                  is een vlak van een paar vierkante centimeter het verschil
                  tussen raak en mis, en de naam eronder hoort bij dezelfde
                  persoon.

                  Het anker is het id van dat lid in de Band App; /band zet
                  hetzelfde id op zijn kaarten. Een anker en geen queryparameter:
                  daarmee blijft die pagina statisch voorgerenderd, en zonder
                  JavaScript zet de browser het aangeklikte lid bovenaan het
                  scherm. Zie components/pages/BandPage.tsx. */}
              <Link
                href={`${localePath(locale, "/band")}#lid-${member.id}`}
                className="group flex flex-col gap-3 border border-line bg-surface p-3 transition-colors duration-[160ms] hover:border-line-strong sm:p-4"
                // Kaarten komen na elkaar binnen, zoals de menu-items.
                data-reveal="rise"
                data-stagger="item"
              >
                {member.photoUrl ? (
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-inset">
                    <Image
                      src={member.photoUrl}
                      alt={member.name}
                      fill
                      sizes="(min-width: 1025px) 25vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  // Hetzelfde streeppatroon als de fotoplaceholders, zodat een
                  // ontbrekende foto er niet uitziet als een fout.
                  <div className="aspect-[3/4] w-full bg-[repeating-linear-gradient(135deg,#1C2126_0_10px,#12161A_10px_20px)]" />
                )}

                <div className="flex flex-col gap-1">
                  <p className="font-display text-18 font-semibold tracking-tight4 uppercase transition-colors duration-[160ms] group-hover:text-accent sm:text-22">
                    {member.name}
                  </p>
                  <p className="font-mono text-11 tracking-wide14 text-muted uppercase">
                    {[member.role, member.instrument].filter(Boolean).join(" · ") ||
                      copy.band.noRole}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={localePath(locale, "/band")}
        className="inline-flex min-h-11 items-center self-start font-mono text-12 tracking-wide18 text-muted uppercase transition-colors duration-[160ms] hover:text-primary"
      >
        <span className="link-line">{copy.band.more}</span>
      </Link>
    </section>
  );
}

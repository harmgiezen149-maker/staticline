import Image from "next/image";

import { BandCarousel } from "@/components/BandCarousel";
import { PhotoTexture } from "@/components/PhotoTexture";

import { Empty, Page, Section } from "@/components/Page";
import { fetchBandAppPublic } from "@/lib/band-app";
import type { Locale } from "@/lib/i18n";
import { getSiteCopy, localiseBand } from "@/lib/site-content";

/**
 * Over de band, plus de bandleden.
 *
 * GEËXTRAPOLEERD. Bio en leden komen uit de Band App, zodat de band ze daar
 * bijhoudt en niet op twee plekken. Die route geeft bewust alleen naam, rol,
 * instrument, korte tekst en foto — geen e-mail, telefoon of adres.
 */
export async function BandPage({ locale }: { locale: Locale }) {
  const copy = await getSiteCopy(locale);
  const data = await fetchBandAppPublic();
  // Op /en de vertalingen uit /beheer/vertalingen, met het Nederlands als
  // terugval zodra het origineel gewijzigd is.
  const { bio, members } = await localiseBand(data, locale);

  return (
    <Page locale={locale} path="/band" title={copy.band.title}>
      {/* Geen eigen sectiekop: de paginakop zegt al "Over de band", en twee keer
          dezelfde regel onder elkaar leest als een fout. */}
      <section>
        {bio ? (
          // De bio is vrije tekst uit de app; lege regels worden alinea's.
          <div className="flex max-w-[640px] flex-col gap-4">
            {bio.split(/\n{2,}/).map((paragraph, index) => (
              <p
                key={index}
                className="text-16 leading-[26px] whitespace-pre-line"
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <Empty>{copy.band.bioEmpty}</Empty>
        )}
      </section>

      <Section title={copy.band.members}>
        {members.length === 0 ? (
          <Empty>{copy.band.membersEmpty}</Empty>
        ) : (
          // Dezelfde schuivende rij als op de homepage, op verzoek, in plaats
          // van een raster waarin een laatste kaart alleen op een nieuwe regel
          // belandt. De kaarten hier zijn breder dan daar, omdat er per lid
          // ook een tekst onder staat: op mobiel bijna het hele scherm, op
          // tablet twee, op desktop vier.
          <BandCarousel
            labels={{
              region: copy.band.members,
              prev: copy.band.prev,
              next: copy.band.next,
              pause: copy.band.pause,
              play: copy.band.play,
            }}
          >
            {members.map((member) => (
              /**
               * Het anker waar de homepage naartoe wijst.
               *
               * De kop staat altijd in beeld; de scroll-padding op <html>
               * (globals.css) houdt de kaart eronder, en `scroll-mt-8` geeft
               * er nog ruimte bovenop, anders plakt de kaart tegen de kop. Dat
               * scrollen is het werk dat hier gedaan moet worden en het gebeurt
               * altijd — de bovenrand van de kaart komt tweeëndertig pixels
               * onder de kop uit.
               *
               * Opzij schuift de rij zelf naar de kaart, en dan schuift hij niet
               * automatisch verder: zie BandCarousel.
               *
               * `target:border-accent` is een extraatje daarbovenop, en het doet
               * het maar in één van de twee gevallen: bij een directe laadbeurt
               * van /band#lid-5 (een gedeelde link, een bladwijzer, verversen)
               * wél, na een klik vanaf de homepage niet. De ingebouwde
               * :target-selector kijkt naar de fragmentidentificatie van het
               * document, en de App Router wisselt van pagina zonder er een
               * nieuw document voor te laden.
               *
               * Het blijft staan omdat het in dat ene geval helpt en verder
               * niets kost. Het wérkend krijgen na een klik vraagt óf een gewone
               * <a> in plaats van <Link> — dan is elke klik een volledige
               * laadbeurt in plaats van een directe overgang — óf JavaScript op
               * een pagina die het verder niet nodig heeft. Geen van beide is
               * een gekleurde rand waard.
               */
              <li
                key={member.id}
                id={`lid-${member.id}`}
                className="flex shrink-0 basis-[calc((100%-8px)/1.15)] scroll-mt-8 snap-start flex-col gap-3 border border-line bg-surface p-4 transition-colors duration-[120ms] target:border-accent sm:basis-[calc((100%-8px)/2)] lg:basis-[calc((100%-24px)/4)]"
              >
                {member.photoUrl ? (
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-inset">
                    <Image
                      src={member.photoUrl}
                      alt={member.name}
                      fill
                      sizes="(min-width: 1025px) 25vw, (min-width: 641px) 50vw, 90vw"
                      className="object-cover"
                    />
                    <PhotoTexture storing />
                  </div>
                ) : (
                  // Zelfde streeppatroon als de fotoplaceholders op de homepage,
                  // zodat een ontbrekende foto er niet uitziet als een fout.
                  <div className="aspect-[3/4] w-full bg-[repeating-linear-gradient(135deg,#1C2126_0_10px,#12161A_10px_20px)]" />
                )}

                <div className="flex flex-col gap-1">
                  <p className="font-display text-22 font-semibold tracking-tight4 uppercase">
                    {member.name}
                  </p>
                  <p className="font-mono text-11 tracking-wide14 text-muted uppercase">
                    {[member.role, member.instrument]
                      .filter(Boolean)
                      .join(" · ") || copy.band.noRole}
                  </p>
                  {member.bio && (
                    <p className="mt-1 text-14 leading-[22px] text-muted">
                      {member.bio}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </BandCarousel>
        )}
      </Section>
    </Page>
  );
}

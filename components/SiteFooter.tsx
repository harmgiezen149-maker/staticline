import Image from "next/image";

import { getCopy } from "@/content";
import { getSocials, getText } from "@/lib/site-content";
import type { Locale } from "@/lib/i18n";

import wordmarkFlat from "@/public/assets/staticline-wordmark-flat.png";

/**
 * De voet.
 *
 * Het wordmark staat hier klein en vlak. Dat is een besluit uit het brandbook: de
 * mark staat groot bovenaan en klein onderaan, en nergens anders prominent —
 * herhalen op volle sterkte put hem uit.
 *
 * De sociale links zijn een toevoeging op het ontwerp; de vragenlijst noemde
 * Instagram expliciet als wens. Ze staan in dezelfde mono-stijl als het
 * e-mailadres, dus er komt geen nieuwe vorm bij. Zolang er geen adressen in
 * content/media.ts staan, blijft de rij weg.
 */
export async function SiteFooter({ locale }: { locale: Locale }) {
  const socials = await getSocials();
  const note = await getText("footer.note", locale, getCopy(locale).footer.note);
  const copy = getCopy(locale);

  // Instagram vooraan — dat was een expliciete wens.
  const links = [
    ["Instagram", socials.instagram],
    ["YouTube", socials.youtube],
    ["Spotify", socials.spotify],
    ["Facebook", socials.facebook],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <footer
      id="booking"
      className="flex flex-col items-start gap-4 border-t border-line bg-inset px-5 py-6 sm:flex-row sm:items-center sm:gap-8 sm:px-8"
    >
      <Image
        src={wordmarkFlat}
        alt={copy.hero.wordmarkAlt}
        className="h-7 w-auto opacity-90"
      />

      <p className="font-mono text-12 leading-[18px] tracking-wide8 text-muted">
        {note}
      </p>

      {links.length > 0 && (
        <nav
          aria-label={copy.footer.social}
          className="flex flex-wrap gap-4 font-mono text-12 tracking-wide14 uppercase"
        >
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              rel="me noreferrer"
              target="_blank"
              className="text-muted transition-colors duration-[120ms] hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>
      )}

      <a
        href={`mailto:${copy.footer.mail}`}
        className="font-mono text-12 tracking-wide14 text-accent-alt uppercase transition-colors duration-[120ms] hover:text-accent-hover sm:ml-auto"
      >
        {copy.footer.mail}
      </a>
    </footer>
  );
}

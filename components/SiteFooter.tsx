import Image from "next/image";

import { getCopy } from "@/content";
import type { Locale } from "@/lib/i18n";

import wordmarkFlat from "@/public/assets/staticline-wordmark-flat.png";

/**
 * De voet.
 *
 * Het wordmark staat hier klein en vlak. Dat is een besluit uit het brandbook: de
 * mark staat groot bovenaan en klein onderaan, en nergens anders prominent —
 * herhalen op volle sterkte put hem uit.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);

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
        {copy.footer.note}
      </p>

      <a
        href={`mailto:${copy.footer.mail}`}
        className="font-mono text-12 tracking-wide14 text-accent-alt uppercase transition-colors duration-[120ms] hover:text-accent-hover sm:ml-auto"
      >
        {copy.footer.mail}
      </a>
    </footer>
  );
}

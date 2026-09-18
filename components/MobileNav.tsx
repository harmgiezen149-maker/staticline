"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { locales, localePath, type Locale } from "@/lib/i18n";

/**
 * Het mobiele menu.
 *
 * LET OP — dit paneel is GEËXTRAPOLEERD, niet ontworpen. De design-handoff tekent
 * alleen de hamburgerknop (44×44, drie lijnen van 2px, 6px uit elkaar) en zegt
 * er expliciet bij: vraag om een ontwerp voor je dit improviseert. Dat is gevraagd
 * en de keuze was om te extrapoleren, dus is alles hieronder afgeleid van
 * patronen die elders op de homepage al staan:
 *
 * - dezelfde ondergrond en lijnen als de showlijst;
 * - links in Oswald 600 uppercase, zoals de navigatie op desktop;
 * - de boekingsknop in accent, zoals de CTA in de kop;
 * - geen enkele animatie, want die staan in het hele ontwerp niet.
 *
 * Er zijn geen nieuwe kleuren, radii, schaduwen of bewegingen bijgekomen. Komt er
 * later alsnog een ontwerp, dan is dit bestand het enige dat wijzigt.
 */
type Props = {
  locale: Locale;
  links: { href: string; label: string }[];
  /** De boekingsknop. Staat apart omdat hij, net als in de kop, accent krijgt. */
  cta: { href: string; label: string };
  label: string;
};

export function MobileNav({ locale, links, cta, label }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Escape sluit, en de pagina eronder mag niet meescrollen. Zonder dat laatste
  // scrol je op een telefoon door de pagina achter het menu heen.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Bij sluiten gaat de focus terug naar de knop, anders staat een
  // toetsenbordgebruiker na het sluiten weer bovenaan de pagina.
  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative ml-2 h-11 w-11 shrink-0 sm:hidden"
      >
        {/* Drie lijnen van 2px, 6px uit elkaar, binnen een raakvlak van 44×44 —
            de maten uit de handoff. */}
        <span className="absolute top-[15px] right-3 left-3 h-0.5 bg-primary" />
        <span className="absolute top-[21px] right-3 left-3 h-0.5 bg-primary" />
        <span className="absolute top-[27px] right-3 left-3 h-0.5 bg-primary" />
      </button>

      {open && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-50 flex flex-col bg-base sm:hidden"
        >
          <div className="flex items-center justify-end border-b border-line bg-inset px-4 py-3">
            <button
              type="button"
              onClick={close}
              aria-label={label}
              aria-expanded
              className="relative h-11 w-11"
            >
              {/* Hetzelfde raakvlak op dezelfde plek, als kruis. */}
              <span className="absolute top-[21px] right-3 left-3 h-0.5 rotate-45 bg-primary" />
              <span className="absolute top-[21px] right-3 left-3 h-0.5 -rotate-45 bg-primary" />
            </button>
          </div>

          <nav className="flex flex-col px-5 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 font-display text-26 font-semibold tracking-tight4 uppercase"
              >
                {link.label}
              </Link>
            ))}

            {/* Boeken is waarvoor de site bestaat, dus krijgt hij ook hier de
                accentvulling in plaats van nog een regel in de lijst. */}
            <Link
              href={cta.href}
              onClick={() => setOpen(false)}
              className="mt-6 flex items-center justify-center bg-accent py-4 font-display text-16 font-bold tracking-wide12 text-on-accent uppercase"
            >
              {cta.label}
            </Link>
          </nav>

          <p className="mt-auto flex items-center gap-2 px-5 py-6 font-mono text-11 tracking-wide10 uppercase">
            {locales.map((option, index) => (
              <span key={option} className="flex items-center gap-2">
                {index > 0 && <span className="text-faint">/</span>}
                {option === locale ? (
                  <span aria-current="true" className="text-primary">
                    {option.toUpperCase()}
                  </span>
                ) : (
                  <Link
                    href={localePath(option, "/")}
                    hrefLang={option}
                    onClick={() => setOpen(false)}
                    className="text-faint"
                  >
                    {option}
                  </Link>
                )}
              </span>
            ))}
          </p>
        </div>
      )}
    </>
  );
}

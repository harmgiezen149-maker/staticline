import Image from "next/image";
import Link from "next/link";

import { getCopy } from "@/content";
import { localePath, locales, type Locale } from "@/lib/i18n";
import { MobileNav } from "./MobileNav";

import wordmarkFlat from "@/public/assets/staticline-wordmark-flat.png";

type Props = {
  locale: Locale;
  /**
   * Het pad van de huidige pagina zonder taalvoorvoegsel, bijvoorbeeld "/" of
   * "/agenda". De taalwissel heeft het nodig om naar dezelfde pagina in de andere
   * taal te wijzen. Bewust een prop en geen `usePathname()`: dat zou de hele kop
   * een clientcomponent maken en JavaScript kosten voor twee linkjes.
   */
  path?: string;
};

export function SiteHeader({ locale, path = "/" }: Props) {
  const copy = getCopy(locale);

  const links = [
    { href: localePath(locale, "/#shows"), label: copy.nav.shows },
    { href: localePath(locale, "/#photos"), label: copy.nav.photos },
    { href: localePath(locale, "/band"), label: copy.nav.band },
  ];

  return (
    <header className="flex items-center gap-3 border-b border-line bg-inset px-4 py-3 sm:gap-6 sm:px-6">
      <Link href={localePath(locale, "/")} className="shrink-0">
        <Image
          src={wordmarkFlat}
          alt={copy.hero.wordmarkAlt}
          className="h-4 w-auto sm:h-[22px]"
          priority
        />
      </Link>

      <nav
        aria-label={copy.nav.shows}
        className="ml-auto hidden gap-5 font-display text-14 font-semibold tracking-wide12 uppercase sm:flex"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors duration-[120ms] hover:text-accent-hover"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <Link
        href={localePath(locale, "/boeken")}
        className="hidden bg-accent px-3.5 py-2 font-display text-14 font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[120ms] hover:bg-accent-hover sm:block"
      >
        {copy.nav.booking}
      </Link>

      <LangSwitch locale={locale} path={path} />

      <MobileNav
        locale={locale}
        links={links}
        cta={{ href: localePath(locale, "/boeken"), label: copy.nav.booking }}
        label={copy.nav.menu}
      />
    </header>
  );
}

/**
 * "NL / en" — de actieve taal in vol contrast, de andere gedempt.
 *
 * `--text-faint` is hier toegestaan: het is een mono-label van 11px in een
 * secundaire rol, precies waar dat token voor bedoeld is. Nooit voor lopende
 * tekst.
 */
function LangSwitch({ locale, path }: { locale: Locale; path: string }) {
  return (
    <p
      className="ml-auto flex shrink-0 items-center gap-1 font-mono text-11 tracking-wide10 uppercase sm:ml-0"
      // Zonder deze regel leest een schermlezer "NL slash en" als losse tekst.
      aria-label="NL / EN"
    >
      {locales.map((option, index) => (
        <span key={option} className="flex items-center gap-1">
          {index > 0 && <span className="text-faint">/</span>}
          {option === locale ? (
            <span aria-current="true" className="text-primary">
              {option.toUpperCase()}
            </span>
          ) : (
            <Link
              href={localePath(option, path)}
              hrefLang={option}
              className="text-faint transition-colors duration-[120ms] hover:text-primary"
            >
              {option}
            </Link>
          )}
        </span>
      ))}
    </p>
  );
}

import Image from "next/image";
import Link from "next/link";

import { localePath, locales, type Locale } from "@/lib/i18n";
import { getSiteCopy, getWordmark } from "@/lib/site-content";
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

export async function SiteHeader({ locale, path = "/" }: Props) {
  const copy = await getSiteCopy(locale);
  const home = path === "/";
  // Alleen op de homepage: het wordmark uit de hero, voor de vlucht naar de kop.
  const wordmark = home ? await getWordmark() : null;

  /**
   * Het ontwerp tekent drie navigatie-items: Shows, Foto's en Band. Toen dat
   * ontworpen werd bestonden de losse pagina's nog niet en waren het ankers op de
   * homepage; ze wijzen nu naar echte pagina's.
   *
   * Muziek en Video zijn erbij gekomen — die staan wel in de scope maar niet in
   * de handoff. Ze verschijnen pas op desktop, waar de ruimte er is; op tablet
   * blijft de kop precies de drie items breed die ontworpen zijn, en op mobiel
   * staat alles in het paneel. Zo wijkt de kop nergens af van het ontwerp op een
   * breedte waarvoor het ontwerp gemaakt is.
   */
  const primary = [
    { href: localePath(locale, "/agenda"), label: copy.nav.shows },
    { href: localePath(locale, "/fotos"), label: copy.nav.photos },
    { href: localePath(locale, "/band"), label: copy.nav.band },
  ];

  const desktopOnly = [
    { href: localePath(locale, "/muziek"), label: copy.nav.music },
    { href: localePath(locale, "/video"), label: copy.nav.video },
  ];

  const booking = {
    href: localePath(locale, "/boeken"),
    label: copy.nav.booking,
  };

  // De actieve pagina houdt de onderlijn onder zijn naam. Het pad komt als prop
  // binnen (zie boven), dus dit kost geen JavaScript.
  const isCurrent = (href: string) => localePath(locale, path) === href;

  const navLink = (link: { href: string; label: string }, extra = "") => (
    <Link
      key={link.href}
      href={link.href}
      className={extra}
      aria-current={isCurrent(link.href) ? "page" : undefined}
      data-scramble-hover
    >
      <span data-scramble-target>{link.label}</span>
    </Link>
  );

  return (
    // Het mobiele menupaneel staat ín deze kop (zie MobileNav) en ligt als
    // vaste laag over het hele scherm. Om de kop er toch bovenop te houden,
    // zoals het ontwerp tekent, krijgen de onderdelen die dan zichtbaar horen te
    // zijn een hogere z-index dan het paneel — en de onderlijn staat daarom
    // nog een keer als laagje, want de echte rand zou onder het paneel liggen.
    <header
      className="site-header sticky top-0 z-60 flex min-h-[68px] items-center gap-3 border-b border-line bg-inset px-4 py-3 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:z-60 after:h-px after:bg-line sm:gap-6 sm:px-6"
      // Docking: alleen op de homepage verschijnt het wordmark in de kop pas
      // als het grote wordmark uit beeld is. Elders staat hij er gewoon.
      data-dock={home ? "" : undefined}
    >
      {/* Het wordmark dat bij het scrollen van de hero hierheen vliegt. Een
          tweede exemplaar van het grote wordmark, met dezelfde bron en dezelfde
          `sizes` — de browser haalt het dus niet opnieuw op. Zonder vlucht
          (zonder JavaScript, met minder beweging) staat het nooit in beeld.
          Zie fly() in lib/motion/scroll.ts. */}
      {wordmark && (
        <span className="site-header__flier" aria-hidden="true">
          <Image
            src={wordmark.src}
            alt=""
            width={wordmark.width}
            height={wordmark.height}
            loading="eager"
            sizes="(min-width: 1025px) 720px, (min-width: 641px) 520px, 100vw"
            className="h-auto w-full drop-shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
          />
        </span>
      )}

      <Link href={localePath(locale, "/")} className="site-header__home relative z-60 shrink-0">
        <Image
          src={wordmarkFlat}
          alt={copy.hero.wordmarkAlt}
          // Op verzoek groter dan het ontwerp (16/22px): 36px op mobiel, 40 op
          // tablet, 44 op desktop. De kop is daarom overal 68px hoog, wat hij
          // op mobiel al was. Alleen de hoogte, zodat de verhouding blijft.
          className="site-header__mark h-9 w-auto sm:h-10 lg:h-11"
          // Hij is hooguit ±76px breed; zonder `sizes` haalt next/image de
          // volle breedte van het bronbestand op.
          sizes="80px"
          priority
        />
      </Link>

      {/* Op mobiel staat de navigatie in het menupaneel. Zonder JavaScript
          werkt dat paneel niet, en dan staan de links hier, klein. */}
      <nav
        aria-label={copy.nav.menu}
        className="site-nav hidden gap-3 font-display text-12 font-semibold tracking-wide12 uppercase no-js:flex sm:ml-auto sm:flex sm:gap-5 sm:text-14"
      >
        {navLink(primary[0])}
        {desktopOnly.map((link) => navLink(link, "hidden lg:block"))}
        {primary.slice(1).map((link) => navLink(link))}
      </nav>

      <Link
        href={booking.href}
        className="site-header__cta btn btn--primary hidden px-3.5 py-2 font-display text-14 font-bold tracking-wide12 uppercase sm:block"
      >
        <span className="btn__label">{booking.label}</span>
      </Link>

      <LangSwitch locale={locale} path={path} />

      <MobileNav
        locale={locale}
        path={path}
        links={[primary[0], ...desktopOnly, ...primary.slice(1)]}
        cta={booking}
        labels={{ nav: copy.nav.menu, open: copy.nav.menuOpen, close: copy.nav.menuClose }}
        mail={copy.footer.mail}
        ctaLabel={copy.hero.ctaBook}
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
      className="relative z-60 ml-auto flex shrink-0 items-center gap-1 font-mono text-12 tracking-wide10 uppercase sm:ml-0 sm:text-11"
      // Zonder deze regel leest een schermlezer "NL slash en" als losse tekst.
      aria-label="NL / EN"
      // Na een taalwissel zet de motion-laag de focus hier terug.
      data-lang-switch
    >
      {locales.map((option, index) => (
        <span key={option} className="flex items-center gap-1">
          {index > 0 && <span className="text-faint">/</span>}
          {/* Op mobiel een tikdoel van 44×44; op groter scherm gewoon het label. */}
          {option === locale ? (
            <span
              aria-current="true"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-primary sm:min-h-0 sm:min-w-0"
            >
              {option.toUpperCase()}
            </span>
          ) : (
            <Link
              href={localePath(option, path)}
              hrefLang={option}
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-faint transition-colors duration-[160ms] hover:text-primary sm:min-h-0 sm:min-w-0"
            >
              {option}
            </Link>
          )}
        </span>
      ))}
    </p>
  );
}

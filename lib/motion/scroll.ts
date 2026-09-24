import { decode } from "./decode";
import { motionOn, ms, pct, tok } from "./env";
import { flightFrame } from "./flight";
import { reveal } from "./reveal";

/**
 * Alles wat met de scrollpositie meebeweegt: de parallax in de hero en het
 * wordmark dat naar de kop vliegt.
 *
 * De kop duikt niet meer weg bij omlaag scrollen, zoals MOTION.md §5 wil: op
 * verzoek staat hij altijd bovenaan in beeld. Hij is gewoon `sticky`, en de
 * browser houdt hem daar zonder dat hier iets voor hoeft te gebeuren.
 *
 * Eén luisteraar, één update per beeld. Parallax schrijft alleen `transform` en
 * `opacity`, zodat de browser niets opnieuw hoeft in te delen.
 *
 * Geen Lenis of andere smooth scroll. Het ontwerp noemt die optioneel, en het
 * is precies het onderdeel waar de handoff zelf voor waarschuwt: na een
 * paginawissel klemt hij op de oude paginahoogte, hij moet stoppen voor het
 * menu en de lightbox, en ankers moeten er een eigen offset voor krijgen. Voor
 * een bandsite is de gewone scroll van de browser het betere gevoel.
 */

let ticking = false;

const header = () => document.querySelector<HTMLElement>(".site-header");

export function updateScroll() {
  const y = window.scrollY;
  const head = header();
  const hero = document.querySelector<HTMLElement>(".hero");

  if (!hero) return;

  const height = hero.offsetHeight;
  const mark = hero.querySelector<HTMLElement>(".hero__wordmark");

  if (motionOn() && y < height + 50) {
    const p = Math.max(0, Math.min(1, y / height));
    const bg = hero.querySelector<HTMLElement>(".hero__bg");
    if (bg) bg.style.transform = `translate3d(0, ${(p * pct("--parallax-bg") * height).toFixed(1)}px, 0)`;
    // Zonder vlucht (die er op de homepage altijd hoort te zijn, maar dit is
    // het vangnet) beweegt het wordmark alleen als geheel: verschuiven en
    // vervagen. Het blijft het LCP-element, dus hij begint altijd op 1.
    if (mark && !flier(head)) {
      mark.style.transform = `translate3d(0, ${(p * pct("--parallax-mark") * height).toFixed(1)}px, 0)`;
      mark.style.opacity = String(1 - p * 0.65);
    }
  }

  if (head?.hasAttribute("data-dock") && mark) {
    if (motionOn() && flier(head)) fly(head, hero, y);
    else {
      // Docking zonder vlucht: het wordmark in de kop verschijnt zodra het
      // grote wordmark onder de kop verdwenen is.
      const docked =
        mark.getBoundingClientRect().bottom < head.getBoundingClientRect().bottom + 8;
      head.classList.toggle("is-docked", docked);
    }
  }
}

const flier = (head: HTMLElement | null) =>
  head?.querySelector<HTMLElement>(".site-header__flier") ?? null;

/**
 * Het wordmark vliegt van de hero naar de kop, in één beweging met het scrollen.
 *
 * Het grote wordmark zelf kan de kop niet in: het staat in <main>, en de kop ligt
 * daar met z-index 60 overheen. Er vliegt daarom een tweede exemplaar, dat in de
 * kop staat en daar dus overal bovenop kan. Het is hetzelfde bestand op dezelfde
 * maat, dus de browser haalt het niet opnieuw op, en het ligt precies op het
 * origineel: bovenaan is alleen het origineel te zien, zodra de vlucht begint
 * alleen het exemplaar in de kop. Het origineel wordt daarvoor onzichtbaar
 * (visibility), nooit doorzichtig — en pas na de eerste scrollbeweging, dus lang
 * nadat hij als LCP-element geteld is.
 *
 * Het exemplaar heeft de volle breedte van het grote wordmark en wordt kleiner
 * geschaald, niet andersom: een klein beeld dat opgeblazen wordt, is wazig.
 * Op het eind neemt het vlakke wordmark in de kop het over (`--dock`), in
 * dezelfde vorm.
 */
function fly(head: HTMLElement, hero: HTMLElement, y: number) {
  const plane = flier(head);
  const source = hero.querySelector<HTMLElement>(".hero__wordmark");
  const slot = head.querySelector<HTMLElement>(".site-header__mark");
  if (!plane || !source || !slot) return;

  // Eerst alles meten, dan pas schrijven: anders rekent de browser per regel
  // de indeling opnieuw uit. Het grote wordmark krijgt met een vlucht geen
  // parallax (zie boven), dus zijn rechthoek is zijn plek in de pagina.
  const from = source.getBoundingClientRect();
  const to = slot.getBoundingClientRect();
  const headTop = head.getBoundingClientRect().top;
  const frame = flightFrame(y, from, to);

  const flying = frame.progress > 0;
  hero.classList.toggle("is-flying", flying);
  head.classList.toggle("is-flying", flying);
  head.classList.toggle("is-docked", frame.progress >= 1);
  head.style.setProperty("--dock", frame.dock.toFixed(3));

  const width = `${from.width}px`;
  if (plane.style.width !== width) plane.style.width = width;
  // De kop is sticky en staat bovenaan, maar schuift tijdens de loader nog
  // binnen: vandaar de correctie voor zijn eigen bovenkant.
  plane.style.transform = `translate3d(${frame.x.toFixed(1)}px, ${(frame.y - headTop).toFixed(1)}px, 0) scale(${frame.scale.toFixed(4)})`;
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    updateScroll();
  });
}

export function initScroll() {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateScroll();
}

/**
 * De hero komt binnen.
 *
 * `full` na de loader, `short` bij een herhaalbezoek of na een paginawissel.
 * Het wordmark wordt nooit verborgen: er gaat alleen een ruissluier vanaf. De
 * kicker decodeert, de subkop komt op, de knoppen wipen van links in.
 */
export function heroIntro(kind: "full" | "short" = "short") {
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!hero) return;

  const kicker = hero.querySelector<HTMLElement>(".hero__kicker");
  const subs = hero.querySelectorAll<HTMLElement>("[data-hero-sub]");
  const buttons = hero.querySelectorAll<HTMLElement>(".hero__actions [data-reveal]");
  const veil = hero.querySelector<HTMLElement>(".hero__veil");

  if (!motionOn()) {
    [...subs, ...buttons].forEach((el) => el.classList.add("is-in", "is-settled"));
    kicker?.classList.add("is-decoded");
    return;
  }

  const full = kind === "full";
  veil?.animate([{ opacity: full ? 0.55 : 0.4 }, { opacity: 0 }], {
    duration: full ? 800 : 600,
    easing: tok("--ease-signal"),
    fill: "forwards",
  });
  setTimeout(() => decode(kicker, { duration: full ? 600 : 480 }), full ? 140 : 60);
  subs.forEach((el) => reveal(el, full ? 220 : 120));
  buttons.forEach((el, i) => reveal(el, (full ? 280 : 180) + i * ms("--stagger-item")));
}

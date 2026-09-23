import { decode } from "./decode";
import { motionOn, ms, pct, tok } from "./env";
import { reveal } from "./reveal";

/**
 * Alles wat met de scrollpositie meebeweegt: de kop die wegduikt, de parallax
 * in de hero en het wordmark dat naar de kop "verhuist".
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

let lastY = 0;
let ticking = false;

const header = () => document.querySelector<HTMLElement>(".site-header");

export function updateScroll() {
  const y = window.scrollY;
  const head = header();
  const hero = document.querySelector<HTMLElement>(".hero");
  const menuOpen = document.querySelector<HTMLElement>(".menu-panel")?.dataset.state === "open";

  // De kop: omlaag scrollen is weg, omhoog is terug. Bovenaan, met het menu
  // open, of met de focus erin blijft hij altijd staan.
  if (head && motionOn()) {
    const down = y > lastY + 2;
    const up = y < lastY - 2;
    if (y < 120 || menuOpen || head.contains(document.activeElement)) {
      head.classList.remove("is-hidden");
    } else if (down) {
      head.classList.add("is-hidden");
    } else if (up) {
      head.classList.remove("is-hidden");
    }
  }
  lastY = y;

  if (!hero) return;

  const height = hero.offsetHeight;
  const mark = hero.querySelector<HTMLElement>(".hero__wordmark");

  if (motionOn() && y < height + 50) {
    const p = Math.max(0, Math.min(1, y / height));
    const bg = hero.querySelector<HTMLElement>(".hero__bg");
    if (bg) bg.style.transform = `translate3d(0, ${(p * pct("--parallax-bg") * height).toFixed(1)}px, 0)`;
    // Het wordmark beweegt alleen als geheel: verschuiven en vervagen, nooit
    // schalen. Het blijft het LCP-element, dus hij begint altijd op 1.
    if (mark) {
      mark.style.transform = `translate3d(0, ${(p * pct("--parallax-mark") * height).toFixed(1)}px, 0)`;
      mark.style.opacity = String(1 - p * 0.65);
    }
  }

  // Docking: het wordmark in de kop verschijnt zodra het grote wordmark onder
  // de kop verdwenen is.
  if (head?.hasAttribute("data-dock") && mark) {
    const docked =
      mark.getBoundingClientRect().bottom < head.getBoundingClientRect().bottom + 8;
    head.classList.toggle("is-docked", docked);
  }
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
  // Focus in de kop haalt hem terug, ook als hij net was weggedoken.
  document.addEventListener("focusin", (event) => {
    const head = header();
    if (head?.contains(event.target as Node)) head.classList.remove("is-hidden");
  });
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

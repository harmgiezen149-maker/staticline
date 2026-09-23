import { decode } from "./decode";
import { motionOn, ms } from "./env";

/**
 * Entrees: een element komt binnen zodra het in beeld komt.
 *
 * De markup zegt wat er moet gebeuren (`data-reveal="rise | wipe | mask"`), de
 * CSS hoe (styles/motion.css), en dit bestand alleen wanneer: het zet `.is-in`
 * op het moment dat een IntersectionObserver het element ziet. Wie tegelijk
 * binnenkomt, krijgt een oplopende `--delay` volgens `data-stagger`.
 *
 * Twee dingen die in het prototype fout gingen en hier dus niet mogen:
 *
 * - Geen `clip-path` op een element dat geobserveerd wordt. De observer rekent
 *   die mee en ziet het element dan nooit. Wipes gebruiken daarom een
 *   afdekvlak (`::after`).
 * - Na de entree `.is-settled`, anders erft elke hover-transitie de vertraging
 *   van de entree en reageert een rij pas een halve seconde na de muis.
 *
 * Een IntersectionObserver en geen scroll-gestuurde CSS: v2 wil entrees die één
 * keer spelen en dan stil blijven staan, met decoderende tekst erachteraan, en
 * dat kan een voortgangstijdlijn niet. De secties blijven servercomponenten; dit
 * is één script dat over de al gerenderde pagina heen loopt.
 */

let enabled = false;
const waiting = new Set<Element>();
const waitingDecode = new Set<Element>();

let observer: IntersectionObserver | null = null;
let decodeObserver: IntersectionObserver | null = null;
let grainObserver: IntersectionObserver | null = null;

function staggerFor(el: Element): number {
  const kind = el.getAttribute("data-stagger");
  return kind ? ms(`--stagger-${kind}`) : 0;
}

/** Een element laten binnenkomen, eventueel met vertraging. */
export function reveal(el: HTMLElement, delay = 0) {
  if (el.classList.contains("is-in")) return;
  el.style.setProperty("--delay", `${delay}ms`);
  el.classList.add("is-in");

  // Decodes binnen het element starten kort na de aanzet van de entree.
  const decodeDelay = parseFloat(el.getAttribute("data-decode-delay") ?? "180");
  const targets = el.matches("[data-decode]")
    ? [el]
    : [...el.querySelectorAll<HTMLElement>("[data-decode]:not([data-decode-manual])")];
  targets.forEach((target, i) => {
    setTimeout(
      () =>
        decode(target, {
          duration: target.hasAttribute("data-decode-digits") ? 500 : 520,
        }),
      delay + decodeDelay + i * 60,
    );
  });

  setTimeout(() => el.classList.add("is-settled"), delay + ms("--dur-slow") * 1.5 + 400);
}

function settle(el: Element) {
  el.classList.add("is-in", "is-settled");
  el.querySelectorAll("[data-decode]").forEach((d) => d.classList.add("is-decoded"));
  if (el.matches("[data-decode]")) el.classList.add("is-decoded");
}

function ensureObservers() {
  if (observer || !("IntersectionObserver" in window)) return;

  observer = new IntersectionObserver(
    (entries) => {
      const incoming = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
        // In documentvolgorde, zodat de stagger van boven naar beneden loopt.
        .sort((a, b) =>
          a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
        );
      const counters = new Map<string, number>();
      for (const el of incoming) {
        observer?.unobserve(el);
        const key = el.getAttribute("data-stagger") ?? "_";
        const index = counters.get(key) ?? 0;
        counters.set(key, index + 1);
        reveal(el, index * staggerFor(el));
      }
    },
    // De onderste tien procent van het scherm telt niet: daar kijkt niemand.
    { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
  );

  decodeObserver = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          decodeObserver?.unobserve(entry.target);
          setTimeout(() => decode(entry.target as HTMLElement, { duration: 520 }), i * 60);
        });
    },
    { rootMargin: "0px 0px -10% 0px" },
  );

  // De levende korrel stilzetten zodra hij uit beeld is.
  grainObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) =>
      entry.target.classList.toggle("is-offscreen", !entry.isIntersecting),
    );
  });
}

/**
 * Alles in een stuk pagina klaarzetten.
 *
 * Wordt aangeroepen bij de eerste lading en na elke paginawissel, met de nieuwe
 * inhoud. Zonder beweging (of zonder observer) komt alles meteen in de
 * eindtoestand.
 */
export function observeReveals(scope: ParentNode = document) {
  ensureObservers();
  const instant = !motionOn() || !observer;

  scope
    .querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal-manual]):not(.is-in)")
    .forEach((el) => {
      if (instant) return settle(el);
      if (!enabled) return void waiting.add(el);
      observer?.observe(el);
    });

  // Losse decodes, die niet in een entree zitten en niet door een component
  // gestart worden: decoderen zodra ze in beeld komen.
  scope
    .querySelectorAll<HTMLElement>(
      "[data-decode]:not([data-decode-manual]):not(.is-decoded)",
    )
    .forEach((el) => {
      if (instant) return void el.classList.add("is-decoded");
      if (el.closest("[data-reveal]")) return;
      if (!enabled) return void waitingDecode.add(el);
      decodeObserver?.observe(el);
    });

  scope.querySelectorAll(".korrel").forEach((g) => grainObserver?.observe(g));
}

/**
 * Entrees aanzetten.
 *
 * Bij het eerste bezoek pas als de loader opengaat: anders speelt alles zich af
 * achter de loader, waar niemand het ziet.
 */
export function enableReveals() {
  enabled = true;
  waiting.forEach((el) => observer?.observe(el));
  waiting.clear();
  waitingDecode.forEach((el) => decodeObserver?.observe(el));
  waitingDecode.clear();
}

/** Na een paginawissel: wat nog wachtte, hoort bij de oude pagina. */
export function forgetWaiting() {
  waiting.clear();
  waitingDecode.clear();
}

import { decode } from "./decode";
import { motionOn, ms, reduced, tok, wait } from "./env";

/**
 * Paginaovergangen: "Kanaalwissel".
 *
 * Drie varianten uit design/v2/MOTION.md §6.2:
 *
 * - **band** — tussen publieke pagina's. Vijf horizontale banden (vier op
 *   mobiel) schuiven dicht, er decodeert een kanaallabel, de pagina wisselt
 *   eronder, en de banden lopen in dezelfde richting door.
 * - **lang** — de taalwissel. Geen banden: de scrollpositie blijft en de
 *   labels decoderen naar de nieuwe taal. Zie `rememberLangSwap`.
 * - **calm** — het besloten deel. Alleen dekking, geen schuiven, geen ruis.
 *
 * De overgang zelf is een eigen laag over de pagina (`.pt`), niet de View
 * Transitions API. Die zou een foto van de oude en de nieuwe pagina in elkaar
 * laten overlopen; dit ontwerp wil een doek dat dichtgaat, iets wat erbovenop
 * ligt terwijl eronder gewisseld wordt. Zonder JavaScript is het een gewone
 * paginalading.
 */

const layer = () => document.querySelector<HTMLElement>(".pt");

function visibleBands(pt: HTMLElement) {
  return [...pt.querySelectorAll<HTMLElement>(".pt__band")].filter(
    (band) => getComputedStyle(band).display !== "none",
  );
}

/** Het doek dicht. Pas als de belofte afgaat, mag de pagina wisselen. */
export async function leave({
  variant = "band",
  label = "",
}: { variant?: "band" | "calm"; label?: string } = {}) {
  const pt = layer();
  if (!pt) return;
  const calm = variant === "calm" || reduced() || !motionOn();
  pt.classList.toggle("pt--calm", calm);
  pt.classList.add("is-active");
  const bands = visibleBands(pt);

  if (calm) {
    await Promise.all(
      bands.map(
        (band) =>
          band.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: reduced() ? 120 : 200,
            easing: "linear",
            fill: "forwards",
          }).finished,
      ),
    ).catch(() => {});
    return;
  }

  // De tijden staan als tokens in styles/motion.css (`--pt-*`) en zijn bewust
  // langer dan MOTION.md voorschrijft — zie daar waarom.
  const close = ms("--pt-close");
  const stagger = ms("--pt-stagger");

  const animations = bands.map((band, i) => {
    const from = i % 2 === 0 ? "-101%" : "101%";
    return band.animate(
      [{ transform: `translate3d(${from},0,0)` }, { transform: "translate3d(0,0,0)" }],
      {
        duration: close,
        delay: i * stagger,
        easing: tok("--ease-band"),
        fill: "forwards",
      },
    );
  });

  const labelEl = pt.querySelector<HTMLElement>(".pt__label");
  if (labelEl && label) {
    labelEl.textContent = label;
    labelEl.getAnimations().forEach((a) => a.cancel());
    setTimeout(() => {
      labelEl.style.opacity = "1";
      decode(labelEl, { duration: ms("--pt-label"), hot: 0.2 });
    }, close * 0.6);
  }

  await Promise.all(animations.map((a) => a.finished)).catch(() => {});
  // Dicht blijven tot het label gelezen kan worden. Zonder dit gaat het doek
  // weer open op het moment dat het label net stil staat.
  await wait(ms("--pt-hold"));
}

/**
 * Het doek open op de nieuwe pagina.
 *
 * `fromCovered`: de banden liggen er al zonder dat `leave` ze dichtschoof. Dat
 * is terug en vooruit in de browser — die navigatie is al gebeurd voordat een
 * script er iets van weet, dus sluit het doek in één beeld en gaat het daarna
 * gewoon open. Het leest als een kanaalwissel, en er valt niets te onderscheppen.
 */
export async function enter({
  variant = "band",
  fromCovered = false,
}: { variant?: "band" | "calm"; fromCovered?: boolean } = {}) {
  const pt = layer();
  if (!pt) return;
  const calm = variant === "calm" || reduced() || !motionOn();

  if (fromCovered) {
    pt.classList.toggle("pt--calm", calm);
    pt.classList.add("is-active");
  }
  if (!pt.classList.contains("is-active")) return;

  const bands = visibleBands(pt);
  const labelEl = pt.querySelector<HTMLElement>(".pt__label");
  if (labelEl && labelEl.style.opacity === "1") {
    // Het label vervaagt terwijl de banden weglopen, in plaats van in één beeld.
    labelEl
      .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" })
      .finished.then(() => {
        labelEl.style.opacity = "0";
        labelEl.getAnimations().forEach((a) => a.cancel());
      })
      .catch(() => {});
  }

  const animations = calm
    ? bands.map((band) =>
        band.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: reduced() ? 120 : 240,
          easing: "linear",
          fill: "forwards",
        }),
      )
    : bands.map((band, i) => {
        // De banden lopen door in de richting waarin ze kwamen.
        const to = i % 2 === 0 ? "101%" : "-101%";
        return band.animate(
          [{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(${to},0,0)` }],
          {
            duration: ms("--pt-open"),
            delay: i * ms("--pt-stagger"),
            easing: tok("--ease-band"),
            fill: "forwards",
          },
        );
      });

  await Promise.all(animations.map((a) => a.finished)).catch(() => {});
  bands.forEach((band) => band.getAnimations().forEach((a) => a.cancel()));
  pt.classList.remove("is-active", "pt--calm");
}

/**
 * De taalwissel.
 *
 * Nederlands en Engels hebben elk hun eigen root layout — zie CLAUDE.md,
 * "Taalroutering". Van de ene naar de andere is daardoor altijd een volledige
 * paginalading, ook met `<Link>`. Wat v2 wil (zelfde plek op de pagina, labels
 * die naar de andere taal decoderen) gaat dus over die lading heen: vlak
 * vóór het wisselen bewaren we waar je was, en de nieuwe pagina pakt dat op.
 */
const LANG_SWAP = "sl-lang-swap";

export function rememberLangSwap(targetPath: string) {
  try {
    sessionStorage.setItem(LANG_SWAP, JSON.stringify({ path: targetPath, y: window.scrollY }));
  } catch {
    // Geen opslag: dan begint de nieuwe pagina bovenaan. Geen ramp.
  }
}

/** Is deze lading een taalwissel? Zo ja, waar was de bezoeker. Eenmalig. */
export function takeLangSwap(currentPath: string): { y: number } | null {
  try {
    const raw = sessionStorage.getItem(LANG_SWAP);
    if (!raw) return null;
    sessionStorage.removeItem(LANG_SWAP);
    const saved = JSON.parse(raw) as { path?: string; y?: number };
    return saved.path === currentPath && typeof saved.y === "number" ? { y: saved.y } : null;
  } catch {
    return null;
  }
}

/** Labels in beeld decoderen naar de nieuwe taal, de rest vervaagt kort in. */
export function langSwap(scope: ParentNode = document) {
  if (!motionOn()) {
    scope.querySelectorAll("[data-decode]").forEach((el) => el.classList.add("is-decoded"));
    return;
  }
  scope.querySelectorAll<HTMLElement>("[data-decode]").forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight * 1.2) decode(el, { duration: 360 });
    else el.classList.add("is-decoded");
  });
  scope
    .querySelectorAll<HTMLElement>(
      "h1, h2, .hero__sub, .show-row__venue, .show-row__date, .btn__label, .site-nav a, .site-footer__note",
    )
    .forEach((el) => {
      el.animate([{ opacity: 0.15 }, { opacity: 1 }], {
        duration: 240,
        easing: tok("--ease-signal"),
      });
    });
}

/**
 * De voortgangslijn: 2px teal bovenaan, voor wat even duurt.
 *
 * `start` loopt naar 85% en blijft daar wachten; `done` maakt hem af en laat
 * hem wegvagen. Zo hoeft niemand te weten hoe lang het gaat duren.
 */
let progress: Animation | null = null;

// Het element staat in de layout, niet hier aangemaakt: een knoop die React niet
// kent in een <body> die React wel beheert, is vragen om een fout bij de
// volgende render.
const progressEl = () => document.querySelector<HTMLElement>(".progress-line");

export function progressStart() {
  if (reduced()) return;
  const line = progressEl();
  if (!line) return;
  progress?.cancel();
  progress = line.animate(
    [
      { transform: "scaleX(0)", opacity: 1 },
      { transform: "scaleX(0.85)", opacity: 1 },
    ],
    { duration: 900, easing: tok("--ease-line"), fill: "forwards" },
  );
}

export function progressDone() {
  const line = progressEl();
  if (!line || !progress) return;
  progress.cancel();
  progress = line.animate(
    [
      { transform: "scaleX(0.85)", opacity: 1 },
      { transform: "scaleX(1)", opacity: 0 },
    ],
    { duration: 300, easing: tok("--ease-line"), fill: "forwards" },
  );
}

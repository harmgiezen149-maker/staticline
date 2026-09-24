import { motionOn } from "./env";

/**
 * Signaalstoring op de bandfoto's: af en toe verliest één foto even zijn
 * signaal, zoals een oud beeldscherm.
 *
 * Eén klok voor de hele pagina en niet één per foto. Met vier foto's in beeld,
 * elk op een eigen klok van 10 à 15 seconden, stoort er om de paar seconden
 * wel ergens iets, en dan is het geen storing meer maar een kapotte pagina.
 * Nu is het om de 10 à 15 seconden één foto, telkens een andere willekeurige
 * uit wat er op dat moment in beeld is.
 *
 * Hoe het eruitziet staat in `.foto-storing` in styles/motion.css; de markup in
 * components/PhotoTexture.tsx. Hier alleen: wanneer, welke, en per keer een
 * andere duur en andere banden, zodat hij zich nooit precies herhaalt.
 *
 * Staat stil zonder beweging, met het tabblad op de achtergrond, en als er geen
 * bandfoto in beeld is.
 */

const PAUSE_MIN = 10_000;
const PAUSE_MAX = 15_000;

let timer = 0;
let observer: IntersectionObserver | null = null;
const visible = new Set<HTMLElement>();

const between = (min: number, max: number) => min + Math.random() * (max - min);

/** Opnieuw beginnen met de foto's op de huidige pagina. Na elke paginawissel. */
export function initStoring(scope: ParentNode = document) {
  stopStoring();
  if (!motionOn() || !("IntersectionObserver" in window)) return;

  const layers = [...scope.querySelectorAll<HTMLElement>(".foto-storing")];
  if (layers.length === 0) return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(el);
        else visible.delete(el);
      }
    },
    // Minstens de helft in beeld: een storing op een rand die net zichtbaar
    // is, ziet niemand.
    { threshold: 0.5 },
  );
  layers.forEach((layer) => observer?.observe(layer));
  schedule();
}

export function stopStoring() {
  window.clearTimeout(timer);
  observer?.disconnect();
  observer = null;
  visible.clear();
}

function schedule() {
  timer = window.setTimeout(tick, between(PAUSE_MIN, PAUSE_MAX));
}

function tick() {
  const candidates = [...visible].filter((el) => el.isConnected);
  if (!document.hidden && candidates.length > 0) {
    disturb(candidates[Math.floor(Math.random() * candidates.length)]);
  }
  schedule();
}

/** Eén storing op één foto. */
export function disturb(layer: HTMLElement) {
  const host = layer.parentElement;
  if (!host || layer.classList.contains("is-on")) return;

  const duration = Math.round(between(600, 1000));
  layer.style.setProperty("--storing-duur", `${duration}ms`);
  host.style.setProperty("--storing-duur", `${duration}ms`);

  // Elke keer andere banden: waar ze liggen, hoe dik ze zijn, en een klein
  // verschil in wanneer ze beginnen.
  layer.querySelectorAll<HTMLElement>("i").forEach((band) => {
    band.style.setProperty("--top", `${between(0, 88).toFixed(1)}%`);
    band.style.setProperty("--hoogte", `${between(3, 18).toFixed(1)}%`);
    band.style.setProperty("--later", `${Math.round(between(0, duration * 0.25))}ms`);
  });

  layer.classList.add("is-on");
  host.classList.add("is-storing");
  window.setTimeout(() => {
    layer.classList.remove("is-on");
    host.classList.remove("is-storing");
  }, duration * 1.3);
}

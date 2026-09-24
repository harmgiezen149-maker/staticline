/**
 * Het wordmark dat bij het scrollen van de hero naar de kop vliegt.
 *
 * Alleen het rekenwerk, zonder DOM, zodat het te testen is. lib/motion/scroll.ts
 * meet de twee plekken en schrijft het resultaat weg.
 *
 * De vlucht loopt van scrollpositie 0 tot het moment waarop de onderkant van
 * het grote wordmark (op zijn eigen plek in de pagina) de onderkant van de plek
 * in de kop bereikt. Dat is precies het moment waarop het docken vóór deze
 * vlucht het kleine wordmark liet verschijnen, dus de beweging duurt even lang
 * als het wachten daarvoor.
 *
 * Onderweg ligt het wordmark tussen zijn eigen plek en de plek in de kop in.
 * Die eigen plek schuift met de pagina mee, maar nooit hoger dan de bovenkant
 * van de plek in de kop: anders zou het wordmark halverwege boven het scherm
 * uit schieten en daarna terugkomen. Zo schuift hij eerst met de pagina mee
 * omhoog, wordt hij door de kop opgevangen en krimpt hij daar in zijn plek. De verhouding loopt met een zachte S:
 * in het begin schuift hij bijna gewoon met de pagina mee, op het eind landt hij
 * rustig in de kop. Schalen doet hij alleen gelijkmatig, vanuit de linkerbovenhoek
 * — het beeld zelf wordt nooit uitgerekt.
 */

export type Box = { left: number; top: number; width: number; height: number };

export type Frame = {
  /** 0 = op zijn plek in de hero, 1 = geland in de kop. */
  progress: number;
  x: number;
  y: number;
  scale: number;
  /**
   * De overgang van het vliegende wordmark naar het vlakke in de kop, 0 → 1,
   * in het laatste stuk van de vlucht. Ze hebben dezelfde vorm; het verschil
   * is de textuur en de schaduw van het grote.
   */
  dock: number;
};

/** Het deel van de vlucht waarin het vlakke wordmark het overneemt. */
const HANDOVER = 0.15;

const clamp = (n: number) => Math.min(1, Math.max(0, n));
// Zo geschreven en niet als a + (b - a) * t: dan is het eindpunt exact b.
const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;

/** Zachte S, gelijk op met `--ease-line`: rustig weg, rustig aan. */
export const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Hoe ver de vlucht is.
 *
 * @param scrollY      de scrollpositie
 * @param from         het grote wordmark op zijn eigen plek, in schermcoördinaten
 * @param to           de plek in de kop, in schermcoördinaten
 */
export function flightProgress(scrollY: number, from: Box, to: Box): number {
  // De scrollpositie waarop de onderkant van het grote wordmark de onderkant
  // van de plek in de kop bereikt.
  const end = from.top + from.height + scrollY - (to.top + to.height);
  if (end <= 0) return 1;
  return clamp(scrollY / end);
}

export function flightFrame(scrollY: number, from: Box, to: Box): Frame {
  const progress = flightProgress(scrollY, from, to);
  const t = smooth(progress);
  const scale = from.width > 0 ? lerp(1, to.width / from.width, t) : 1;
  return {
    progress,
    x: lerp(from.left, to.left, t),
    y: lerp(Math.max(from.top, to.top), to.top, t),
    scale,
    dock: clamp((t - (1 - HANDOVER)) / HANDOVER),
  };
}

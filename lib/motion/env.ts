/**
 * Wat elke module van de motion-laag nodig heeft: de toestand op <html>, de
 * tokens uit styles/motion.css en twee kleine wachthulpjes.
 *
 * De waarden komen uit CSS en niet uit een tweede lijst hier. De Web Animations
 * API neemt een `cubic-bezier()` als tekst aan, dus een easing kan rechtstreeks
 * uit de variabele komen. Zo kunnen CSS en JavaScript niet uit de pas lopen:
 * wie een duur aanpast in de stylesheet, past hem overal aan.
 *
 * Alleen in de browser aanroepen. Niets hier leest `window` bij het importeren,
 * zodat een servercomponent dit bestand kan meenemen zonder te breken.
 */

export const root = () => document.documentElement;

/** Een token uit styles/motion.css, als tekst. */
export function tok(name: string): string {
  return getComputedStyle(root()).getPropertyValue(name).trim();
}

/** Een duur-token in milliseconden. "640ms" wordt 640. */
export function ms(name: string): number {
  return parseFloat(tok(name)) || 0;
}

/** Een percentage-token als fractie. "18%" wordt 0,18. */
export function pct(name: string): number {
  return (parseFloat(tok(name)) || 0) / 100;
}

/** Wil de bezoeker minder beweging? Het script in de kop zet dit vóór de eerste paint. */
export const reduced = () => root().classList.contains("reduce-motion");

/** Mag er bewogen worden: JavaScript aan en geen voorkeur voor minder beweging. */
export const motionOn = () => root().classList.contains("motion") && !reduced();

/** Een muis of trackpad, en geen vinger. Hover-effecten en het cursorlabel alleen hier. */
export const finePointer = () => matchMedia("(hover: hover) and (pointer: fine)").matches;

/** De mobiele stand uit het ontwerp: 640px en smaller. */
export const isMobile = () => matchMedia("(max-width: 640px)").matches;

export const wait = (t: number) => new Promise<void>((resolve) => setTimeout(resolve, t));

export const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));

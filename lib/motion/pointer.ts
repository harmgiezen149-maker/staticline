import { decode, isDecoding } from "./decode";
import { finePointer, reduced } from "./env";

/**
 * Wat alleen met een muis gebeurt: het cursorlabel en de korte scramble op
 * links bij hover. Op een telefoon bestaat geen hover, en een label dat een
 * vinger volgt zit altijd onder die vinger.
 */

/**
 * Het cursorlabel.
 *
 * Geen eigen cursor: de systeemcursor blijft staan. Wel een klein label dat
 * meeloopt waar een klik iets doet — "TICKETS ↗" op een klikbare showrij,
 * "BEKIJK" op een foto. Het volgt de muis met wat vertraging, 18px rechtsonder
 * de pointer, en klapt naar links tegen de rechterrand. `aria-hidden`: wat het
 * zegt, staat ook in de link zelf.
 */
export function initCursorLabel() {
  if (!finePointer() || reduced()) return;
  const label = document.querySelector<HTMLElement>(".cursor-label");
  if (!label) return;

  let x = -200;
  let y = -200;
  let tx = -200;
  let ty = -200;
  let current: Element | null = null;
  let running = false;

  const follow = () => {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    const width = label.offsetWidth;
    const offset = tx + 18 + width > innerWidth - 8 ? -width - 14 : 18;
    label.style.transform = `translate3d(${(x + offset).toFixed(1)}px, ${(y + 18).toFixed(1)}px, 0)`;
    if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) requestAnimationFrame(follow);
    else running = false;
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") return;
      tx = event.clientX;
      ty = event.clientY;
      if (!running) {
        running = true;
        requestAnimationFrame(follow);
      }
    },
    { passive: true },
  );

  document.addEventListener("pointerover", (event) => {
    const target = (event.target as Element | null)?.closest("[data-cursor]") ?? null;
    if (target === current) return;
    current = target;
    if (target) {
      label.textContent = target.getAttribute("data-cursor");
      label.classList.add("is-visible");
      decode(label, { duration: 360, hot: 0.18 });
    } else {
      label.classList.remove("is-visible");
    }
  });

  // Tijdens scrollen schuift de pagina onder de muis door; het label hoort
  // dan niet bij wat er nu onder de pointer staat.
  document.addEventListener(
    "scroll",
    () => {
      if (!current) return;
      current = null;
      label.classList.remove("is-visible");
    },
    { passive: true },
  );
}

/** Een korte scramble bij hover, op navigatie, statussen en het mailadres. */
export function initHoverScramble() {
  if (!finePointer()) return;
  document.addEventListener("pointerover", (event) => {
    if (reduced()) return;
    const host = (event.target as Element | null)?.closest<HTMLElement>("[data-scramble-hover]");
    if (!host || host.contains(event.relatedTarget as Node | null)) return;
    const target = host.querySelector<HTMLElement>("[data-scramble-target]") ?? host;
    if (isDecoding(target)) return;
    decode(target, { duration: 380, hot: 0.15 });
  });
}

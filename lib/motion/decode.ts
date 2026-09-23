import { ms, reduced } from "./env";

/**
 * Tekst die uit ruis tevoorschijn komt.
 *
 * De echte tekst blijft in het element staan. Hij wordt doorzichtig gemaakt
 * (zie `.is-scrambling` in styles/motion.css) en er komt een overlay overheen
 * met `aria-hidden`, waarin de ruistekens staan. Een schermlezer leest dus
 * altijd de echte tekst, en de indeling verandert niet — ook niet één pixel,
 * mits het monoletters of cijfers zijn. Gebruik dit daarom nergens anders voor.
 *
 * Tekens klikken van links naar rechts vast; het eerste derde van de tijd is
 * alles ruis. Leestekens staan meteen, zodat de vorm van de tekst leesbaar
 * blijft terwijl de letters nog storen. De ruis ververst met twintig beelden
 * per seconde: dat leest als storing en niet als flikkering (MOTION.md §8).
 */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/%&*+=<>";
const DIGITS = "0123456789";

/** Leestekens en spaties blijven staan. */
const isStable = (ch: string) => /[\s.,:·—–\-/'↗→←]/.test(ch);

const escape = (ch: string) =>
  ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === "&" ? "&amp;" : ch;

type DecodeOptions = {
  /** Totale duur in milliseconden. */
  duration?: number;
  /** Alleen cijfers als ruis, voor data en tellers. */
  digits?: boolean;
  /** Kans dat een ruisteken oplicht in rood of teal. */
  hot?: number;
};

/** Een lopende decode kan worden afgebroken; dan springt de tekst meteen goed. */
const running = new WeakMap<Element, () => void>();

export function isDecoding(el: Element): boolean {
  return running.has(el);
}

export function decode(el: HTMLElement | null, options: DecodeOptions = {}): Promise<void> {
  if (!el) return Promise.resolve();
  running.get(el)?.();

  const text = el.textContent ?? "";
  const finish = () => {
    el.classList.add("is-decoded");
    el.classList.remove("is-scrambling");
  };

  if (reduced() || !text.trim()) {
    finish();
    return Promise.resolve();
  }

  const duration = options.duration ?? 600;
  const charset =
    options.digits || el.hasAttribute("data-decode-digits") ? DIGITS : GLYPHS;
  const staggerChar = ms("--stagger-char");
  const hot = options.hot ?? 0.12;
  const chars = [...text];
  const resolveAt = chars.map((_, i) =>
    Math.min(duration, duration * 0.35 + i * staggerChar * (duration / 600)),
  );

  const overlay = document.createElement("span");
  overlay.className = "decode-overlay is-shifted";
  overlay.setAttribute("aria-hidden", "true");
  el.appendChild(overlay);
  el.classList.add("is-scrambling");
  el.classList.remove("is-decoded");

  let frameId = 0;
  let lastSlot = -1;
  const start = performance.now();

  return new Promise((resolve) => {
    const done = () => {
      cancelAnimationFrame(frameId);
      overlay.remove();
      finish();
      running.delete(el);
      resolve();
    };
    running.set(el, done);

    const frame = (now: number) => {
      const t = now - start;
      // Het element kan tussentijds uit de pagina zijn gehaald, bijvoorbeeld
      // bij een paginawissel. Dan is er niets meer om naar te kijken.
      if (t >= duration || !el.isConnected) return done();
      if (t > duration * 0.35) overlay.classList.remove("is-shifted");

      const slot = Math.floor(t / 50);
      if (slot !== lastSlot) {
        lastSlot = slot;
        let html = "";
        for (let i = 0; i < chars.length; i++) {
          const ch = chars[i];
          if (t >= resolveAt[i] || isStable(ch)) {
            html += escape(ch);
            continue;
          }
          const glyph = escape(charset[(Math.random() * charset.length) | 0]);
          const r = Math.random();
          html +=
            r < hot / 2
              ? `<span class="is-hot-red">${glyph}</span>`
              : r < hot
                ? `<span class="is-hot-teal">${glyph}</span>`
                : glyph;
        }
        overlay.innerHTML = html;
      }
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
  });
}

import { decode } from "./decode";
import { isMobile, motionOn, ms, root, tok, wait } from "./env";

/**
 * De loader "Afstemmen": tv-sneeuw, dan één lijn, dan beeld.
 *
 * De tijden staan als tokens in styles/motion.css (`--loader-*`), en zijn
 * bewust langer dan MOTION.md voorschrijft — zie daar waarom.
 *
 * Eén keer per sessie, alleen op de publieke site, en altijd over te slaan met
 * een klik, een tik of een toets. De pagina staat er al helemaal onder: de
 * loader ligt erbovenop en verbergt niets. Dat is geen detail — het wordmark in
 * de hero is het grootste element bij de eerste paint, en een loader die dat
 * verbergt schuift het meetpunt voor laadsnelheid (LCP) naar achteren.
 *
 * De teller loopt op echte gereedheid: fonts en het wordmark. Minstens
 * `--loader-min`, zodat het gebaar niet wegflitst op een snelle lijn, en nooit
 * langer dan `--loader-max`, zodat een trage lijn er niet op hoeft te wachten.
 */

export const INTRO_SEEN = "sl-intro-seen";

/**
 * Ruis op een klein canvas. Lage amplitude, van #090909 tot #393939: minder dan
 * vier procent verschil in helderheid, dus nergens een flits in de zin van
 * WCAG 2.3.1. Op een derde van de resolutie (een kwart op mobiel) en 22 beelden
 * per seconde; het canvas stopt zodra de loader dichtklapt.
 */
function startNoise(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};

  const scale = isMobile() ? 0.25 : 0.33;
  const w = Math.ceil(innerWidth * scale);
  const h = Math.ceil(innerHeight * scale);
  canvas.width = w;
  canvas.height = h;

  const image = ctx.createImageData(w, h);
  const buffer = new Uint32Array(image.data.buffer);
  let id = 0;
  let last = 0;
  let alive = true;

  const loop = (t: number) => {
    if (!alive) return;
    if (t - last > 45) {
      last = t;
      for (let i = 0; i < buffer.length; i++) {
        const v = 9 + ((Math.random() * 48) | 0);
        buffer[i] = 0xff000000 | (v << 16) | (v << 8) | v;
      }
      ctx.putImageData(image, 0, 0);
    }
    id = requestAnimationFrame(loop);
  };
  id = requestAnimationFrame(loop);

  return () => {
    alive = false;
    cancelAnimationFrame(id);
  };
}

/**
 * De loader afspelen, als hij hoort te spelen.
 *
 * Geeft `null` als er geen loader is (herhaalbezoek, minder beweging, geen
 * element), en anders een belofte die afgaat zodra het beeld opengaat — met de
 * vraag of de bezoeker hem oversloeg, want dan wordt de hero-intro de korte.
 */
export function runLoader(): Promise<{ skipped: boolean }> | null {
  const loader = document.querySelector<HTMLElement>(".loader");

  if (!loader || !root().classList.contains("sl-intro") || !motionOn()) {
    root().classList.remove("sl-intro");
    return null;
  }

  try {
    sessionStorage.setItem(INTRO_SEEN, "1");
  } catch {
    // Privévenster of geblokkeerde opslag: dan speelt hij bij elke lading. Jammer, niet erg.
  }

  const mobile = isMobile();
  const minT = ms(mobile ? "--loader-min-mobile" : "--loader-min");
  const maxT = ms(mobile ? "--loader-max-mobile" : "--loader-max");
  const collapseT = ms("--loader-collapse");
  const openT = ms("--loader-open");

  const signal = loader.querySelector<HTMLElement>(".loader__signal");
  const line = loader.querySelector<HTMLElement>(".loader__line");
  const count = loader.querySelector<HTMLElement>(".loader__count");
  const readout = loader.querySelector<HTMLElement>(".loader__readout");
  const hint = loader.querySelector<HTMLElement>(".loader__hint");
  const track = loader.querySelector<HTMLElement>(".loader__track");
  const top = loader.querySelector<HTMLElement>(".loader__panel--top");
  const bottom = loader.querySelector<HTMLElement>(".loader__panel--bottom");
  const canvas = loader.querySelector<HTMLCanvasElement>(".loader__noise");
  if (!signal || !line || !count || !readout || !top || !bottom || !canvas) {
    root().classList.remove("sl-intro");
    return null;
  }

  const stopNoise = startNoise(canvas);

  let skipped = false;
  let resolveSkip = () => {};
  const skipPromise = new Promise<void>((resolve) => (resolveSkip = resolve));
  const skip = () => {
    skipped = true;
    resolveSkip();
  };
  loader.addEventListener("pointerdown", skip, { once: true });
  window.addEventListener("keydown", skip, { once: true });

  decode(readout.firstElementChild as HTMLElement | null, { duration: 700, hot: 0.2 });
  // De storingsband loopt één keer van boven naar beneden, over bijna de hele
  // teltijd, zodat hij er nog is als de teller op 100 komt.
  track?.animate(
    [{ transform: "translate3d(0,-100%,0)" }, { transform: `translate3d(0,${innerHeight}px,0)` }],
    { duration: maxT * 0.9, easing: "linear", iterations: 1 },
  );

  // Gereed: de fonts en het gedecodeerde wordmark.
  const mark = document.querySelector<HTMLImageElement>(".hero__wordmark");
  const ready = Promise.all([
    document.fonts?.ready,
    mark?.decode ? mark.decode().catch(() => {}) : null,
  ]);
  const start = performance.now();
  let isReady = false;
  ready.then(() => (isReady = true));

  // De teller: naar 92 op tijd, van 92 naar 100 zodra alles klaar is.
  let shown = 0;
  const tick = () => {
    const t = performance.now() - start;
    const target = isReady && t >= minT ? 100 : Math.min(92, (t / maxT) * 92);
    shown += (target - shown) * 0.25;
    count.textContent = String(Math.round(shown)).padStart(3, "0");
    if (!skipped && shown < 99.5 && t < maxT + 400) requestAnimationFrame(tick);
    else count.textContent = "100";
  };
  requestAnimationFrame(tick);

  const gate = Promise.race([
    Promise.all([ready, wait(minT)]).then(() => wait(160)),
    wait(maxT),
    skipPromise,
  ]);

  const easeBand = tok("--ease-band");
  const easeCut = tok("--ease-cut");

  return gate.then(async () => {
    count.textContent = "100";
    const fast = skipped;

    // De ruis klapt samen tot één lijn.
    readout.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
    hint?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
    // Overslaan blijft snel: wie klikt, wil de pagina, niet de voorstelling.
    const collapse = signal.animate(
      [{ transform: "scaleY(1)" }, { transform: "scaleY(0.004)" }],
      { duration: fast ? 120 : collapseT, easing: easeCut, fill: "forwards" },
    );
    line.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: fast ? 60 : 120,
      delay: fast ? 80 : collapseT * 0.75,
      fill: "forwards",
    });
    await collapse.finished.catch(() => {});
    stopNoise();
    signal.style.visibility = "hidden";
    // De lijn staat even alleen in beeld voordat hij opengaat.
    await wait(fast ? 0 : 260);

    // De lijn opent zich tot beeld. De kop schuift tegelijk binnen, omdat
    // .sl-intro er nu af gaat.
    // `.is-opening` houdt de loader vast in beeld nu .sl-intro weg is; zonder
    // die klasse zou hij in één beeld verdwijnen in plaats van open te gaan.
    loader.classList.add("is-opening");
    root().classList.remove("sl-intro");
    const duration = fast ? 260 : openT;
    top.animate([{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0,-100%,0)" }], {
      duration,
      easing: easeBand,
      fill: "forwards",
    });
    const opening = bottom.animate(
      [{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0,100%,0)" }],
      { duration, easing: easeBand, fill: "forwards" },
    );
    line.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: fast ? 200 : 400,
      delay: fast ? 0 : 240,
      fill: "forwards",
    });

    opening.finished
      .catch(() => {})
      .then(() => {
        // Verbergen en niet weghalen: het element hoort bij React, en een knoop
        // die React kent maar die uit de pagina verdwenen is, geeft bij de
        // volgende render een fout.
        loader.hidden = true;
        loader.classList.remove("is-opening");
        window.removeEventListener("keydown", skip);
      });

    return { skipped: fast };
  });
}

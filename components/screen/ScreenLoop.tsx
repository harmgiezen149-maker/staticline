"use client";

import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { decode } from "@/lib/motion/decode";
import { ms, reduced, tok, wait } from "@/lib/motion/env";
import { startNoise } from "@/lib/motion/loader";
import {
  type ScreenConfig,
  type ScreenFormat,
  type ScreenItem,
  noiseBrightness,
  createPlaylist,
  noiseDuration,
  ratioOf,
  sequence,
} from "@/lib/screen";

/**
 * Het scherm: de loader "Afstemmen" als lus.
 *
 * Geëxtrapoleerd, niet ontworpen. Het gebaar is dat van de startanimatie op de
 * homepage (lib/motion/loader.ts), met dezelfde tokens en dezelfde ruis:
 *
 *   ruis met het label en de teller → de ruis klapt samen tot één lijn → de
 *   lijn opent zich tot beeld → het beeld staat → de banden sluiten weer tot
 *   de lijn → de lijn springt open tot ruis → het volgende beeld.
 *
 * Het beeld onder de banden is een tekst, een foto met een instelbare dekking,
 * of het wordmark. De scanlines horen bij de ruisfase en staan dus alleen
 * tijdens een wissel in beeld (AFW-2).
 *
 * De ruis kan ook tijdens het staan over een beeld liggen, met een eigen
 * transparantie per beeld (ook bij het wordmark): een tweede canvas boven het
 * beeld en onder de banden. Hoe lang de ruis bij een wissel staat en hoe licht
 * hij is, stel je in /beheer/scherm in.
 *
 * Met minder beweging geen ruis en geen banden: de beelden wisselen met een
 * korte crossfade, zoals de paginawissel dat dan ook doet (MOTION.md §7).
 *
 * Voor een podium: de cursor verdwijnt na een paar seconden stilstand, het
 * scherm valt niet in slaap (wake lock, waar de browser dat kan), F zet
 * volledig scherm aan en uit, → slaat een beeld over. Elke tien seconden haalt het de
 * instelling opnieuw op. Formaat, eigen maat en helderheid gaan meteen in;
 * de beelden zelf bij de volgende wissel.
 */

type Props = {
  initial: ScreenConfig;
  wordmark: { src: string; width: number; height: number };
  /** Formaat uit het adres; null = de instelling uit het beheer. */
  format: ScreenFormat | null;
  /** In het voorbeeld in /beheer/scherm: geen knoppen, geen wake lock. */
  preview: boolean;
};

/**
 * Hoe vaak een draaiend scherm de instelling opnieuw ophaalt. Tien seconden
 * en niet een minuut: bij het passend maken van "eigen maat" op het scherm in
 * de beeldbuis wil je zien wat een schuif doet zonder lang te wachten. Het is
 * één klein verzoek dat op de server uit de cache komt.
 */
const POLL_MS = 10_000;

/**
 * Wat het kader bepaalt: formaat, eigen maat en helderheid. Een wijziging
 * daarin gaat meteen in; de beelden zelf wisselen pas bij de volgende wissel.
 */
const lookOf = (c: ScreenConfig) => ({ format: c.format, custom: c.custom, noiseLevel: c.noiseLevel });
/** Na zoveel stilstand verdwijnen de cursor en de knop. */
const IDLE_MS = 2500;

const DEFAULT_LABEL = "Signaal zoeken";

const labelOf = (item: ScreenItem | undefined) =>
  !item ? DEFAULT_LABEL : item.kind === "logo" ? "Static Line" : item.slide.label || DEFAULT_LABEL;

/** Een animatie afspelen en de eindstand vastzetten, zodat er niets blijft hangen. */
async function play(el: Element | null, frames: Keyframe[], options: KeyframeAnimationOptions) {
  if (!el) return;
  const animation = el.animate(frames, { fill: "forwards", ...options });
  await animation.finished.catch(() => {});
  try {
    animation.commitStyles();
  } catch {
    // Element niet meer zichtbaar of uit de pagina: niets om vast te zetten.
  }
  animation.cancel();
}

/** Wachten op de foto in beeld, maar nooit langer dan de ruis kan duren. */
function photoReady(stage: HTMLElement | null, limit: number) {
  const img = stage?.querySelector<HTMLImageElement>(".scr__photo, .scr__logo img");
  if (!img || img.complete) return Promise.resolve();
  return Promise.race([
    new Promise<void>((resolve) => {
      img.addEventListener("load", () => resolve(), { once: true });
      img.addEventListener("error", () => resolve(), { once: true });
    }),
    wait(limit),
  ]);
}

export function ScreenLoop({ initial, wordmark, format, preview }: Props) {
  const [config, setConfig] = useState(initial);
  const [look, setLook] = useState(() => lookOf(initial));
  // Wat er nu staat en wat er hierna komt. De lus kiest ze uit de
  // afspeellijst (willekeurig met "hoe vaak", of de vaste volgorde); `n` telt
  // door, zodat elk beeld een eigen `key` krijgt, ook als hetzelfde beeld
  // later terugkomt. Op de server en bij de eerste paint het eerste beeld
  // uit de lijst, zodat de HTML vaststaat.
  const [view, setView] = useState<{ n: number; item: ScreenItem; next: ScreenItem | null }>(() => ({
    n: 0,
    item: sequence(initial)[0],
    next: null,
  }));
  const [readout, setReadout] = useState(labelOf(view.item));
  const [idle, setIdle] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // De lus houdt zijn eigen stand bij en begint bij wat de server meegaf; een
  // nieuwe instelling komt via `pending` binnen (zie de lus).
  const start = useRef(initial);
  const pending = useRef<ScreenConfig | null>(null);
  const current = useRef(JSON.stringify(initial));
  const skip = useRef<() => void>(() => {});

  const frame = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const signal = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const overlayCanvas = useRef<HTMLCanvasElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  // ── De lus ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    const motion = !reduced();

    const collapseT = ms("--loader-collapse") || 520;
    const openT = ms("--loader-open") || 1000;
    const easeBand = tok("--ease-band") || "ease-in-out";
    const easeCut = tok("--ease-cut") || "ease-in";

    let stopNoise = () => {};
    const noise = () => {
      stopNoise();
      if (canvas.current) stopNoise = startNoise(canvas.current);
    };

    // Wachten, tenzij iemand op → drukt of het scherm stopt.
    const hold = (t: number) =>
      new Promise<void>((resolve) => {
        const id = setTimeout(resolve, t);
        skip.current = () => {
          clearTimeout(id);
          resolve();
        };
      });

    // De teller van 000 naar 100 in de ruisfase.
    const countUp = (t: number) => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / t);
        if (count.current) count.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
        if (p < 1 && alive) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    // Ruis → lijn → beeld. Het beeld staat er al onder. `noiseT` is hoe lang
    // de ruis met het label staat, uit de instelling.
    const reveal = async (noiseT: number) => {
      countUp(noiseT);
      await Promise.all([
        decode(label.current, { duration: Math.min(700, noiseT * 0.8), hot: 0.2 }),
        wait(noiseT),
        photoReady(stage.current, Math.max(noiseT, 1500)),
      ]);
      if (!alive) return;

      void play(text.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 });
      void play(line.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: collapseT * 0.75 });
      await play(signal.current, [{ transform: "scaleY(1)" }, { transform: "scaleY(0.004)" }], { duration: collapseT, easing: easeCut });
      stopNoise();
      if (signal.current) signal.current.style.visibility = "hidden";
      await wait(260);
      if (!alive) return;

      void play(line.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 240 });
      await Promise.all([
        play(top.current, [{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0,-100%,0)" }], { duration: openT, easing: easeBand }),
        play(bottom.current, [{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0,100%,0)" }], { duration: openT, easing: easeBand }),
      ]);
      const title = stage.current?.querySelector<HTMLElement>(".scr__title");
      void decode(title ?? null, { duration: 900, hot: 0.12 });
    };

    // Beeld → lijn → ruis: de banden sluiten, de lijn springt open.
    const cover = async () => {
      const closeT = openT * 0.7;
      void play(line.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: closeT * 0.8 });
      await Promise.all([
        play(top.current, [{ transform: "translate3d(0,-100%,0)" }, { transform: "translate3d(0,0,0)" }], { duration: closeT, easing: easeBand }),
        play(bottom.current, [{ transform: "translate3d(0,100%,0)" }, { transform: "translate3d(0,0,0)" }], { duration: closeT, easing: easeBand }),
      ]);
      await wait(200);
      if (!alive) return;
      if (signal.current) signal.current.style.visibility = "visible";
      noise();
      void play(line.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, delay: collapseT * 0.5 });
      void play(text.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: collapseT * 0.6 });
      await play(signal.current, [{ transform: "scaleY(0.004)" }, { transform: "scaleY(1)" }], { duration: collapseT, easing: easeBand });
    };

    // Wacht één beeld zodat React de nieuwe inhoud onder de banden getekend heeft.
    const painted = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const run = async () => {
      let cfg = start.current;
      let current: ScreenItem = sequence(cfg)[0];
      const idOf = (item: ScreenItem) => (item.kind === "slide" ? item.slide.id : null);
      let list = createPlaylist(cfg, Math.random, idOf(current));
      let upcoming = list.next();
      let n = 0;
      if (motion) noise();
      while (alive) {
        // Een nieuwe instelling gaat in bij de wissel, niet midden in een beeld.
        if (pending.current) {
          cfg = pending.current;
          pending.current = null;
          setConfig(cfg);
          list = createPlaylist(cfg, Math.random, idOf(current));
          upcoming = list.next();
        }
        setView({ n, item: current, next: upcoming });
        setReadout(labelOf(current));
        await painted();
        if (!alive) return;

        // Elke wissel een andere ruisduur, tussen het minimum en het maximum.
        if (motion) await reveal(noiseDuration(cfg));
        else await photoReady(stage.current, 1500);
        if (!alive) return;

        await hold(cfg.seconds * 1000);
        if (!alive) return;

        if (motion) await cover();
        n += 1;
        current = upcoming;
        upcoming = list.next();
      }
    };
    void run();

    return () => {
      alive = false;
      skip.current();
      stopNoise();
    };
  }, []);

  // ── Nieuwe instelling ophalen ───────────────────────────────────────────
  useEffect(() => {
    if (preview) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/scherm", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as ScreenConfig;
        const json = JSON.stringify(next);
        if (json === current.current) return;
        current.current = json;
        pending.current = next;
        setLook(lookOf(next));
      } catch {
        // Geen verbinding in de zaal: dan draait gewoon door wat er staat.
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [preview]);

  // ── Wakker blijven, cursor, toetsen ─────────────────────────────────────
  useEffect(() => {
    if (preview) return;
    type Sentinel = { release: () => Promise<void> };
    type WakeLockApi = { request: (type: "screen") => Promise<Sentinel> };
    let lock: Sentinel | null = null;
    const nav = navigator as Navigator & { wakeLock?: WakeLockApi };
    const keepAwake = async () => {
      if (document.visibilityState !== "visible" || !nav.wakeLock) return;
      try {
        lock = await nav.wakeLock.request("screen");
      } catch {
        // Niet toegestaan (energiebesparing, geen https): dan maar zonder.
      }
    };
    void keepAwake();
    document.addEventListener("visibilitychange", keepAwake);

    let timer = setTimeout(() => setIdle(true), IDLE_MS);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), IDLE_MS);
    };
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "ArrowRight") skip.current();
    };
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("visibilitychange", keepAwake);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      clearTimeout(timer);
      void lock?.release().catch(() => {});
    };
  }, [preview]);

  // ── De tekst zo groot als past ──────────────────────────────────────────
  const fit = useCallback(() => {
    const box = frame.current;
    const el = stage.current?.querySelector<HTMLElement>(".scr__title");
    const copy = el?.parentElement;
    if (!box || !el || !copy) return;
    const maxH = box.clientHeight * 0.62;
    let lo = 12;
    let hi = Math.max(lo, Math.min(box.clientHeight * 0.4, box.clientWidth * 0.3));
    // Zoeken naar de grootste maat waarbij het langste woord past en het
    // geheel niet hoger wordt dan ruim de helft van het beeld. Tijdens het
    // meten mag een woord niet afbreken, anders past alles altijd; daarna
    // staat het afbreken weer aan als vangnet voor één heel lang woord.
    //
    // Gemeten met een Range en niet met scrollWidth: die rondt af op hele
    // pixels, en een woord dat een halve pixel te breed is, breekt dan toch.
    el.style.overflowWrap = "normal";
    const range = document.createRange();
    range.selectNodeContents(el);
    const room = copy.getBoundingClientRect().width - 2;
    for (let n = 0; n < 14; n++) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      const fits = range.getBoundingClientRect().width <= room && el.offsetHeight <= maxH;
      if (fits) lo = mid;
      else hi = mid;
    }
    el.style.fontSize = `${Math.floor(lo)}px`;
    el.style.overflowWrap = "";
  }, []);

  useLayoutEffect(fit, [fit, view]);
  useEffect(() => {
    if (!frame.current) return;
    const observer = new ResizeObserver(fit);
    observer.observe(frame.current);
    // De monoletter komt via `display: swap` binnen; gemeten met de
    // vervangende letter klopt de maat daarna niet meer.
    void document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [fit]);

  const effective = format ?? look.format;
  const ratio = ratioOf(effective);
  const { custom } = look;
  const frameStyle = {
    ...(effective === "eigen"
      ? // Eigen maat: een kader in procenten van het scherm, verschoven vanaf
        // het midden. Voor het stuk lcd dat achter het glas van de beeldbuis zit.
        { width: `${custom.width}vw`, height: `${custom.height}dvh`, translate: `${custom.x}vw ${custom.y}dvh` }
      : ratio
        ? { aspectRatio: String(ratio), width: `min(100vw, calc(100dvh * ${ratio}))` }
        : { width: "100vw", height: "100dvh" }),
    "--noise-brightness": String(noiseBrightness(look.noiseLevel)),
  } as unknown as CSSProperties;
  // Hulplijnen bij elk formaat; de maten alleen bij "eigen", want alleen
  // daar stel je ze zelf in.
  const guides = custom.guides;
  const pctText = (n: number) => `${String(n).replace(".", ",")}%`;

  const { item } = view;
  // Ruis over het staande beeld: per beeld, of bij het wordmark.
  const overlay = !item ? 0 : item.kind === "logo" ? config.logo.noise : item.slide.noise;
  const overlayOn = overlay > 0;

  // ── Ruis over het beeld ─────────────────────────────────────────────────
  // Draait alleen zolang het beeld in beeld er ruis over wil; bij 0 staat het
  // canvas stil, zodat een scherm zonder overlay niets extra rekent. Met minder
  // beweging nooit.
  useEffect(() => {
    if (!overlayOn || reduced() || !overlayCanvas.current) return;
    return startNoise(overlayCanvas.current);
  }, [overlayOn]);
  const next = view.next;
  const nextPhoto = next?.kind === "slide" ? next.slide.photo : "";

  return (
    <main className={`scr${idle ? " is-idle" : ""}`}>
      <div ref={frame} className="scr__frame" style={frameStyle}>
        {/* Het beeld. Een nieuwe `key` per beeld: dan begint React met een
            schone tekst, en loopt een decode niet over twee beelden heen. */}
        <div ref={stage} className="scr__stage" key={`${view.n}-${item?.kind === "slide" ? item.slide.id : "logo"}`}>
          {item?.kind === "logo" ? (
            <div className="scr__logo">
              <Image src={wordmark.src} width={wordmark.width} height={wordmark.height} alt="Static Line" priority sizes="70vw" />
            </div>
          ) : item ? (
            <>
              {item.slide.photo && (
                <Image
                  className="scr__photo"
                  src={item.slide.photo}
                  alt=""
                  fill
                  sizes="100vw"
                  priority
                  style={{ opacity: item.slide.opacity / 100 }}
                />
              )}
              {(item.slide.label || item.slide.title) && (
                <div className="scr__copy">
                  {item.slide.label && <p className="scr__label">{item.slide.label}</p>}
                  {item.slide.title && (
                    <p className="scr__title" data-decode="">
                      {item.slide.title}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* De volgende foto alvast ophalen, onzichtbaar. */}
        {nextPhoto && (
          <div className="scr__preload" aria-hidden="true">
            <Image src={nextPhoto} alt="" fill sizes="100vw" loading="eager" />
          </div>
        )}

        {/* Ruis over het staande beeld, met de transparantie van dit beeld. */}
        <canvas
          ref={overlayCanvas}
          className="scr__noise scr__overlay"
          aria-hidden="true"
          style={{ opacity: overlay / 100 }}
        />

        {/* De ruis en de banden, zoals de loader op de homepage. */}
        <div className="scr__veil" aria-hidden="true">
          <div ref={top} className="scr__panel scr__panel--top" />
          <div ref={bottom} className="scr__panel scr__panel--bottom" />
          <div ref={signal} className="scr__signal">
            <canvas ref={canvas} className="scr__noise" />
            <div className="scr__scan" />
          </div>
          <div ref={line} className="scr__line" />
          <div ref={text} className="scr__readout">
            <span ref={label} key={readout} data-decode="">
              {readout}
            </span>
            <span ref={count} className="scr__count">
              000
            </span>
          </div>
        </div>

        {/* Hulplijnen bij het passend maken: de rand van het kader, een kruis
            in het midden en de maten. Uit te zetten in /beheer/scherm. */}
        {guides && (
          <div className="scr__guides" aria-hidden="true">
            <span className="scr__guides-label">
              {effective === "eigen"
                ? `${pctText(custom.width)} × ${pctText(custom.height)} · x ${pctText(custom.x)} · y ${pctText(custom.y)}`
                : effective === "auto"
                  ? "Automatisch"
                  : effective}
            </span>
          </div>
        )}
      </div>

      {!preview && !fullscreen && (
        <button type="button" className="scr__button" onClick={toggleFullscreen}>
          Volledig scherm <span aria-hidden="true">· F</span>
        </button>
      )}
    </main>
  );
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}

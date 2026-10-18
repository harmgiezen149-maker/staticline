"use client";

import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { decode } from "@/lib/motion/decode";
import { ms, reduced, tok, wait } from "@/lib/motion/env";
import { startNoise } from "@/lib/motion/loader";
import { startColorNoise } from "@/lib/screen-noise";
import { startWarp } from "@/lib/screen-warp";
import {
  type ScreenConfig,
  type ScreenFormat,
  type NowPlaying,
  type ScreenItem,
  type NoiseStyle,
  NOT_PLAYING,
  NOW_LABEL,
  createPlaylist,
  glitchTiming,
  noiseBrightness,
  nextShowable,
  noiseDuration,
  transitionTiming,
  unrestTiming,
  ratioOf,
  sequence,
  showable,
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
/** Hoe vaak het nummer uit de Band App opgehaald wordt, als er een nu-speelt-beeld is. */
const NOW_POLL_MS = 4_000;

/**
 * Wat het kader bepaalt: formaat, eigen maat en helderheid. Een wijziging
 * daarin gaat meteen in; de beelden zelf wisselen pas bij de volgende wissel.
 */
const lookOf = (c: ScreenConfig) => ({
  format: c.format,
  custom: c.custom,
  noiseLevel: c.noiseLevel,
  noiseStyle: c.noiseStyle,
  readout: c.readout,
  unrest: c.unrest,
  glitch: c.glitch,
});

/** De ruis tekenen in de gekozen soort; geeft de functie om te stoppen. */
const runNoise = (canvas: HTMLCanvasElement, style: NoiseStyle) =>
  style === "kleur" ? startColorNoise(canvas) : startNoise(canvas);

const between = (min: number, max: number) => min + Math.random() * (max - min);
/** Na zoveel stilstand verdwijnen de cursor en de knop. */
const IDLE_MS = 2500;

const DEFAULT_LABEL = "Signaal zoeken";

const labelOf = (item: ScreenItem | undefined) =>
  !item
    ? DEFAULT_LABEL
    : item.kind === "logo"
      ? "Static Line"
      : item.slide.label || (item.slide.source === "nu" ? NOW_LABEL : DEFAULT_LABEL);

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

/** Meteen naar een stand, zonder beweging; dezelfde eindstand als `play`. */
const jump = (el: Element | null, frame: Keyframe) => play(el, [frame, frame], { duration: 1 });

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
  // Het nummer dat de band nu speelt, voor een nu-speelt-beeld. De lus leest
  // het via de ref, het beeld zelf via de stand.
  const [now, setNow] = useState<NowPlaying>(NOT_PLAYING);
  const nowRef = useRef<NowPlaying>(NOT_PLAYING);
  // Een hoes die niet laadt (verlopen adres, geen verbinding): dan de eigen
  // foto van het beeld, in plaats van een kapot plaatje.
  const [badCover, setBadCover] = useState("");
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
  const glitchLayer = useRef<HTMLDivElement>(null);
  // Of er nu een beeld staat (en dus niet net ruis, een lijn of een wissel):
  // alleen dan komen er glitches.
  const holding = useRef(false);
  // De soort ruis voor de volgende wissel; de lus leest hem pas als hij ruis
  // start, zodat een nieuwe instelling niet midden in een wissel omslaat.
  const noiseStyle = useRef(initial.noiseStyle);
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

    const base = { collapse: ms("--loader-collapse") || 520, open: ms("--loader-open") || 1000 };
    const easeBand = tok("--ease-band") || "ease-in-out";
    const easeCut = tok("--ease-cut") || "ease-in";

    let stopNoise = () => {};
    const noise = () => {
      stopNoise();
      if (canvas.current) stopNoise = runNoise(canvas.current, noiseStyle.current);
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
    type Timing = ReturnType<typeof transitionTiming>;
    const reveal = async (noiseT: number, tt: Timing, bands: boolean) => {
      countUp(noiseT);
      await Promise.all([
        decode(label.current, { duration: Math.min(700, noiseT * 0.8), hot: 0.2 }),
        wait(noiseT),
        photoReady(stage.current, Math.max(noiseT, 1500)),
      ]);
      if (!alive) return;

      // Zonder banden: een harde knip van de ruis naar het beeld. De banden
      // gaan onzichtbaar open, zodat de stand daarna dezelfde is als mét.
      if (!bands) {
        // Eerst de banden weg onder de ruis, dan de ruis: anders is er één
        // beeld lang zwart te zien.
        await Promise.all([
          jump(line.current, { opacity: 0 }),
          jump(top.current, { transform: "translate3d(0,-100%,0)" }),
          jump(bottom.current, { transform: "translate3d(0,100%,0)" }),
        ]);
        stopNoise();
        if (signal.current) signal.current.style.visibility = "hidden";
        await jump(text.current, { opacity: 0 });
        const title = stage.current?.querySelector<HTMLElement>(".scr__title");
        void decode(title ?? null, { duration: 900, hot: 0.12 });
        return;
      }

      void play(text.current, [{ opacity: 1 }, { opacity: 0 }], { duration: Math.min(120, tt.fade) });
      void play(line.current, [{ opacity: 0 }, { opacity: 1 }], { duration: Math.min(120, tt.fade), delay: tt.collapse * 0.75 });
      await play(signal.current, [{ transform: "scaleY(1)" }, { transform: "scaleY(0.004)" }], { duration: tt.collapse, easing: easeCut });
      stopNoise();
      if (signal.current) signal.current.style.visibility = "hidden";
      await wait(tt.gap);
      if (!alive) return;

      void play(line.current, [{ opacity: 1 }, { opacity: 0 }], { duration: tt.lineOut, delay: tt.lineDelay });
      await Promise.all([
        play(top.current, [{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0,-100%,0)" }], { duration: tt.open, easing: easeBand }),
        play(bottom.current, [{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0,100%,0)" }], { duration: tt.open, easing: easeBand }),
      ]);
      const title = stage.current?.querySelector<HTMLElement>(".scr__title");
      void decode(title ?? null, { duration: 900, hot: 0.12 });
    };

    // Beeld → lijn → ruis: de banden sluiten, de lijn springt open.
    const cover = async (tt: Timing, bands: boolean) => {
      // Zonder banden: meteen ruis over het beeld. De banden sluiten eronder,
      // onzichtbaar, zodat de stand dezelfde is als na een wissel mét.
      if (!bands) {
        await jump(signal.current, { transform: "scaleY(1)" });
        if (signal.current) signal.current.style.visibility = "visible";
        noise();
        await Promise.all([
          jump(top.current, { transform: "translate3d(0,0,0)" }),
          jump(bottom.current, { transform: "translate3d(0,0,0)" }),
          jump(line.current, { opacity: 0 }),
          jump(text.current, { opacity: 1 }),
        ]);
        return;
      }
      void play(line.current, [{ opacity: 0 }, { opacity: 1 }], { duration: tt.fade, delay: tt.close * 0.8 });
      await Promise.all([
        play(top.current, [{ transform: "translate3d(0,-100%,0)" }, { transform: "translate3d(0,0,0)" }], { duration: tt.close, easing: easeBand }),
        play(bottom.current, [{ transform: "translate3d(0,100%,0)" }, { transform: "translate3d(0,0,0)" }], { duration: tt.close, easing: easeBand }),
      ]);
      await wait(tt.settle);
      if (!alive) return;
      if (signal.current) signal.current.style.visibility = "visible";
      noise();
      void play(line.current, [{ opacity: 1 }, { opacity: 0 }], { duration: tt.fade, delay: tt.collapse * 0.5 });
      void play(text.current, [{ opacity: 0 }, { opacity: 1 }], { duration: tt.fade, delay: tt.collapse * 0.6 });
      await play(signal.current, [{ transform: "scaleY(0.004)" }, { transform: "scaleY(1)" }], { duration: tt.collapse, easing: easeBand });
    };

    // Wacht één beeld zodat React de nieuwe inhoud onder de banden getekend heeft.
    const painted = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const run = async () => {
      let cfg = start.current;
      let current: ScreenItem = sequence(cfg)[0];
      // Een nu-speelt-beeld zonder nummer wordt overgeslagen; zie showable.
      const pick = () => nextShowable(list, nowRef.current);
      const idOf = (item: ScreenItem) => (item.kind === "slide" ? item.slide.id : null);
      let list = createPlaylist(cfg, Math.random, idOf(current));
      if (!showable(current, nowRef.current)) current = pick();
      let upcoming = pick();
      let n = 0;
      if (motion) noise();
      while (alive) {
        // Een nieuwe instelling gaat in bij de wissel, niet midden in een beeld.
        if (pending.current) {
          cfg = pending.current;
          pending.current = null;
          setConfig(cfg);
          list = createPlaylist(cfg, Math.random, idOf(current));
          upcoming = pick();
        }
        setView({ n, item: current, next: upcoming });
        setReadout(labelOf(current));
        await painted();
        if (!alive) return;

        // Elke wissel een andere ruisduur, tussen het minimum en het maximum.
        if (motion) await reveal(noiseDuration(cfg), transitionTiming(cfg.speed, base), cfg.bands);
        else await photoReady(stage.current, 1500);
        if (!alive) return;

        holding.current = true;
        await hold(cfg.seconds * 1000);
        holding.current = false;
        if (!alive) return;

        // De snelheid van deze wissel; een nieuwe instelling gaat pas bij het
        // volgende beeld in, zodat een wissel niet halverwege van tempo verandert.
        if (motion) await cover(transitionTiming(cfg.speed, base), cfg.bands);
        n += 1;
        // Opnieuw kijken: het nummer kan intussen gestopt zijn.
        current = showable(upcoming, nowRef.current) ? upcoming : pick();
        upcoming = pick();
      }
    };
    void run();

    return () => {
      alive = false;
      skip.current();
      stopNoise();
    };
  }, []);

  // ── Het nummer dat nu gespeeld wordt ────────────────────────────────────
  // Alleen als er een nu-speelt-beeld in de lijst staat. De stand houdt het
  // laatste nummer vast, zodat een beeld dat al staat niet leeg valt als de
  // bediener net stopt; de lus kijkt naar de ref, en slaat het beeld daarna over.
  const hasNow = config.slides.some((s) => s.source === "nu");
  useEffect(() => {
    if (!hasNow) {
      nowRef.current = NOT_PLAYING;
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/scherm/nu", { cache: "no-store" });
        if (!res.ok || !alive) return;
        const next = (await res.json()) as NowPlaying;
        nowRef.current = next;
        if (next.live) setNow((cur) => (cur.title === next.title && cur.artist === next.artist && cur.coverUrl === next.coverUrl ? cur : next));
      } catch {
        // Geen verbinding: dan blijft staan wat er stond.
      }
    };
    void load();
    const id = setInterval(load, NOW_POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [hasNow]);

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
        noiseStyle.current = next.noiseStyle;
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

  // ── Glitches ────────────────────────────────────────────────────────────
  // Korte storingen terwijl een beeld staat, op een eigen klok: na een
  // willekeurige pauze een storing van een willekeurige duur, met elke keer
  // andere banden. Hoe het eruitziet staat bij `.is-glitching` in
  // styles/screen.css; hier alleen wanneer, hoe lang en hoe ver. Dezelfde
  // aanpak als de signaalstoring op de bandfoto's (lib/motion/storing.ts).
  // Niet bij minder beweging, en niet met het tabblad op de achtergrond.
  useEffect(() => {
    const timing = glitchTiming(look.glitch);
    const box = frame.current;
    if (!timing.on || reduced() || !box) return;
    let timer = 0;
    let off = 0;
    const burst = () => {
      const layer = glitchLayer.current;
      if (layer && holding.current && !document.hidden) {
        const duration = Math.round(between(...timing.duration));
        box.style.setProperty("--glitch-dur", `${duration}ms`);
        box.style.setProperty("--glitch-px", `${Math.round(between(0.5, 1) * timing.shift)}px`);
        layer.querySelectorAll<HTMLElement>("i").forEach((band) => {
          band.style.setProperty("--top", `${between(0, 92).toFixed(1)}%`);
          band.style.setProperty("--hoogte", `${between(1.5, 14).toFixed(1)}%`);
          band.style.setProperty("--later", `${Math.round(between(0, duration * 0.3))}ms`);
          band.style.setProperty("--opzij", `${between(-12, 12).toFixed(1)}%`);
        });
        box.classList.remove("is-glitching");
        void box.offsetWidth; // opnieuw starten, ook als de vorige net klaar is
        box.classList.add("is-glitching");
        off = window.setTimeout(() => box.classList.remove("is-glitching"), duration * 1.2);
      }
      timer = window.setTimeout(burst, between(...timing.pause));
    };
    timer = window.setTimeout(burst, between(...timing.pause));
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(off);
      box.classList.remove("is-glitching");
    };
  }, [look.glitch]);

  // ── Signaal kwijt ───────────────────────────────────────────────────────
  // Af en toe verliest de foto zijn signaal, zoals een tv die zijn
  // synchronisatie kwijtraakt: het beeld golft, scheurt in stroken, rolt en
  // sneeuwt. Dat tekent lib/screen-warp.ts op het canvas naast de foto; zolang
  // dat loopt staat `.is-warping` op .scr__tv en is de foto zelf verborgen.
  // Het trillen en flikkeren daartussen is CSS (`.is-unrest`). Net als de
  // glitches alleen als er een beeld staat, niet bij minder beweging en niet
  // op de achtergrond.
  useEffect(() => {
    const timing = unrestTiming(look.unrest);
    const box = frame.current;
    if (!timing.on || reduced() || !box) return;
    let timer = 0;
    let stop = () => {};
    const fire = () => {
      const tv = box.querySelector<HTMLElement>(".scr__tv");
      const img = tv?.querySelector<HTMLImageElement>(".scr__photo");
      const canvas = tv?.querySelector<HTMLCanvasElement>(".scr__warp");
      if (tv && img && canvas && img.complete && img.naturalWidth && holding.current && !document.hidden) {
        tv.classList.add("is-warping");
        stop = startWarp(canvas, img, {
          strength: timing.strength * between(0.6, 1),
          duration: between(...timing.duration),
          onDone: () => tv.classList.remove("is-warping"),
        });
      }
      timer = window.setTimeout(fire, between(...timing.pause));
    };
    timer = window.setTimeout(fire, between(...timing.pause));
    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, [look.unrest]);

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

  useLayoutEffect(fit, [fit, view, now]);
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
  const unrest = unrestTiming(look.unrest);
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
    "--noise-brightness": String(noiseBrightness(look.noiseLevel, look.noiseStyle)),
    "--jitter": `${unrest.jitter}cqmin`,
    "--flicker": String(unrest.flicker),
  } as unknown as CSSProperties;
  // Hulplijnen bij elk formaat; de maten alleen bij "eigen", want alleen
  // daar stel je ze zelf in.
  const guides = custom.guides;
  const pctText = (n: number) => `${String(n).replace(".", ",")}%`;

  const { item } = view;
  // De foto van een beeld. De hoes van het nummer is een gewone <img>, want
  // die staat op Spotify en next.config.ts laat alleen de eigen opslag toe.
  const shot = (cover: string, photo: string, opacity: number) =>
    cover ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="scr__photo scr__cover"
        src={cover}
        alt=""
        style={{ opacity: opacity / 100 }}
        onError={() => setBadCover(cover)}
      />
    ) : (
      <Image
        className="scr__photo"
        src={photo}
        alt=""
        fill
        sizes="100vw"
        priority
        style={{ opacity: opacity / 100 }}
      />
    );
  // Wat er op een beeld staat. Bij een nu-speelt-beeld de titel, artiest en
  // hoes van het nummer; anders wat er is ingevuld.
  const copy =
    item?.kind === "slide" && item.slide.source === "nu"
      ? {
          label: item.slide.label || NOW_LABEL,
          title: now.title,
          artist: now.artist,
          cover: item.slide.cover && now.coverUrl !== badCover ? now.coverUrl : "",
        }
      : item?.kind === "slide"
        ? { label: item.slide.label, title: item.slide.title, artist: "", cover: "" }
        : { label: "", title: "", artist: "", cover: "" };
  // Ruis over het staande beeld: per beeld, of bij het wordmark.
  const overlay = !item ? 0 : item.kind === "logo" ? config.logo.noise : item.slide.noise;
  const overlayOn = overlay > 0;

  // ── Ruis over het beeld ─────────────────────────────────────────────────
  // Draait alleen zolang het beeld in beeld er ruis over wil; bij 0 staat het
  // canvas stil, zodat een scherm zonder overlay niets extra rekent. Met minder
  // beweging nooit.
  useEffect(() => {
    if (!overlayOn || reduced() || !overlayCanvas.current) return;
    return runNoise(overlayCanvas.current, look.noiseStyle);
  }, [overlayOn, look.noiseStyle]);
  const next = view.next;
  const nextPhoto = next?.kind === "slide" ? next.slide.photo : "";

  return (
    <main className={`scr${idle ? " is-idle" : ""}`}>
      <div ref={frame} className={`scr__frame${unrest.on ? " is-unrest" : ""}`} style={frameStyle}>
        {/* Het beeld. Een nieuwe `key` per beeld: dan begint React met een
            schone tekst, en loopt een decode niet over twee beelden heen. */}
        <div ref={stage} className="scr__stage" key={`${view.n}-${item?.kind === "slide" ? item.slide.id : "logo"}`}>
          {item?.kind === "logo" ? (
            <div className="scr__logo">
              <Image src={wordmark.src} width={wordmark.width} height={wordmark.height} alt="Static Line" priority sizes="70vw" />
            </div>
          ) : item ? (
            <>
              {/* De foto als op een tv met slechte ontvangst: hij trilt en
                  flikkert in .scr__tv, en als het signaal even weg is tekent
                  het canvas ernaast hem golvend en gescheurd (zie het effect
                  "Signaal kwijt" hierboven). */}
              {(copy.cover || item.slide.photo) && (
                <div className="scr__tv">
                  <div className="scr__shot">{shot(copy.cover, item.slide.photo, item.slide.opacity)}</div>
                  {look.unrest > 0 && (
                    <canvas className="scr__warp" aria-hidden="true" style={{ opacity: item.slide.opacity / 100 }} />
                  )}
                </div>
              )}
              {(copy.label || copy.title) && (
                <div className="scr__copy">
                  {copy.label && <p className="scr__label">{copy.label}</p>}
                  {copy.title && (
                    <p className="scr__title" data-decode="">
                      {copy.title}
                    </p>
                  )}
                  {copy.artist && <p className="scr__artist">{copy.artist}</p>}
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

        {/* De banden sneeuw van een glitch. Altijd in de markup, verborgen tot
            het kader `.is-glitching` krijgt; zie het effect hierboven. */}
        <div ref={glitchLayer} className="scr__glitch" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>

        {/* De ruis en de banden, zoals de loader op de homepage. */}
        <div className="scr__veil" aria-hidden="true">
          <div ref={top} className="scr__panel scr__panel--top" />
          <div ref={bottom} className="scr__panel scr__panel--bottom" />
          <div ref={signal} className="scr__signal">
            <canvas ref={canvas} className="scr__noise" />
            <div className="scr__scan" />
          </div>
          <div ref={line} className="scr__line" />
          {/* Uit te zetten in /beheer/scherm; dan blijft het element staan
              (de lus laat het in- en uitfaden) maar is het onzichtbaar. */}
          <div ref={text} className="scr__readout" style={look.readout ? undefined : { visibility: "hidden" }}>
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

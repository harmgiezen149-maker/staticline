import { LIMITS, NOW_LABEL, SCREEN_STYLES, SHOW_LABEL, normalizeScreen, type ScreenConfig, type ScreenStyle } from "./screen.ts";

/**
 * De snelbediening van het scherm vanuit de Band App.
 *
 * Op het podium wil je het scherm bijsturen vanaf je telefoon, niet in de
 * browser die op dat moment presenteert. De Band App heeft daarvoor een paneel
 * in de podiumweergave (en een eigen pagina, /scherm daar); dat praat via
 * /api/scherm/bediening met deze site.
 *
 * Bewust maar een deel van de instellingen: wat je tijdens een avond wilt
 * veranderen. Foto's uploaden, het formaat en de hulplijnen blijven in
 * /beheer/scherm. Het rekenwerk staat hier, en alles gaat daarna nog door
 * normalizeScreen — dezelfde grenzen als het beheer, op één plek.
 */

/** Wat de Band App te zien krijgt. Geen foto-adressen: die heeft hij niet nodig. */
export type RemoteView = {
  standby: boolean;
  style: ScreenStyle;
  seconds: number;
  noiseMin: number;
  noiseMax: number;
  ticker: ScreenConfig["ticker"];
  slides: { id: string; name: string; kind: "tekst" | "foto" | "nu" | "show"; on: boolean }[];
  logo: boolean;
  limits: { seconds: readonly [number, number]; noiseSeconds: readonly [number, number]; tickerText: number };
};

export function remoteView(config: ScreenConfig): RemoteView {
  return {
    standby: config.standby,
    style: config.style,
    seconds: config.seconds,
    noiseMin: config.noiseMin,
    noiseMax: config.noiseMax,
    ticker: config.ticker,
    slides: config.slides.map((slide) => ({
      id: slide.id,
      // Hoe het beeld in de lijst heet: de tekst, anders de kleine regel, anders wat het is.
      name:
        slide.source === "nu"
          ? slide.label || NOW_LABEL
          : slide.source === "show"
            ? slide.label || SHOW_LABEL
            : slide.title || slide.label || "Foto",
      kind: slide.source === "nu" ? "nu" : slide.source === "show" ? "show" : slide.photo ? "foto" : "tekst",
      on: slide.on,
    })),
    logo: config.logo.on,
    limits: { seconds: LIMITS.seconds, noiseSeconds: LIMITS.noiseSeconds, tickerText: LIMITS.tickerText },
  };
}

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);

/**
 * Een wijziging uit de Band App over de huidige instelling heen leggen.
 *
 * Alleen de velden die hierboven in RemoteView staan; al het andere in `patch`
 * wordt genegeerd. `skip: true` is "nu naar het volgende beeld" en wordt een
 * nieuwe tijdstempel (zie `skip` in ScreenConfig).
 */
export function applyRemote(config: ScreenConfig, patch: unknown, now = Date.now()): ScreenConfig {
  const p = record(patch);
  const next: ScreenConfig = { ...config, ticker: { ...config.ticker }, logo: { ...config.logo } };

  const standby = bool(p.standby);
  if (standby !== undefined) next.standby = standby;
  if (SCREEN_STYLES.includes(p.style as ScreenStyle)) next.style = p.style as ScreenStyle;
  const seconds = num(p.seconds);
  if (seconds !== undefined) next.seconds = seconds;
  const logo = bool(p.logo);
  if (logo !== undefined) next.logo.on = logo;

  // Zoals in het beheer: schuift het minimum voorbij het maximum, dan schuift
  // het maximum mee, en andersom. normalizeScreen zou ze anders omdraaien.
  const min = num(p.noiseMin);
  const max = num(p.noiseMax);
  if (min !== undefined) {
    next.noiseMin = min;
    next.noiseMax = Math.max(min, max ?? next.noiseMax);
  }
  if (max !== undefined) {
    next.noiseMax = max;
    next.noiseMin = Math.min(max, min ?? next.noiseMin);
  }

  const t = record(p.ticker);
  for (const key of ["on", "show", "now"] as const) {
    const v = bool(t[key]);
    if (v !== undefined) next.ticker[key] = v;
  }
  if (typeof t.text === "string") next.ticker.text = t.text;

  if (Array.isArray(p.slides)) {
    const wanted = new Map<string, boolean>();
    for (const s of p.slides) {
      const r = record(s);
      const on = bool(r.on);
      if (typeof r.id === "string" && on !== undefined) wanted.set(r.id, on);
    }
    next.slides = config.slides.map((slide) => (wanted.has(slide.id) ? { ...slide, on: wanted.get(slide.id)! } : slide));
  }

  if (p.skip === true) next.skip = now;

  return normalizeScreen(next);
}

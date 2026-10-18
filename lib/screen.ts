/**
 * Het scherm: de startanimatie als doorlopende lus, voor een beamer op het
 * podium, een scherm bij de merch of als achtergrond van een stream.
 *
 * Dit bestand is het rekenwerk, zonder database en zonder browser, zodat
 * `npm test` het kan narekenen: wat er van een opgeslagen instelling
 * overblijft, en in welke volgorde de beelden voorbijkomen. Het afspelen staat
 * in components/screen/ScreenLoop.tsx, het beheer in /beheer/scherm.
 *
 * Alles staat als één JSON-waarde in `site_content` (sleutel `scherm`, zonder
 * taal). Geen eigen tabel: het is één instelling die als geheel wordt
 * opgeslagen, en zo hoeft er aan db/schema.sql niets te veranderen.
 */

export const SCREEN_KEY = "scherm";

/**
 * "eigen" is een kader met een zelf ingestelde breedte, hoogte en positie, in
 * procenten van het scherm. Bedoeld voor een lcd-scherm achter het glas van
 * een oude beeldbuistelevisie: dan valt maar een deel van het paneel in de
 * opening, en dat deel moet het beeld zijn.
 */
export const FORMATS = ["auto", "16:9", "9:16", "1:1", "eigen"] as const;
export type ScreenFormat = (typeof FORMATS)[number];

export type ScreenSlide = {
  id: string;
  /** De kleine regel erboven, in monoletters. Mag leeg. */
  label: string;
  /** De grote tekst. Mag leeg: dan is het een beeld met alleen een foto. */
  title: string;
  /** Adres van de foto erachter, of leeg voor geen foto. */
  photo: string;
  /** Hoe zichtbaar die foto is, 0–100. Laag = transparant. */
  opacity: number;
  /** Ruis over het beeld, 0–100. 0 = geen; hoger = minder transparant. */
  noise: number;
  /**
   * Hoe vaak dit beeld voorbijkomt ten opzichte van de rest, 1–5. Op 2 komt
   * het twee keer zo vaak als een beeld op 1. Alleen bij willekeurige volgorde.
   */
  weight: number;
};

export type ScreenPhoto = { url: string; alt: string };

export type ScreenCustom = {
  /** Breedte en hoogte in procenten van het scherm. */
  width: number;
  height: number;
  /** Verschuiving van het midden, in procenten van het scherm. */
  x: number;
  y: number;
  /** Een lijn langs de rand en een kruis in het midden, om het kader passend te maken. */
  guides: boolean;
};

export type ScreenConfig = {
  /** Hoe lang een beeld blijft staan, in seconden. */
  seconds: number;
  /**
   * Hoe lang de ruis met het label staat bij elke wissel, in seconden: elke
   * wissel een willekeurige duur tussen deze twee. Gelijk = altijd even lang.
   */
  noiseMin: number;
  noiseMax: number;
  /** Helderheid van de ruis, 0–100. Zie noiseBrightness. */
  noiseLevel: number;
  /** De verhouding van het beeld. "auto" vult elk scherm. */
  format: ScreenFormat;
  /**
   * Bij "eigen": het kader in procenten van het scherm. De hulplijnen erin
   * gelden bij elk formaat.
   */
  custom: ScreenCustom;
  /** Het wordmark als eigen beeld, na elke `every` beelden, met eigen ruis. */
  logo: { on: boolean; every: number; noise: number };
  /** Foto's die alleen voor het scherm zijn geüpload. */
  photos: ScreenPhoto[];
  slides: ScreenSlide[];
  /** Willekeurige volgorde (met `weight` per beeld), of de vaste volgorde van de lijst. */
  shuffle: boolean;
};

export const LIMITS = {
  seconds: [3, 60],
  noiseSeconds: [0.5, 10],
  size: [10, 100],
  shift: [-50, 50],
  every: [1, 20],
  slides: 50,
  photos: 60,
  title: 200,
  label: 60,
  weight: [1, 5],
} as const;

export const DEFAULT_OPACITY = 20;

/**
 * De helderheid van de ruis als CSS-filter. Het canvas tekent grijs tussen
 * #090909 en #393939 (zie startNoise in lib/motion/loader.ts); de schuif
 * vermenigvuldigt dat. 16 is de ruis zoals de startanimatie hem laat zien,
 * 100 is ruim vier keer zo licht.
 */
export const DEFAULT_NOISE_LEVEL = 16;
export const noiseBrightness = (level: number) =>
  Math.round((0.25 + (Math.min(100, Math.max(0, level)) / 100) * 4.75) * 100) / 100;

/** Wat er staat zolang er in /beheer/scherm nog niets is opgeslagen. */
export const DEFAULT_SCREEN: ScreenConfig = {
  seconds: 8,
  noiseMin: 1.4,
  noiseMax: 1.4,
  noiseLevel: DEFAULT_NOISE_LEVEL,
  format: "auto",
  custom: { width: 100, height: 100, x: 0, y: 0, guides: false },
  logo: { on: true, every: 3, noise: 0 },
  photos: [],
  slides: [
    { id: "s1", label: "Signaal zoeken", title: "Static Line", photo: "", opacity: DEFAULT_OPACITY, noise: 0, weight: 1 },
    { id: "s2", label: "Live", title: "staticline.nl", photo: "", opacity: DEFAULT_OPACITY, noise: 0, weight: 1 },
  ],
  shuffle: true,
};

/**
 * Welke foto-adressen we tonen: de eigen Blob-opslag, en paden op de site
 * zelf. Geen willekeurige adressen van buiten — dan wordt dit scherm een
 * manier om andermans beeld op een podium te zetten.
 */
const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s"'<>]+$/i;
const LOCAL_PATH = /^\/(?!\/)[^\s"'<>]*$/;
export const isPhotoUrl = (url: string) => BLOB_URL.test(url) || LOCAL_PATH.test(url);

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function clampInt(v: unknown, [min, max]: readonly [number, number], fallback: number) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Op een tiende, voor de seconden van de ruis. */
function clampTenth(v: unknown, [min, max]: readonly [number, number], fallback: number) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.round(Math.min(max, Math.max(min, n)) * 10) / 10;
}

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/**
 * Een instelling in een vorm waar het scherm op kan rekenen. Onbekende of
 * kapotte waarden vallen terug op de standaard in plaats van alles te laten
 * mislukken: dit komt uit een formulier, en een podiumscherm hoort te blijven
 * draaien.
 */
export function normalizeScreen(input: unknown): ScreenConfig {
  const raw = record(input);
  const logo = record(raw.logo);
  const custom = record(raw.custom);

  const photos: ScreenPhoto[] = [];
  const seen = new Set<string>();
  for (const p of Array.isArray(raw.photos) ? raw.photos : []) {
    const url = text(record(p).url, 500);
    if (!isPhotoUrl(url) || seen.has(url)) continue;
    seen.add(url);
    photos.push({ url, alt: text(record(p).alt, 200) });
    if (photos.length >= LIMITS.photos) break;
  }

  const slides: ScreenSlide[] = [];
  const ids = new Set<string>();
  for (const [i, s] of (Array.isArray(raw.slides) ? raw.slides : []).entries()) {
    const r = record(s);
    const title = text(r.title, LIMITS.title);
    const photoUrl = text(r.photo, 500);
    const photo = isPhotoUrl(photoUrl) ? photoUrl : "";
    // Zonder tekst én zonder foto is er niets te tonen.
    if (!title && !photo) continue;
    let id = text(r.id, 40).replace(/[^a-z0-9_-]/gi, "") || `s${i + 1}`;
    while (ids.has(id)) id = `${id}x`;
    ids.add(id);
    slides.push({
      id,
      label: text(r.label, LIMITS.label),
      title,
      photo,
      opacity: clampInt(r.opacity, [0, 100], DEFAULT_OPACITY),
      noise: clampInt(r.noise, [0, 100], 0),
      weight: clampInt(r.weight, LIMITS.weight, 1),
    });
    if (slides.length >= LIMITS.slides) break;
  }

  return {
    seconds: clampInt(raw.seconds, LIMITS.seconds, DEFAULT_SCREEN.seconds),
    ...noiseRange(raw),
    noiseLevel: clampInt(raw.noiseLevel, [0, 100], DEFAULT_NOISE_LEVEL),
    format: FORMATS.includes(raw.format as ScreenFormat) ? (raw.format as ScreenFormat) : "auto",
    custom: {
      width: clampTenth(custom.width, LIMITS.size, 100),
      height: clampTenth(custom.height, LIMITS.size, 100),
      x: clampTenth(custom.x, LIMITS.shift, 0),
      y: clampTenth(custom.y, LIMITS.shift, 0),
      guides: custom.guides === true,
    },
    logo: {
      on: typeof logo.on === "boolean" ? logo.on : DEFAULT_SCREEN.logo.on,
      every: clampInt(logo.every, LIMITS.every, DEFAULT_SCREEN.logo.every),
      noise: clampInt(logo.noise, [0, 100], 0),
    },
    photos,
    slides,
    // Een instelling van vóór deze keuze krijgt de willekeurige volgorde: dat
    // was precies de vraag waarmee hij erbij kwam.
    shuffle: typeof raw.shuffle === "boolean" ? raw.shuffle : true,
  };
}

/** Wat er in de database staat, of de standaard als er niets (bruikbaars) staat. */
export function parseScreen(stored: string | undefined | null): ScreenConfig {
  if (!stored?.trim()) return DEFAULT_SCREEN;
  try {
    return normalizeScreen(JSON.parse(stored));
  } catch {
    return DEFAULT_SCREEN;
  }
}

/**
 * De ruisduur: een minimum en een maximum. Een instelling van vóór die twee
 * had één `noiseSeconds`; die wordt dan allebei. Staan ze omgedraaid, dan
 * worden ze omgewisseld in plaats van dat er één verloren gaat.
 */
function noiseRange(raw: Record<string, unknown>) {
  const single = clampTenth(raw.noiseSeconds, LIMITS.noiseSeconds, DEFAULT_SCREEN.noiseMin);
  const a = clampTenth(raw.noiseMin, LIMITS.noiseSeconds, single);
  const b = clampTenth(raw.noiseMax, LIMITS.noiseSeconds, raw.noiseMin === undefined ? single : a);
  return { noiseMin: Math.min(a, b), noiseMax: Math.max(a, b) };
}

/** Eén ruisduur in milliseconden, tussen het minimum en het maximum. */
export function noiseDuration(config: ScreenConfig, random: () => number = Math.random): number {
  return Math.round((config.noiseMin + (config.noiseMax - config.noiseMin) * random()) * 1000);
}

export type ScreenItem = { kind: "slide"; slide: ScreenSlide } | { kind: "logo" };

/**
 * De volgorde van één rondje: de beelden, met het wordmark na elke `every`
 * beelden. Zijn er minder beelden dan `every`, dan komt het logo één keer aan
 * het eind, anders zou het nooit voorbijkomen. Leeg is het nooit: zonder
 * beelden staat het logo er.
 */
export function sequence(config: ScreenConfig): ScreenItem[] {
  const items: ScreenItem[] = [];
  const { on, every } = config.logo;
  config.slides.forEach((slide, i) => {
    items.push({ kind: "slide", slide });
    if (on && (i + 1) % every === 0) items.push({ kind: "logo" });
  });
  if (on && config.slides.length > 0 && config.slides.length < every) items.push({ kind: "logo" });
  return items.length ? items : [{ kind: "logo" }];
}

/**
 * Eén rondje beelden in willekeurige volgorde: elk beeld zo vaak als zijn
 * `weight`, geschud, en waar het kan nooit twee keer hetzelfde beeld achter
 * elkaar — ook niet over de grens met het vorige rondje (`after`). Kan het
 * niet anders (één beeld op 5×, de rest op 1×), dan staat het er toch dubbel.
 */
export function shuffledRound(slides: ScreenSlide[], random: () => number, after: string | null = null): ScreenSlide[] {
  // Per plek kiezen in plaats van schudden en daarna repareren: bij een beeld
  // dat de helft van het rondje vult, moet dat precies om en om staan, en dat
  // vindt een reparatie achteraf niet altijd. Hier wordt gekozen naar wat er
  // nog over is (een beeld op 3× heeft drie keer zoveel kans), behalve als
  // het vaakst overgebleven beeld anders niet meer uit elkaar te houden is:
  // dan gaat dat voor.
  const left = new Map(slides.map((slide) => [slide.id, { slide, n: Math.max(1, slide.weight) }]));
  const total = [...left.values()].reduce((sum, e) => sum + e.n, 0);
  const round: ScreenSlide[] = [];
  let prev = after;

  for (let k = 0; k < total; k++) {
    const remaining = total - k;
    const open = [...left.values()].filter((e) => e.n > 0 && e.slide.id !== prev);
    if (open.length === 0) {
      // Alleen het vorige beeld is nog over; dan kan het niet anders.
      const only = [...left.values()].find((e) => e.n > 0)!;
      only.n -= 1;
      round.push(only.slide);
      prev = only.slide.id;
      continue;
    }
    const most = open.reduce((a, b) => (b.n > a.n ? b : a));
    let pick = most;
    if (most.n * 2 < remaining) {
      let r = random() * open.reduce((sum, e) => sum + e.n, 0);
      pick = open.find((e) => (r -= e.n) < 0) ?? open[open.length - 1];
    }
    pick.n -= 1;
    round.push(pick.slide);
    prev = pick.slide.id;
  }
  return round;
}

/**
 * De beelden voor een draaiend scherm, één voor één. Bij een willekeurige
 * volgorde een nieuw geschud rondje zodra het vorige op is, zodat de
 * verhoudingen over tijd kloppen en elk beeld regelmatig terugkomt; het logo
 * na elke `every` beelden. Bij de vaste volgorde gewoon `sequence` in een lus.
 */
export function createPlaylist(
  config: ScreenConfig,
  random: () => number = Math.random,
  /** Het beeld dat nu al in beeld staat: dat komt dan niet meteen nog een keer. */
  after: string | null = null,
) {
  if (!config.shuffle || config.slides.length === 0) {
    const fixed = sequence(config);
    let i = 0;
    return { next: (): ScreenItem => fixed[i++ % fixed.length] };
  }

  const { on, every } = config.logo;
  let deck: ScreenSlide[] = [];
  let last: string | null = after;
  let shown = 0;
  let logoDue = false;

  return {
    next(): ScreenItem {
      if (logoDue) {
        logoDue = false;
        return { kind: "logo" };
      }
      if (deck.length === 0) deck = shuffledRound(config.slides, random, last);
      const slide = deck.shift()!;
      last = slide.id;
      shown += 1;
      if (on && shown % every === 0) logoDue = true;
      return { kind: "slide", slide };
    },
  };
}

/**
 * Het formaat uit het adres (`/scherm?formaat=9:16`) wint van de instelling.
 * Zo kan de beamer liggend draaien en het scherm bij de merch staand, met
 * dezelfde beelden.
 */
export function pickFormat(param: string | undefined | null, config: ScreenConfig): ScreenFormat {
  const value = (param ?? "").trim().replace("x", ":").replace("-", ":");
  return FORMATS.includes(value as ScreenFormat) ? (value as ScreenFormat) : config.format;
}

/** Breedte gedeeld door hoogte, of null voor "vul het scherm". */
export function ratioOf(format: ScreenFormat): number | null {
  if (format === "auto" || format === "eigen") return null;
  const [w, h] = format.split(":").map(Number);
  return w / h;
}

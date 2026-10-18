/**
 * Kleurensneeuw voor /scherm: een beeldbuis zonder zender.
 *
 * Geëxtrapoleerd, niet ontworpen, en op verzoek naar een foto van een oude tv:
 * korrels in blauw, cyaan, groen en wit, af en toe een rode of paarse, op een
 * donkerblauwe grond, met lichte verticale banden die golven en langzaam
 * opschuiven. Dit zijn bewust geen tokens van de site: het is het beeld van
 * een tv, en het staat alleen op dit scherm. De grijze ruis van de site
 * (startNoise in lib/motion/loader.ts) blijft de keuze "zwart-wit".
 *
 * Getekend op een kwart van de schermmaat en door de browser opgeschaald, met
 * de gewone gladde schaling: daardoor zijn de korrels wat wazig en klonterig,
 * zoals op glas, en blijft het rekenwerk klein.
 */

/** Kleuren van de korrels, met hoe vaak ze voorkomen. Rood blijft zeldzaam. */
const PALETTE: { rgb: [number, number, number]; share: number }[] = [
  { rgb: [255, 50, 110], share: 0.02 },
  { rgb: [215, 60, 230], share: 0.015 },
  { rgb: [45, 90, 255], share: 0.22 },
  { rgb: [50, 205, 255], share: 0.25 },
  { rgb: [70, 235, 120], share: 0.21 },
  { rgb: [230, 240, 255], share: 0.285 },
];
const GROUND: [number, number, number] = [4, 10, 34];

// Opgezocht per korrel: een tabel van 256 kleuren naar verhouding, zodat een
// korrel één willekeurig getal kost en geen zoekwerk.
const TABLE = (() => {
  const table: [number, number, number][] = [];
  for (const { rgb, share } of PALETTE) {
    for (let i = 0; i < Math.round(share * 256); i++) table.push(rgb);
  }
  while (table.length < 256) table.push(PALETTE[PALETTE.length - 1].rgb);
  return table.slice(0, 256);
})();

const TAU = Math.PI * 2;

/**
 * De helderheid van de banden over de breedte, 0–1, voor kolom `x` van `w` op
 * tijd `t` in seconden. Twee brede golven en een smalle, gekwadrateerd zodat er
 * een paar duidelijke lichte banden zijn en daartussen donkerder sneeuw.
 */
export function bandAt(x: number, w: number, t: number): number {
  const u = x / w;
  const s =
    0.5 * Math.sin(u * TAU * 2.2 + t * 0.35) +
    0.3 * Math.sin(u * TAU * 5.3 - t * 0.8 + 1.3) +
    0.2 * Math.sin(u * TAU * 11 + t * 1.7);
  const v = 0.5 + 0.5 * s;
  return 0.25 + 0.85 * v * v;
}

/**
 * Een beeld sneeuw in `buffer` (RGBA als Uint32, little-endian zoals in elke
 * browser). Los van het canvas, zodat het te testen is.
 */
export function drawColorNoise(buffer: Uint32Array, w: number, h: number, t: number, random = Math.random) {
  // De banden per kolom, met marge voor de golf die elke regel opzij duwt.
  const wobble = Math.max(2, Math.round(w * 0.035));
  const span = w + wobble * 2 + 2;
  const bands = new Float32Array(span);
  for (let x = 0; x < span; x++) bands[x] = bandAt(x - wobble, w, t);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    const shift =
      wobble +
      Math.round(wobble * (0.65 * Math.sin(v * TAU * 1.4 + t * 1.1) + 0.35 * Math.sin(v * TAU * 6 - t * 2.6)));
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const g = random();
      // Gekwadrateerd: veel donkere korrels, een paar felle.
      const bright = bands[x + shift] * g * g * 1.35;
      const [r0, g0, b0] = TABLE[(random() * 256) | 0];
      const r = Math.min(255, GROUND[0] + r0 * bright) | 0;
      const gg = Math.min(255, GROUND[1] + g0 * bright) | 0;
      const b = Math.min(255, GROUND[2] + b0 * bright) | 0;
      buffer[row + x] = 0xff000000 | (b << 16) | (gg << 8) | r;
    }
  }
}

/** Kleurensneeuw op een canvas, tot de teruggegeven functie wordt aangeroepen. */
export function startColorNoise(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};

  const w = Math.ceil(innerWidth * 0.25);
  const h = Math.ceil(innerHeight * 0.25);
  canvas.width = w;
  canvas.height = h;

  const image = ctx.createImageData(w, h);
  const buffer = new Uint32Array(image.data.buffer);
  let id = 0;
  let last = 0;
  let alive = true;

  const loop = (t: number) => {
    if (!alive) return;
    // Zo'n 22 beelden per seconde, net als de grijze ruis.
    if (t - last > 45) {
      last = t;
      drawColorNoise(buffer, w, h, t / 1000);
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

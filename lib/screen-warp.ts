/**
 * Een tv die zijn signaal kwijtraakt, voor de foto's op /scherm.
 *
 * Geëxtrapoleerd, niet ontworpen, en op verzoek naar een filmpje met een
 * testbeeld dat zijn synchronisatie verliest: elke beeldlijn schuift een
 * ander stuk opzij zodat rechte vlakken golven, stroken scheuren los en
 * worden uitgerekt, er schieten banden sneeuw en zwart doorheen, en het
 * beeld rolt. Dat kan niet met CSS — een transform verschuift het beeld als
 * geheel, niet per lijn — dus tijdens zo'n storing tekent dit de foto regel
 * voor regel op een canvas. Daarbuiten staat de gewone foto er, en rekent
 * hier niets.
 *
 * Alleen tekenen, nooit pixels teruglezen: dan mag de foto ook van een andere
 * host komen (de hoes van Spotify) zonder dat het canvas daarover struikelt.
 */

const TAU = Math.PI * 2;

/** Een strook van de storing: scheur, sneeuw of zwart. */
type Band = { top: number; height: number; kind: "tear" | "snow" | "black"; shift: number; stretch: number };

/** Een lap sneeuw: grijze stipjes en streepjes, die opgerekt de strepen geven. */
function makeSnow(w = 320, h = 160) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h * 0.08; i++) {
    const v = 90 + ((Math.random() * 165) | 0);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 1 + ((Math.random() * 6) | 0), 1);
  }
  return c;
}

/**
 * Nieuwe stroken voor dit moment. Hoe sterker, hoe meer. Zwart beslaat samen
 * hooguit een vijfde van het beeld: grote zwarte vlakken die verspringen,
 * worden een flits.
 */
export function pickBands(strength: number, random = Math.random): Band[] {
  const count = Math.round(strength * (1 + random() * 4));
  const bands: Band[] = [];
  let black = 0;
  for (let i = 0; i < count; i++) {
    const height = 0.02 + random() * 0.12 * strength;
    const r = random();
    let kind: Band["kind"] = r < 0.5 ? "tear" : r < 0.8 ? "snow" : "black";
    if (kind === "black" && black + height > 0.2) kind = "snow";
    if (kind === "black") black += height;
    bands.push({
      top: random() * (1 - height),
      height,
      kind,
      shift: (random() - 0.5) * 0.6 * strength,
      stretch: 1 + random() * 5 * strength,
    });
  }
  return bands.sort((a, b) => a.top - b.top);
}

/**
 * Hoe ver beeldlijn `y` (0–1 van boven naar onder) opzij schuift, als deel van
 * de breedte. Twee golven over de hoogte die elk een andere kant op lopen: dat
 * geeft de S-bochten uit het filmpje in plaats van een nette sinus.
 */
export function waveAt(y: number, t: number, strength: number) {
  return strength * (0.12 * Math.sin(TAU * (y * 1.3 + t * 0.35)) + 0.04 * Math.sin(TAU * (y * 4.7 - t * 0.9)));
}

type Options = {
  /** 0–1: hoe hevig. */
  strength: number;
  /** Hoe lang de storing duurt, in ms. */
  duration: number;
  onDone: () => void;
};

/**
 * Speel één storing af op `canvas`, met `img` als bron. Het canvas krijgt de
 * maat van zichzelf op het scherm, op de helft van de pixels: grof genoeg om
 * licht te tekenen, en een beetje blokkerig hoort er hier bij.
 */
export function startWarp(canvas: HTMLCanvasElement, img: HTMLImageElement, { strength, duration, onDone }: Options) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const W = Math.max(64, Math.round(canvas.clientWidth * 0.5));
  const H = Math.max(36, Math.round(canvas.clientHeight * 0.5));
  if (!ctx || !img.naturalWidth) {
    onDone();
    return () => {};
  }
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = true;

  // Eerst de foto één keer op maat, zoals object-fit: cover, op een eigen
  // canvas. Daarna komt elke regel daarvandaan. Niet rechtstreeks uit de <img>:
  // laadt de browser een scherpere versie uit de srcset, dan rekent
  // naturalWidth in andere pixels dan het uitsnijden, en zag je alleen het
  // bovenste stuk van de foto.
  const pic = document.createElement("canvas");
  pic.width = W;
  pic.height = H;
  const pctx = pic.getContext("2d");
  if (!pctx) {
    onDone();
    return () => {};
  }
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  pctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const sw = W;

  const snow = makeSnow();
  const gap = Math.round(H * 0.07); // de zwarte balk tussen twee beelden bij het rollen
  const lap = H + gap;
  // Elke storing anders: wel of niet rollen, en waar hij begint.
  const rollSpeed = Math.random() < 0.6 ? (0.3 + Math.random() * 0.9) * lap * strength : 0;
  let roll = Math.random() < 0.5 ? Math.random() * lap * strength : 0;
  const phase = Math.random() * 10;

  const strip = 2;
  let bands = pickBands(strength);
  let nextBands = 0;
  let last = 0;
  let id = 0;
  let alive = true;
  const start = performance.now();

  const stop = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(id);
    onDone();
  };

  const draw = (now: number) => {
    if (!alive) return;
    if (!canvas.isConnected) return stop();
    const p = (now - start) / duration;
    if (p >= 1) return stop();
    // Zo'n 30 beelden per seconde is genoeg, en schokkeriger is beter.
    if (now - last < 33) {
      id = requestAnimationFrame(draw);
      return;
    }
    const dt = last ? (now - last) / 1000 : 0;
    last = now;

    // Aanzwellen en wegebben, zodat de storing niet aan- en uitklikt.
    const env = Math.sqrt(Math.sin(Math.PI * p));
    const s = strength * env;
    const t = phase + (now - start) / 1000;
    roll = (roll + rollSpeed * dt) % lap;
    // De stroken springen een paar keer per seconde, niet elk beeld.
    if (now > nextBands) {
      bands = env > 0.35 ? pickBands(s) : [];
      nextBands = now + 90 + Math.random() * 160;
    }

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    let b = 0;
    for (let y = 0; y < H; y += strip) {
      const v = y / H;
      while (b < bands.length && bands[b].top + bands[b].height < v) b++;
      const band = b < bands.length && bands[b].top <= v ? bands[b] : null;

      if (band?.kind === "black") continue;
      if (band?.kind === "snow") {
        const sy = (Math.random() * (snow.height - 2)) | 0;
        ctx.drawImage(snow, (Math.random() * 40) | 0, sy, snow.width - 40, 2, 0, y, W, strip);
        continue;
      }

      // Welke regel van de foto hier staat, met het rollen meegerekend.
      const yy = (y + roll) % lap;
      if (yy >= H) continue; // de zwarte balk
      const srcY = yy;
      let dx = waveAt(v, t, s) * W;
      let srcW = sw;
      let srcX = 0;
      if (band?.kind === "tear") {
        // Een scheur: ver opzij, en uitgerekt zodat hij in strepen uitloopt.
        dx += band.shift * W;
        srcW = sw / band.stretch;
        srcX = (sw - srcW) * (0.5 + band.shift);
      }
      dx = ((dx % W) + W) % W;
      const srcH = Math.min(strip, H - srcY);
      // Twee keer, zodat wat er rechts uitschuift links weer binnenkomt.
      ctx.drawImage(pic, srcX, srcY, srcW, srcH, dx, y, W, srcH);
      ctx.drawImage(pic, srcX, srcY, srcW, srcH, dx - W, y, W, srcH);
      // In een scheur om de regel donkerder: de lijnen uit het filmpje.
      if (band?.kind === "tear" && (y / strip) % 2 === 0) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, y, W, 1);
      }
    }

    // Korrel over alles.
    // Korrel over alles; "screen", zodat de donkere grond van de sneeuw het
    // beeld niet donkerder maakt, alleen de stipjes erbij komen.
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.35 * env;
    ctx.drawImage(snow, (Math.random() * 40) | 0, (Math.random() * 40) | 0, snow.width - 40, snow.height - 40, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    id = requestAnimationFrame(draw);
  };
  id = requestAnimationFrame(draw);
  return stop;
}

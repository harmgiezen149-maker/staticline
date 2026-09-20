/**
 * De deelafbeelding en de iconen van de publieke site.
 *
 * Draaien:  node scripts/gen-social-images.mjs
 *
 * Twee dingen, uit dezelfde bron:
 *
 * 1. `og.jpg` — wat WhatsApp, Facebook en Instagram laten zien als iemand een
 *    link naar de site deelt. Zonder dit is dat een kale regel tekst, en de
 *    schrijfmodule bestaat juist om die posts te maken.
 * 2. De favicon en het icoon voor het beginscherm. De site had er geen; een
 *    tabblad toonde het standaard-wereldbolletje.
 *
 * Het wordmark wordt geplaatst, niet bewerkt: hetzelfde bestand, alleen
 * verkleind met behoud van verhouding. Geen hertekening, geen herkleuring, geen
 * uitrekking — zie CLAUDE.md.
 *
 * De deelafbeelding krijgt hetzelfde leesbaarheidsverloop als de hero
 * (components/Hero.tsx), zodat wie de link ziet hetzelfde beeld krijgt als wie
 * erop klikt. Dat verloop is het enige verloop in het ontwerp.
 *
 * `sharp` staat niet in package.json. Next brengt het zelf mee, en dit script
 * draait met de hand en nooit tijdens de build. Zie scripts/gen-beheer-icons.mjs.
 */
import sharp from "sharp";

const ASSETS = new URL("../public/assets/", import.meta.url).pathname;
const MARK = `${ASSETS}staticline-wordmark.png`;
const ACHTERGROND = `${ASSETS}background.jpg`;

// Uit styles/tokens.css.
const BG = "#0d0f12";

// ---------------------------------------------------------------------------
// De deelafbeelding
// ---------------------------------------------------------------------------

// 1200×630 is wat Facebook, WhatsApp, LinkedIn en X alle vier aankunnen. Groter
// wordt toch verkleind, kleiner wordt wazig.
const OG_W = 1200;
const OG_H = 630;

async function deelafbeelding() {
  const mark = await sharp(MARK)
    .resize({ width: Math.round(OG_W * 0.55) })
    .toBuffer({ resolveWithObject: true });

  // Dezelfde waarden als het verloop in de hero: van 40% dekking bovenaan naar
  // 95% onderaan. Staat daar in Tailwind, hier in SVG, met dezelfde getallen.
  const verloop = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
       <defs>
         <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0%" stop-color="${BG}" stop-opacity="0.4"/>
           <stop offset="100%" stop-color="${BG}" stop-opacity="0.95"/>
         </linearGradient>
       </defs>
       <rect width="${OG_W}" height="${OG_H}" fill="url(#v)"/>
     </svg>`,
  );

  await sharp(ACHTERGROND)
    .resize({ width: OG_W, height: OG_H, fit: "cover", position: "centre" })
    .composite([
      { input: verloop },
      {
        input: mark.data,
        top: Math.round((OG_H - mark.info.height) / 2),
        left: Math.round((OG_W - mark.info.width) / 2),
      },
    ])
    // JPEG en geen PNG: dit is een foto met een verloop erover. PNG maakt daar
    // een bestand van een megabyte van, en sommige diensten slaan een grote
    // deelafbeelding gewoon over.
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${ASSETS}og.jpg`);

  console.log(`og.jpg  ${OG_W}×${OG_H}`);
}

// ---------------------------------------------------------------------------
// De iconen
// ---------------------------------------------------------------------------

/**
 * Het wordmark, gecentreerd op een vierkant in de achtergrondkleur.
 *
 * Geen accentstreep eronder, anders dan bij de beheer-app: die streep zit daar
 * juist om de twee op een beginscherm uit elkaar te houden.
 */
async function icoon(size, fraction, naam) {
  const mark = await sharp(MARK)
    .resize({ width: Math.round(size * fraction) })
    .toBuffer({ resolveWithObject: true });

  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([
      {
        input: mark.data,
        top: Math.round((size - mark.info.height) / 2),
        left: Math.round((size - mark.info.width) / 2),
      },
    ])
    .png()
    .toFile(`${ASSETS}${naam}`);

  console.log(`${naam}  ${size}×${size}`);
}

await deelafbeelding();

// Een favicon van 32 pixels met een wordmark van twee regels erin is een vlek,
// en dat is hier het eerlijke antwoord: er is geen beeldmerk of monogram, alleen
// dit wordmark, en dat mag niet hertekend worden. Vandaar een ruimere vulling op
// het kleinste formaat — de kleur en de vorm zijn dan nog herkenbaar, de letters
// niet meer.
await icoon(32, 0.94, "icon-32.png");
await icoon(192, 0.86, "icon-192.png");
await icoon(512, 0.86, "icon-512.png");
await icoon(180, 0.86, "apple-touch-icon.png");

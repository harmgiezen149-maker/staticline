/**
 * De iconen van de beheer-app, uit het wordmark.
 *
 * Draaien:  node scripts/gen-beheer-icons.mjs
 *
 * Alleen nodig als het wordmark verandert, en dat gebeurt niet — CLAUDE.md zegt
 * dat het definitief is. Het staat hier zodat de iconen navolgbaar zijn en
 * niemand ze ooit met de hand hoeft na te tekenen.
 *
 * `sharp` staat niet in package.json. Next brengt het zelf mee voor zijn
 * afbeeldingsoptimalisatie, en dit script draait met de hand en nooit tijdens de
 * build. Werkt het niet meer, dan is `npm i -D sharp` genoeg; opnemen als
 * afhankelijkheid voor één handmatig commando is het niet waard.
 *
 * Het wordmark wordt geplaatst, niet bewerkt: hetzelfde bestand, alleen
 * verkleind met behoud van verhouding. Geen hertekening, geen herkleuring, geen
 * uitrekking. Daaronder staat een streep in de accentkleur — dat is het enige
 * wat erbij komt, en het is er om deze app op een beginscherm te onderscheiden
 * van de Band App, die daar met het bandlogo staat.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = new URL("../public/beheer/", import.meta.url).pathname;
const MARK = new URL("../public/assets/staticline-wordmark.png", import.meta.url).pathname;

// Uit styles/tokens.css. Dezelfde waarden als background_color en theme_color in
// het manifest, zodat het startscherm van de geïnstalleerde app niet zichtbaar
// van kleur verspringt naar het scherm eronder.
const BG = "#0d0f12";
const ACCENT = "#b33a28";

mkdirSync(OUT, { recursive: true });

/**
 * Eén tegel.
 *
 * `fraction` is hoe breed het wordmark mag worden ten opzichte van de tegel. Bij
 * een maskable icoon knipt het systeem er een cirkel of een afgeronde vierkant
 * uit; alleen de binnenste tachtig procent is gegarandeerd zichtbaar. Vandaar
 * twee waarden in plaats van één.
 */
async function tile(size, fraction) {
  const markWidth = Math.round(size * fraction);
  const mark = await sharp(MARK)
    .resize({ width: markWidth })
    .toBuffer({ resolveWithObject: true });

  const gap = Math.round(size * 0.055);
  const ruleHeight = Math.max(2, Math.round(size * 0.016));
  const blockHeight = mark.info.height + gap + ruleHeight;

  const top = Math.round((size - blockHeight) / 2);
  const left = Math.round((size - markWidth) / 2);

  const rule = await sharp({
    create: { width: markWidth, height: ruleHeight, channels: 4, background: ACCENT },
  })
    .png()
    .toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([
      { input: mark.data, top, left },
      { input: rule, top: top + mark.info.height + gap, left },
    ])
    .png();
}

// Gewone iconen: het wordmark mag bijna de hele breedte pakken.
// Maskable: kleiner, zodat het binnen de veilige cirkel blijft staan.
const WORK = [
  ["icon-512.png", 512, 0.74],
  ["icon-192.png", 192, 0.74],
  ["icon-512-maskable.png", 512, 0.52],
  ["icon-192-maskable.png", 192, 0.52],
  // iOS maakt zelf de ronde hoeken en zet er geen achtergrond achter, dus deze
  // mag geen doorzichtige rand hebben.
  ["apple-touch-icon.png", 180, 0.74],
];

for (const [name, size, fraction] of WORK) {
  const image = await tile(size, fraction);
  await image.toFile(OUT + name);
  console.log(`${name}  ${size}×${size}`);
}

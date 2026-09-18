@AGENTS.md

# Static Line — website

Publieke bandsite plus een besloten deel voor de band, voor het Nijmeegse
Static Line. Live op **staticline.nl** vóór de eerste show op **10 november 2026**.

Lees `docs/` voor je code schrijft. Het ontwerp van de homepage is af en bevroren;
al het andere volgt het design system.

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router), TypeScript, Turbopack |
| Styling | Tailwind v4, tokens als CSS-variabelen in `styles/tokens.css` |
| Hosting | Vercel, project `staticline`, deployt vanaf GitHub |
| Gedeelde data | via de API van de Band App, **niet** via een gedeelde database |
| Eigen data | eigen Postgres (Neon) bij dit Vercel-project |
| i18n | Nederlands op `/`, Engels op `/en`, via `proxy.ts` — nooit client-only |

## Hoe dit aan de Band App hangt

De Band App (`harmgiezen149-maker/band-app`) is een aparte applicatie die de band
zelf gebouwd heeft en dagelijks gebruikt. Hij draait op
`https://static-line-bandapp.vercel.app` en heeft een eigen Neon-database.

**Deze site praat met de Band App via HTTP, niet via zijn database.** Zie
`lib/band-app.ts` voor de twee redenen; kort:

1. De Band App draait bij elke deploy `prisma db push` tegen zijn eigen
   productiedatabase, zonder `--accept-data-loss`. Tabellen die deze site daar zou
   aanmaken, laten die build omvallen.
2. De Band App houdt afgeleide velden zelf bij (`Event.mon`/`day`/`time` naast
   `startsAt`, volgorde binnen setlist-secties, kanaalnummering). Rechtstreeks
   schrijven breekt die stil.

Wat deze site zelf bezit — boekingen, nieuwsbriefabonnees, pagina-inhoud — staat
in een eigen database.

Moet er een veld bij in de Band App? Dan een **PR op band-app**, strikt additief
(nieuwe kolommen met een default, nooit hernoemen of verwijderen), met
`npm run check:schema` gedraaid. Nooit rechtstreeks naar `main` daar: één push
deployt beide bands en draait `prisma db push` op allebei de productiedatabases.

### Tijdzone — lees dit voor je een datum aanraakt

De Band App bewaart de kloktijd van de band als UTC-onderdelen, bewust zonder
zomertijd: 20:00 staat als `20:00Z` in de database en betekent 20:00 op de klok in
de zaal. Formatteren met `Europe/Amsterdam` zet elke show een uur verkeerd. Gebruik
de helpers in `lib/i18n.ts`, die op UTC formatteren.

## Harde regels

Die komen uit besluiten die al genomen zijn. Niet opnieuw openen in code.

- **Alleen donker thema.** Geen light mode, geen schakelaar, geen `dark:`-varianten.
- **Border radius is overal 0**, zonder uitzondering.
- **Geen schaduwen** behalve de ene drop-shadow op het wordmark in de hero. Geen
  decoratieve verlopen — het enige verloop is de leesbaarheidsoverlay in de hero.
- **Geen scroll- of entree-animaties.** Alleen de kleurovergangen van 120ms.
- **Het wordmark is definitief.** Nooit hertekenen, herkleuren, uitrekken of
  opnieuw natrekken. Gebruik de aangeleverde bestanden zoals ze zijn.
- **Ruimte komt uit de schaal** (4/8/12/16/24/32/48/64/96). Dat is precies de
  standaardschaal van Tailwind: `p-1` t/m `p-24`. Een eenmalige waarde heeft een
  reden nodig.
- Elk bedienbaar element krijgt `outline: 2px solid var(--focus-ring)` met
  `outline-offset: 2px` op `:focus-visible`. Dat staat één keer in `globals.css`.
- `--text-faint` (#6B747C) is alleen voor mono-labels van 11–12px. Nooit voor
  lopende tekst.
- **Geen `display` in gedeelde basisklassen.** Zie `components/Button.tsx` voor
  waarom: een `hidden` van de aanroeper verliest dan willekeurig van een
  `inline-flex` uit de basis.

## Breekpunten

Het ontwerp werkt met twee grenzen, als max-width geschreven: 1024 en 640. In
Tailwind staan ze als min-width, zodat de opbouw mobile-first is:

| prefix | vanaf | het ontwerp noemt dit |
| --- | --- | --- |
| geen | 0 | mobiel (≤640) |
| `sm:` | 641px | tablet |
| `lg:` | 1025px | desktop |

De overige standaardbreekpunten van Tailwind staan uit. Een derde grens die niet
in het ontwerp voorkomt, is een fout die niemand opmerkt.

## Indeling

```
app/[lang]/         alle pagina's, één keer, in beide talen
components/         SiteHeader, Hero, NextShow, ShowList, ShowRow, PhotoGrid, SiteFooter, …
content/            copy per taal; het type in content/types.ts dwingt af dat beide compleet zijn
lib/                i18n, band-app-koppeling, showmodel
proxy.ts            taalroutering: / is Nederlands, /en is Engels
styles/tokens.css   gegenereerd uit design-system/tokens.json — niet met de hand aanpassen
design/             de design-handoff, alleen referentie, staat buiten de linter en de build
design-system/      tokens, brandbook, logo's
docs/               de briefings uit het handover-pakket
```

`design/reference/` is een zelfstandige HTML-implementatie van de homepage. Het is
**referentie, geen productiecode** — lees er waarden en structuur uit, bouw na in
React. Kopieer `styles.css` niet en importeer `support.js` niet.

## Wat niet ontworpen is

De handoff dekt alleen de homepage. Alles hieronder is **geëxtrapoleerd** binnen de
bestaande tokens en patronen; er zijn geen nieuwe kleuren, radii, schaduwen of
bewegingen bijgekomen. Elk bestand zegt bovenaan dat het extrapolatie is.

- Het mobiele menupaneel (`components/MobileNav.tsx`)
- Alle publieke pagina's behalve de homepage
- Het besloten deel
- Laad-, fout- en lege staten

## Wat er over de inhoud bekend is

Deze punten wijken af van wat de handover-documenten zeggen, omdat de echte data
in de Band App iets anders bleek:

- **De eerste show is Loburg op 10 november 2026**, niet Doornroosje in Nijmegen.
  Dat laatste stond in de briefing en in het ontwerp, maar staat niet in de agenda.
- **De band heeft vier leden**: Harm Giezen (bas), Vedran (leadzang), Niels Verdel
  (drums), Quinten van Dreven (ritmegitaar). Het ontwerp zei "Drie man". De copy
  noemt daarom geen aantal meer.
- **Het is een coverband** — negentien nummers, allemaal van anderen. Er staat
  nergens "releaseshow"; de statuswaarde `release` bestaat wel in het model maar
  wordt niet gebruikt.
- Bandbio, bandlogo en fotografie ontbreken nog. De fotosectie toont zolang de
  benoemde placeholders uit het ontwerp.

## Voor wie dit is

Harm is de beheerder en degene die dit laat bouwen. Hij werkt in functioneel
beheer en maakt Next.js-projecten naast zijn werk, maar is geen beroepsontwikkelaar
— leg architectuurafwegingen uit in plaats van ze te veronderstellen, en kies de
pragmatische optie met minder beheerlast boven de slimme.

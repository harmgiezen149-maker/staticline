@AGENTS.md

# Static Line — website

Publieke bandsite plus een besloten deel voor de band, voor het Edese
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
| i18n | Nederlands op `/`, Engels op `/en`, als twee echte routes — nooit client-only |

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

**Schrijven gaat ook via HTTP.** `/beheer/bandapp` past de bandgegevens en de
agenda in de Band App aan, via `app/api/site/route.js` daar: een aparte route met
een gedeelde sleutel in de Authorization-kop, omdat het sessiekoekje van die app
op zijn eigen domein staat. Het rekenwerk blijft daar — `fromParts`, `eventView`
en `publicFields` zijn dezelfde helpers die zijn eigen schermen gebruiken, zodat
`mon`/`day`/`time`/`past` niet uit de pas kunnen lopen met `startsAt`. Deze site
stuurt alleen wat de beheerder invulde. Zet die logica nooit aan deze kant.

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
- **Eén beweging bij het scrollen, en niet meer.** De regel was "geen scroll- of
  entree-animaties"; die is bewust verruimd tot precies dit: een blok komt 6px
  omhoog terwijl het in beeld komt, en de lijn onder een sectiekop tekent
  zichzelf. Klasse `onthul` en `streep`, allebei in `globals.css`. Verder alleen
  de kleurovergangen van 120ms.
  **Het bereik bepaalt hoe dit voelt, niet een duur.** Bij een
  voortgangstijdlijn wordt `animation-duration` genegeerd; de voortgang komt van
  de scrollpositie. `cover 0% cover 25%` is nagemeten in Chromium en loopt over
  ruim tweehonderd pixels midden in beeld. Een bereik op `entry` stond er eerst
  en was fout: dat speelde zich af in de onderste negentig pixels van het
  scherm, waar niemand kijkt, en was klaar voordat je het blok kon lezen. Verander
  dit bereik niet op gevoel — meet het na. Geen stagger per rij, geen hero, geen besloten deel,
  geen formuliervelden — dat is precies het handschrift waar de eerste mockup op
  afgerekend werd. Het gaat via scroll-gestuurde CSS en niet via een
  IntersectionObserver: nul kilobyte JavaScript, en elke sectie blijft een
  servercomponent. Zet nergens `opacity: 0` in een basisstijl; zonder
  ondersteuning hoort de pagina er te staan zoals hij er zonder dit alles uitziet.
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

## Taalroutering — waarom twee root layouts

Er zijn twee root layouts, `app/(nl)` en `app/(en)`, elk met hun eigen
`<html lang>`. De inhoud van een pagina staat één keer in een component; de
routebestanden zijn dun en geven alleen de taal mee.

Dat is niet de voor de hand liggende opzet — één `app/[lang]` met een rewrite in
`proxy.ts` is korter. Die stond er ook, en werkte lokaal. Op Vercel gaf `/`
alleen een 404: dat adres bestond daar niet als route, want het ontstond pas uit
middleware. Het adres dat op de sticker met de QR-code komt te staan, hoort niet
af te hangen van een routeringslaag die zich op twee plekken anders gedraagt.

Nu staan `/` en `/en` allebei gewoon in de routeringstabel en is er geen
middleware meer. De prijs is één dun bestand per pagina per taal.

**Voeg hier geen `[lang]`-segment of taal-rewrite opnieuw aan toe.**

## vercel.json — laat `framework` staan

Het Vercel-project is aangemaakt toen de repo nog leeg was, dus daar is Next.js
nooit gedetecteerd en stond het framework op niets. Gevolg: `vercel build` liep
wel door, maar de deploy serveerde alleen de bestanden uit `public/`. Statische
bestanden werkten, elke pagina gaf een 404 — ook `/en`, dat wél een echte route
is. Dat kostte een ronde zoeken, omdat het inlogscherm van Vercel er een 302
overheen legde en de 404 daardoor niet te zien was.

`"framework": "nextjs"` in `vercel.json` zet dat in de repo vast, zodat het niet
afhangt van een instelling die iemand ooit in de Vercel-interface heeft staan.

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
app/(nl)/           Nederlandse routes: /, /agenda, /boeken …
app/(en)/en/        Engelse routes: /en, /en/agenda …
components/         SiteHeader, Hero, NextShow, ShowList, ShowRow, PhotoGrid, SiteFooter, HomePage, …
content/            copy per taal; het type in content/types.ts dwingt af dat beide compleet zijn
lib/                i18n, band-app-koppeling, showmodel, fonts
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
- De bandsectie op de homepage (`components/BandSection.tsx`), tussen de agenda
  en de foto's — volgt de sectiepatronen van `ShowList` en de ledenkaarten van
  `/band`, alleen compacter
- Alle publieke pagina's behalve de homepage — het omhulsel staat in
  `components/Page.tsx`, de pagina's zelf in `components/pages/`
- Het boekingsformulier (`components/BookingForm.tsx`)
- De nieuwsbriefstrip, de kaart en de uitgestelde embeds
- Het besloten deel
- Laad-, fout- en lege staten

Twee dingen zijn in de kop bijgekomen die niet ontworpen zijn: Muziek en Video.
Ze verschijnen pas vanaf `lg:`, zodat de kop op tablet precies de drie items
breed blijft die het ontwerp tekent.

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

## Wat er nog ingesteld moet worden

Deze dingen werken zonder, maar beter mét. Zolang ze ontbreken logt de site een
waarschuwing en gaat hij door — een aanvraag hoort nooit te stranden omdat een
sleutel ontbreekt.

| Variabele | Waarvoor |
| --- | --- |
| `DATABASE_URL` | eigen Neon-database voor boekingen en nieuwsbriefabonnees; zonder deze worden aanvragen alleen doorgestuurd |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | captcha op het boekingsformulier; zonder deze blijft alleen de honeypot over |
| `BAND_APP_RIDER_URL` | de deelbare riderlink uit de Band App, voor de boekingspagina |
| `RESEND_API_KEY` | bevestigingsmail aan de afzender en de dubbele opt-in van de nieuwsbrief |
| `SITE_URL` | het volledige adres voor links in die mails; standaard `https://www.staticline.nl` |
| `PORTAL_SECRET` | ondertekent het sessiekoekje van `/beheer`; minimaal 32 tekens |
| `PORTAL_ADMINS` + `PORTAL_MEMBERS` | kommalijsten met wie er in het besloten deel mag |
| `BLOB_READ_WRITE_TOKEN` | de Vercel Blob-opslag voor de foto's; Vercel zet deze zelf zodra je een Blob-store koppelt |
| `SITE_API_TOKEN` | schrijven naar de Band App vanuit `/beheer/bandapp`; dezelfde waarde moet bij béíde Vercel-projecten staan |
| `ANTHROPIC_API_KEY` | de teksten uit de Band App naar het Engels vertalen in `/beheer/vertalingen`; zonder deze kan het nog met de hand |

De eerste vijf zijn optioneel: ontbreken ze, dan logt de site een waarschuwing en
gaat hij door. De laatste drie werken omgekeerd. Een inlogcontrole zonder sleutel
hoort dicht te blijven, niet open te vallen — zonder `PORTAL_SECRET` of zonder
adressen komt er niemand in `/beheer`.

Waar je die waarden vandaan haalt en wat elke keuze betekent, staat stap voor stap
in **`docs/07-instellen.md`**.

De eigen database is twee tabellen in `db/schema.sql`, aangemaakt met
`npm run db:setup`. Geen migratieframework: twee tabellen die zelden veranderen
hebben geen gereedschap nodig dat zelf onderhoud vraagt.

Inhoud die nog ontbreekt heeft twee plekken, in deze volgorde: de database via
`/beheer/inhoud`, en anders `content/media.ts` en `content/nl.ts` in de code.
`lib/site-content.ts` legt die laag eroverheen — staat er iets in de database, dan
wint dat; staat er niets, dan blijft wat er in de code staat. Daardoor kan het
beheerscherm nooit een pagina leeg of stuk maken, en werkt alles ook zonder die
tabellen.

De Band App kent één taal. De bandbio en de tekst per lid staan daar in het
Nederlands; de Engelse versie ervan staat in de database van déze site, gemaakt in
`/beheer/vertalingen`. Bewust niet als extra kolom daar: de band leest in de app
geen Engels, en dit is pagina-inhoud. Bij elke vertaling staat een hash van de
Nederlandse brontekst. Wijzigt het origineel, dan geldt de vertaling als verouderd
en toont de site het Nederlands — liever een Nederlandse zin op een Engelse pagina
dan een Engelse zin die iets anders beweert.

Foto's gaan naar Vercel Blob. De browser uploadt daar rechtstreeks heen en deze
site geeft er alleen een kortlopende sleutel voor af — een serverloze functie op
Vercel neemt hooguit 4,5 MB aan verzoek aan, en daar zit een persfoto zo
overheen. `next.config.ts` staat alleen die ene host toe bij `images`; verruim die
lijst niet, dan wordt deze site een gratis afbeeldingsproxy.

## Voor wie dit is

Harm is de beheerder en degene die dit laat bouwen. Hij werkt in functioneel
beheer en maakt Next.js-projecten naast zijn werk, maar is geen beroepsontwikkelaar
— leg architectuurafwegingen uit in plaats van ze te veronderstellen, en kies de
pragmatische optie met minder beheerlast boven de slimme.

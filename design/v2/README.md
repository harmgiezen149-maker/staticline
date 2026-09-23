# Handoff: Static Line — publieke site v2 ("Ruis → Lijn")

## Overview
De publieke site van de band **Static Line** (rock, drie man, Nijmegen; eerste show 10 november 2026, Doornroosje; staticline.nl):
homepage met hero, uitgelichte volgende show, volledige agenda, fotosectie en footer, tweetalig **NL/EN**.
Doel van de pagina: bezoekers naar tickets sturen en boekers naar het boekingsadres.

**v2 voegt beweging toe als kernonderdeel van de identiteit**: een loader, page transitions, scroll- en entree-animaties,
hover- en cursorgedrag en een volledig ontworpen mobiel menupaneel. Layout, kleuren, typografie, content en
informatiestructuur blijven die van v1 (poster-achtige opbouw "1a — dicht", dark-only, Oswald / Inter / JetBrains Mono).
Het bandportaal (login, gekoppeld aan de Band App) krijgt alleen de gedeelde, lichte basis.

Dit document is zelfstandig leesbaar. Details staan in:
- `MOTION.md` — motion-principes, tokens, choreografie en specs per onderdeel (desktop, mobiel, reduced motion);
- `RESEARCH.md` — onderzoek van drie referentiesites, shortlist, conceptkeuze en goedgekeurde afwijkingen;
- `CLAUDE_CODE_PROMPT.md` — de instructie voor de implementatie.

## About the Design Files
De bestanden in dit pakket zijn **design references, gemaakt in HTML**: prototypes die de bedoelde vormgeving en het
gedrag tonen. Het is **geen productiecode om over te nemen**. De opdracht is om het ontwerp te **implementeren in de
bestaande codebase** (die al deels gebouwd is op v1), met de patronen, componentstructuur, routing, i18n en styling-aanpak
die daar al gebruikt worden.

- `reference/tokens.css` — alle design tokens, **inclusief motion tokens** (bron voor waarden).
- `reference/styles.css` — leesbare component-CSS inclusief alle bewegingstoestanden en reduced motion.
- `reference/index.html` — semantische markup met alle motion-hooks, **zonder JavaScript** (zo moet de site eruitzien als JS uit staat).
- `prototype/` — werkend prototype met alle beweging (vanilla JS + Web Animations API + Lenis).

## Fidelity
**High-fidelity**, zowel statisch als in beweging. Kleuren, typografie, spacing, states, timings en easings zijn definitief.
Eén uitzondering blijft: **de foto's zijn placeholders**. In v2 zijn dat abstracte duotone-texturen
(`assets/placeholder-1…5.webp`, gemaakt uit `background.jpg`), zodat het hovergedrag (gedempt → duotone) zichtbaar is.
Echte fotografie moet worden aangeleverd; zie *Assets*.

## Wat is er nieuw in v2 (en wat is gewijzigd t.o.v. v1)

**Vervallen:** alle v1-beperkingen op beweging (entree- en scroll-animaties, transforms, de korte kleurtransities als enige beweging). Beweging is nu vastgelegd in `MOTION.md`.

**Nieuw**
- Loader "Afstemmen": tv-sneeuw → één lijn → beeld, één keer per sessie, ≤ 2,0 s, overslaanbaar.
- Page transitions "Kanaalwissel": horizontale banden (publiek), crossfade (portaal), in-place decode bij NL/EN.
- Hero-intro, parallax en **docking**: het hero-wordmark "verhuist" bij scrollen naar de header.
- Scroll-entrees voor volgende-show-balk, shows (lijnen tekenen, rijen komen op) en foto's (banden trekken weg).
- Hovergedrag: vulling-wipes, "rest dimt" in de showlijst, zoekerhoeken op foto's, scramble op mono-labels, contextueel cursorlabel.
- **Mobiel menupaneel** (was nooit ontworpen): volledig ontwerp plus open/dicht-animatie.
- Lightbox voor foto's.
- Footer als "gordijn" onder de pagina.
- Levende korrel (de bestaande grain verspringt 8× per seconde).

**Kleine wijzigingen in de statische vormgeving** (bewust, ter controle)
1. Header is `sticky` en verbergt zich bij naar beneden scrollen; op de homepage verschijnt het header-wordmark pas als het hero-wordmark uit beeld is (docking). Op andere pagina's staat het er altijd.
2. Het hero-wordmark staat nu in een `<h1>` (`alt="Static Line"`). Visueel gelijk; beter voor SEO en schermlezers. Op de andere pagina's is de paginatitel de `<h1>`.
3. Klikbare showrijen tonen bij hover/focus een pijl `↗` achter de status; uitverkochte shows krijgen een doorhaallijn over de zaalnaam.
4. De v1-onderrand van de kop "Alle shows" (2 px) en die van de rijen (1 px) zijn nu lijnen die zichzelf tekenen; in rust identiek.
5. Foto-captions staan op een donker vlak (`rgba(9,11,13,.72)`) in `--text-muted` in plaats van `--text-faint`, omdat ze op echte foto's anders onleesbaar zijn.
6. Footer: naast het mailadres een link "Bandportaal" (mono, `--text-muted`). Plaats en label volgen de bestaande codebase als die al een portaal-link heeft.
7. Mobiel: NL/EN in de header zijn tikdoelen van 44 × 44 px. Zonder JS staan de navigatielinks in de header (het paneel werkt dan niet).
8. Mobiel, volgende-show-balk: de meta-regel (`2026 · 20:30`) is verborgen, zoals in de v1-screenshot.

## Screens / Views

### 1. Homepage — desktop (≥ 1025px, ontworpen op 1120px content-breedte)
Eén verticale kolom van volle breedte, secties zonder buitenmarges (edge-to-edge), geen max-width container.

1. **Site header** — `position: sticky; top: 0; display:flex; align-items:center; gap:24px; padding:12px 24px;`
   achtergrond `--bg-inset` (#090B0D), 1px onderrand `--border-default` (#333B42).
   - Links: wordmark-flat, hoogte 22px (homepage: verborgen tot docking, zie `MOTION.md` §6.3).
   - Nav (`margin-left:auto`): Shows · Foto's · Band — Oswald 600, 14px, letter-spacing 0.12em, uppercase, #EDE5D4, hover #C9482F, 2px onderlijn die tekent bij hover en op de actieve pagina.
   - CTA "Boeken": Oswald 700, 14px, ls 0.12em, uppercase, padding 8px 14px, achtergrond #B33A28, tekst #F7F2E8, hovervulling #C9482F.
   - Taalindicator: JetBrains Mono 11px, ls 0.1em — actieve taal #EDE5D4, inactieve #6B747C ("NL / en").
2. **Hero** — `position:relative; padding:72px 48px 48px; overflow:hidden;`
   achtergrondlaag `.hero__bg` met `background.jpg` (webp-varianten, zie *Assets*), `center/cover`, 12% hoger dan de hero voor parallax.
   Overlays: gradient `linear-gradient(180deg, rgba(13,15,18,0.45), rgba(13,15,18,0.92))` + levende grain (`grain.png`, opacity 0.5, `mix-blend-mode: overlay`) + ruissluier voor de intro.
   Inhoud (`flex-direction:column; gap:24px`):
   - Kicker "Eerste show — 10 november 2026": JetBrains Mono 12px, ls 0.28em, uppercase, #2AA5B5 (decodeert in).
   - `<h1>` met wordmark `staticline-wordmark` op **720px** breed, `filter: drop-shadow(0 12px 40px rgba(0,0,0,0.6))`. **Nooit hertekenen, herkleuren, uitrekken of vervormen.**
   - Subkop, max-width 560px, Inter 400 18px/28px, #EDE5D4.
   - Actierij `gap:12px`: primair "Boek ons" (#B33A28 / #F7F2E8, hovervulling #C9482F) + ghost "Alle shows" (1px rand #4A545C, hover #EDE5D4). Beide Oswald 700 16px, ls 0.12em, uppercase, padding 16px 28px, min-height 48px.
3. **Volgende-show-balk** — `display:flex`, volle breedte, #B33A28, tekst #F7F2E8.
   - Datumblok: padding 24px 32px, rechterrand 1px rgba(13,15,18,0.35); label "Volgende show" (Mono 11px, ls 0.22em, opacity .85), dag "10.11" (Oswald 700 **64px**, lh .95, tabulaire cijfers), meta "2026 · 20:30" (Mono 12px, ls 0.18em).
   - Tekstblok: padding 24px 32px; venue "Doornroosje, Nijmegen" (Oswald 700 30px, ls 0.03em, uppercase); noot Inter 14px/22px, opacity .92.
   - Tickets-knop (`margin-left:auto`): #090B0D, tekst #EDE5D4, padding 0 40px, volle hoogte, Oswald 700 16px; hovervulling #000.
4. **Alle shows** — `padding:64px 48px; flex-direction:column; gap:24px`.
   - Kop: h2 Oswald 700 44px/1.05 uppercase + 2px lijn #EDE5D4 eronder; aantal ("5 data") Mono 12px ls 0.18em #6B747C.
   - Rij: `grid-template-columns:160px 1fr 200px 140px; gap:16px; padding:16px 8px;` 1px lijn #333B42 eronder.
     Datum en venue Oswald 600 22px uppercase (#EDE5D4); stad Mono 12px ls 0.14em uppercase #9BA3AB; status rechts Mono 12px ls 0.14em uppercase, kleur per status.
     Hover (klikbaar): vulling #2A1614 die van links inloopt, rest van de lijst dimt naar 45%.
5. **Foto's** — `padding:64px 48px;` `--bg-surface` (#1C2126) + grain opacity 0.35.
   - h2 als bij "Alle shows" (zonder lijn).
   - Grid: `grid-template-columns:2fr 1fr 1fr; grid-auto-rows:200px; gap:8px`; eerste figure `grid-row: span 2`.
     Cel: 1px rand #333B42, foto `object-fit:cover`, caption linksonder (Mono 11px ls 0.1em #9BA3AB op `rgba(9,11,13,.72)`), knop over de hele cel die de lightbox opent.
6. **Footer** — `flex; align-items:center; gap:32px; padding:32px 48px;` #090B0D, 1px bovenrand #333B42, `position: sticky; bottom: 0` onder `main` (gordijn).
   Wordmark-flat 28px hoog (opacity .9); noot Mono 12px/18px ls 0.08em #9BA3AB; rechts het mailadres (Mono 12px ls 0.14em uppercase #2AA5B5) en "Bandportaal" (idem, #9BA3AB).

### 2. Homepage — mobiel (≤ 640px, ontworpen op 390px)
Zelfde secties en volgorde, compacter:
- **Header:** wordmark 16px hoog (na docking); NL/EN (44 × 44 tikdoelen); hamburger rechts, **44 × 44 px**, drie lijnen van 2px #EDE5D4 met 6px tussenruimte; nav + CTA verborgen (zie menupaneel).
- **Mobiel menupaneel (nieuw):** volledig scherm onder de header; links Shows / Foto's / Band in Oswald 700 44px met mono-index 01–03 in teal; onderaan "Boek ons" (volle breedte), NL / EN en het mailadres. Specs en animatie: `MOTION.md` §6.7.
- **Hero:** padding 40px 20px 28px, gap 16px; wordmark 100% breed; korte subkop (Inter 14px/22px); alleen de primaire knop, volle breedte, padding 14px 0, Oswald 700 15px. Gradient `rgba(13,15,18,0.4) → rgba(13,15,18,0.95)`.
- **Volgende show:** kolom, padding 20px; dag "10.11.26" Oswald 700 40px; venue 20px; noot en meta verborgen; tickets volle breedte, padding 12px 0, 14px.
- **Alle shows:** kop 26px; per show een gestapeld blok (datum Mono 11px ls 0.16em #9BA3AB boven de venue Oswald 600 18px, status rechts Mono 10px); **3** shows + link "Volledige agenda →" naar `/shows`.
- **Foto's / footer:** grid 2 kolommen (eerste cel volle breedte, 200px hoog); footer als kolom, gap 16px.

Referentiebeelden: `screens/staticline-desktop.jpg` en `screens/staticline-mobile.jpg` (v1, statisch) en `screens/v2-*.jpg` (sleutelmomenten van de beweging, uit het prototype).

### 3. Overige routes (voor de page transitions)
`/shows` (volledige agenda, h1 "Alle shows"), `/band` (bestaat of volgt; in het prototype een placeholder), `/portaal` (login, **lichte basis**), en de `/en/…`-varianten.

## Interactions & Behavior
- **Beweging** — volledig gespecificeerd in `MOTION.md` (loader, page transitions, hero, volgende show, shows, foto's, header/menu, footer, globaal).
- **Taalswitch NL/EN** — via routing (`/` en `/en`, of de i18n-routing van het framework), niet client-only. Schakelt alle copy en de datumnotatie ("10 nov 2026" / "10 Nov 2026"). Transition: variant `lang` (zelfde pagina, scrollpositie blijft, labels decoderen).
- **Show-status** — vier toestanden:
  `release` → "Releaseshow" / "Release show", #2AA5B5, klikbaar
  `tickets` → "Tickets", #2AA5B5, klikbaar (ticketlink)
  `announced` → "Aangekondigd" / "Announced", #9BA3AB, niet klikbaar, geen hover-respons
  `soldout` → "Uitverkocht" / "Sold out", #6B747C, niet klikbaar, `aria-disabled="true"`, doorhaallijn over de zaalnaam, geen hover-respons
- **Focus** — `outline: 2px solid #2AA5B5; outline-offset: 2px` op alle interactieve elementen (`:focus-visible`), nooit geanimeerd; focus-visible toont dezelfde toestand als hover.
- **Responsive** — breakpoints 1024px (tablet: hero-padding 32px, showrij 3 kolommen, fotogrid 2 kolommen) en 640px (mobiel).
- **Loading/error** — agenda serverside renderen; bij een lege agenda de sectie verbergen en in de volgende-show-balk "Geen shows gepland" tonen. Trage acties in het portaal: 2px teal voortgangslijn bovenaan.

## State Management
- `lang: "nl" | "en"` — via routing/i18n.
- `navOpen: boolean` — mobiel menupaneel (+ `aria-expanded`, `inert` op `main`/`footer`, scroll-lock).
- `sessionStorage["sl-intro-seen"]` — loader al gezien in deze sessie. Het enige stukje clientstate voor de beweging.
- Motion-state op `<html>`: `.js`, `.motion`, `.motion-ready`, `.sl-intro`, `.reduce-motion`, `data-page` (zie `MOTION.md` §4).
- **Data:** `shows` met `dateNl`, `dateEn`, `venue`, `city`, `status`, `ticketUrl`, `time`, `note`. Eerste toekomstige show = volgende-show-balk; de rest de agenda. Sorteren op datum, verlopen shows eruit. Zelfde databron als de Band App (niet aanpassen).
- **Foto's:** 5 items met `src`, `alt`, `caption`.

## Design Tokens
Volledige set: `reference/tokens.css`. Kort:

**Kleuren** — bg: base #0D0F12, surface #1C2126, raised #262D34, inset #090B0D ·
tekst: primary #EDE5D4, muted #9BA3AB, faint #6B747C (alleen mono-labels), on-accent #F7F2E8 ·
accent #B33A28, hover #C9482F, quiet #2A1614, alt/teal #2AA5B5 · lijnen #333B42 / #4A545C · focus #2AA5B5 · danger #D9503C.
**Dark only.**

**Typografie** — display **Oswald** 500/600/700 (koppen, knoppen, nav, data; altijd uppercase, ls 0.02–0.12em) ·
body **Inter** 400/600 · **JetBrains Mono** 400/500 (labels, statussen, metadata; ls 0.08–0.28em).
Schaal: 64 / 44 / 30 / 26 / 22 / 18 / 16 / 14 / 12 / 11 px.

**Spacing** (px): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96. **Border radius: 0**, overal.

**Motion** — durations 80 / 160 / 320 / 640 / 1100 ms; easings `--ease-signal` (in), `--ease-cut` (uit),
`--ease-band` (banden/transitions), `--ease-line` (lijnen), `--ease-drift` (scrub), `--ease-glitch` (steps);
staggers 22 / 60 / 70 / 90 / 40 ms; afstanden 2 / 12 / 24 / 48 px; parallax 18% / 10%. Zie `MOTION.md` §2.

**Schaduwen en gradients** — geen, behalve de drop-shadow op het hero-wordmark, de leesbaarheidsgradient in de hero en de
twee goedgekeurde afwijkingen:
- **AFW-1 kanaalverschuiving**: tekstkopieën in teal/oxiderood, ±2px, 120–160 ms, alleen op mono-labels (decode) en knoplabels (hover). Nooit op het wordmark.
- **AFW-2 scanlines**: `assets/scanlines.png`, 8–12% dekking, alleen tijdelijk tijdens loader, transitions, menu- en lightbox-opening.
- AFW-3 (gloed op de loaderlijn) is afgewezen.

## Assets
In `assets/`:
- `staticline-wordmark.png` — hoofd-wordmark (bron, 2108 × 1222). **Ongewijzigd gebruiken**: niet herkleuren, niet uitrekken, niet als SVG hertekenen. Altijd op een donkere ondergrond.
- `staticline-wordmark-1440.webp`, `-960.webp` — **nieuw**: alleen verkleind en gecomprimeerd (zelfde beeld, alfakanaal behouden) voor snelheid; 247 kB / 137 kB in plaats van 3,6 MB. Gebruik met `srcset`, `fetchpriority="high"` en preload.
- `staticline-wordmark-flat.png` + `staticline-wordmark-flat-400.webp` (**nieuw**, verkleind) — vlakke variant voor header (16–22px) en footer (28px).
- `background.jpg` + `background-1920.webp`, `background-960.webp` (**nieuw**, verkleind) — hero-achtergrond.
- `grain.png` — 256 × 256 tilende ruis (bestaand), nu ook voor de levende korrel en de ruissluier.
- `scanlines.png` — **nieuw**, 4 × 3 px patroon (1 px lijn per 3 px) voor AFW-2.
- `placeholder-1…5.webp` — **nieuw**, abstracte duotone-placeholders (rood / bone / teal), gemaakt uit `background.jpg`. Alleen om het hovergedrag te tonen; **vervangen door echte fotografie**.
- `fonts/` — **nieuw**: Oswald 500/600/700, Inter 400/600, JetBrains Mono 400/500 als woff2 (latin), met OFL-licenties. Zelf hosten met `font-display: swap`; preload Oswald 700, JetBrains Mono 400 en Inter 400.
- **Nog aan te leveren: fotografie.** (1) live shot staand, duotone rood #B33A28, (2) bandportret, (3) crowd, duotone teal #2AA5B5, (4) backstage, (5) gitaardetail. Duotone op de merkkleuren, hoog contrast, korrel toegestaan. Lever ze in webp/avif met `width`/`height`.

## Techniek en randvoorwaarden

### Libraries (zo weinig mogelijk)
| Keuze | Waarom | Grootte (gzip) |
|---|---|---|
| **Web Animations API + CSS-transities + IntersectionObserver** (native) | Alle entrees, wipes, banden, loader en transitions in het prototype draaien hierop. Easings rechtstreeks uit de tokens (`cubic-bezier`-strings). Animaties zijn met `.finish()`/`.cancel()` te stoppen (overslaan). | 0 kB |
| **Lenis** (optioneel, aanbevolen) | Smooth scroll op desktop met fijne pointer; uit op touch en bij reduced motion. | ±5,4 kB |
| Eigen motion-laag | Decode/scramble, reveals, loader, transitions, menu, cursorlabel, lightbox, parallax. In het prototype 32 kB leesbare bron, 5,8 kB geminificeerd + gzip. | ±6 kB |
| GSAP + ScrollTrigger | **Niet nodig.** Alleen overwegen als de codebase het al gebruikt; dan de timings uit `MOTION.md` overnemen. | ±28 + 18 kB |
| WebGL (Three.js/OGL) | **Niet gebruiken.** De ruis is een klein 2D-canvas op 1/3 resolutie, alleen tijdens de loader; de rest is CSS. WebGL voegt hier niets toe dat het gewicht waard is. | — |
| Barba/Swup | **Niet gebruiken.** Page transitions via de router van het framework of de View Transitions API. | — |

### Performancebudget
- Animeer alleen `transform`, `opacity`, `clip-path` en `filter` (filter alleen op foto-hover). Geen `width`/`height`/`top`.
- **LCP**: de loader ligt over de pagina heen en verbergt het wordmark niet; preload wordmark (webp) en fonts. **Doel ≤ 2,5 s op 4G.**
  Gemeten in het prototype (lokaal geserveerd, twee runs): LCP 224–356 ms desktop, 276–372 ms mobiel bij 4× CPU-vertraging. LCP-element is de hero-achtergrond; de loader vertraagt het niet.
- **CLS ≤ 0,05**: entrees zijn transforms, decode gebruikt een overlay. Gemeten: 0,000 desktop en mobiel met preload van Inter 400 (zonder die preload 0,019 door font-swap in de volgende-show-balk).
- **60 fps op een middenklasse telefoon**: gemeten in headless Chromium met 4× CPU-vertraging op 390px (twee runs): scrollen gemiddeld 16,7–17,0 ms per frame (p95 ≤ 16,8 ms, 0–2 frames > 20 ms); tijdens de intro gemiddeld 16,7–17,6 ms (0–9 van ±170 frames > 20 ms). Een echte telefoon moet nog getest worden.
- Levende korrel pauzeert buiten beeld; het ruiscanvas stopt na de loader en verdwijnt uit de DOM.
- Laad de motion-laag `defer`; zware onderdelen (lightbox, cursorlabel) mogen lazy. Geen layout shifts door late JS: begin-toestanden gelden alleen onder `html.motion` (inline head-script).

### Toegankelijkheid
- `prefers-reduced-motion` volledig ondersteund (tabel in `MOTION.md` §7), via het inline head-script en een CSS-mediaquery.
- Geen flitsen: ruis blijft binnen 4% luminantieverschil; geen effect herhaalt vaker dan 2× per seconde (`MOTION.md` §8).
- Focus blijft zichtbaar en logisch: na een page transition naar de `<h1>`, na het menu terug naar de knop, na de lightbox terug naar de foto.
- Content blijft leesbaar zonder JavaScript (`reference/index.html` is die toestand).
- Contrast zoals v1 (body #EDE5D4 op #0D0F12; #6B747C alleen voor mono-labels van 11–12px); hit targets ≥ 44px op mobiel; `alt` op fotografie; wordmark `alt="Static Line"`.

### SEO / SSR
- Alle content blijft **server-rendered en indexeerbaar**; loader, banden en overlays zijn decoratief (`aria-hidden`) en worden alleen onder `html.sl-intro`/`.motion` getoond.
- Page transitions werken via de router of de View Transitions API; zonder JS is het gewone navigatie. Geen hash-routing (dat is alleen voor het prototype).
- `<html lang>` per taal, `hreflang` tussen `/` en `/en`.

### Portaal (lichte basis)
Alleen: tokens, focusstijl, page transition variant `calm` (crossfade 200/240 ms), 2px voortgangslijn voor trage acties, reduced motion.
**Geen** loader, ruis, scanlines, decode, cursorlabel of parallax. Band App-koppeling, login en portaalrouting niet aanraken.

## Files
```
design_handoff_static_line_v2/
├── README.md                 ← dit document (zelfstandig leesbaar)
├── MOTION.md                 ← motion-systeem en specs per onderdeel, incl. reduced motion
├── RESEARCH.md               ← onderzoekstabellen, shortlist, conceptkeuze, afwijkingen, bronnen
├── CLAUDE_CODE_PROMPT.md     ← kant-en-klare instructie voor Claude Code
├── reference/
│   ├── tokens.css            ← design tokens incl. motion tokens
│   ├── styles.css            ← component-CSS + bewegingstoestanden + reduced motion + @font-face
│   └── index.html            ← semantische referentie (NL) met motion-hooks, zonder JS
├── prototype/
│   ├── index.html            ← werkend prototype (open direct in de browser)
│   ├── motion.js             ← motion-laag (referentie, niet kopiëren)
│   ├── demo.js               ← alleen prototype: templates, NL/EN, hash-router, bediening
│   ├── prototype.css         ← alleen prototype: bediening, band- en portaalplaceholder
│   └── vendor/lenis.min.js   ← Lenis 1.3 (MIT)
├── screens/
│   ├── staticline-desktop.jpg, staticline-mobile.jpg   ← v1, statisch
│   └── v2-desktop-*.jpg, v2-mobile-*.jpg               ← sleutelmomenten v2
└── assets/                   ← wordmarks, achtergrond, grain, scanlines, placeholders, fonts
```

**Prototype bekijken:** open `prototype/index.html` in Chrome, Edge, Safari of Firefox (werkt via `file://`).
Linksonder staan knoppen voor **Reduced motion** (aan/uit, herlaadt de pagina) en **Loader opnieuw**.
Routes: `#/`, `#/en`, `#/shows`, `#/band`, `#/portaal`. Taalwissel via "NL / en" in de header.

## Implementatie-checklist
1. Motion tokens toevoegen aan het token-/themasysteem van de codebase (naast de bestaande tokens).
2. Inline head-script + state-klassen; begin-toestanden alleen onder `html.motion`.
3. Globale motion-laag: reveals (IntersectionObserver), decode, levende korrel, smooth scroll (desktop), header verbergen/tonen.
4. Loader (één keer per sessie, overslaanbaar, LCP-neutraal).
5. Page transitions (`band`, `lang`, `calm`) met focus- en scrollbeheer.
6. Secties: hero (intro, parallax, docking), volgende show, shows, foto's + lightbox, footer.
7. Mobiel menupaneel.
8. Reduced motion per effect; zonder-JS-toestand controleren.
9. Verifiëren: build, visueel desktop en mobiel, reduced motion, Lighthouse (LCP, CLS, TBT).

## Bekende beperkingen
- De **foto's zijn placeholders**; het gedempt → duotone-effect is pas echt te beoordelen met de echte beelden.
- Het prototype is getest in headless Chromium (desktop 1440 × 900, mobiel 390 × 844 met touch-emulatie, 4× CPU-vertraging). Niet getest op echte iOS Safari, Firefox of een fysieke telefoon.
- Page transitions in het prototype zijn hash-routes binnen één document; in productie horen het echte routes te zijn (SSR).
- De `/band`-pagina is een placeholder.
- De motion-laag van het prototype staat in één bestand voor overzicht; in de codebase hoort hij per component/hook.

## Zelfcontrole (fase 9)
| Punt | Resultaat |
|---|---|
| Elk ontworpen effect heeft specs voor desktop, mobiel en reduced motion | Ja: `MOTION.md` §6.1–6.9 per onderdeel, plus de overzichtstabel in §7. |
| Geen v1-regel die beweging verbiedt staat nog in het pakket | Ja: README, tokens en CSS gecontroleerd; de oude regels zijn alleen als "vervallen" benoemd. |
| Wordmark nergens hertekend, herkleurd of vervormd | Ja: alleen verkleind/gecomprimeerd (webp, q88, alfakanaal intact; de PNG blijft de bron). In de beweging alleen `translate`, `opacity`, `clip-path`-onthulling en ruis erover. |
| Geen code of assets letterlijk van de referentiesites | Ja: alle assets komen uit het Static Line-design system of zijn hier gegenereerd; de code is eigen. De broncode van de sites is alleen gelezen om timings te analyseren. Easings zijn standaardcurves. |
| Prototype getest, beperkingen benoemd | Ja: headless Chromium op 1440 × 900, 820 × 1100 en 390 × 844 (touch), reduced motion, zonder JS, 4× CPU-vertraging; zie *Bekende beperkingen*. |


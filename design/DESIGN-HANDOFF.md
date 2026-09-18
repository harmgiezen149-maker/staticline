# Handoff: Static Line — publieke homepage

## Overview
De publieke homepage van de band **Static Line**: hero met wordmark, uitgelichte volgende show,
volledige agenda en een fotosectie. Doel van de pagina: bezoekers naar tickets sturen en boekers
naar het boekingsadres. Eén pagina, dark-only, poster-achtige opbouw (variant "1a — dicht"),
typografie **Oswald (display) / Inter (body)**, tweetalig **NL/EN**.

## About the Design Files
De bestanden in dit pakket zijn **design references, gemaakt in HTML** — prototypes die de
bedoelde vormgeving en het gedrag tonen. Het is **geen productiecode om over te nemen**.
De opdracht is om deze designs te **herbouwen in de bestaande omgeving van de doelcodebase**
(React/Next, Vue, Astro, Laravel Blade, etc.) met de daar gebruikelijke patronen, componentstructuur
en styling-aanpak. Bestaat die omgeving nog niet, kies dan het framework dat het beste past
(voor een bandsite met weinig dynamiek: een static-site generator met een CMS of MDX voor shows)
en implementeer het design daar.

`reference/index.html` + `reference/styles.css` + `reference/tokens.css` zijn bewust geschreven als
**leesbare, semantische referentie-implementatie** (BEM-achtige klassen, media queries op 1024px en
640px). Gebruik ze als bron voor waarden en structuur; port de klassen naar je eigen
styling-systeem (CSS modules, Tailwind config, styled-components — wat de codebase gebruikt).

## Fidelity
**High-fidelity.** Kleuren, typografie, spacing en states zijn definitief en komen uit het
Static Line design system. Bouw de UI pixel-precies na met de bibliotheken en patronen van de codebase.
Eén uitzondering: **de foto's zijn placeholders** (diagonaal streeppatroon met een tekstlabel dat de
bedoelde inhoud beschrijft). Echte fotografie moet worden aangeleverd; zie *Assets*.

## Screens / Views

### 1. Homepage — desktop (≥1025px, ontworpen op 1120px content-breedte)
**Purpose:** bezoeker ziet direct wie de band is, wanneer de volgende show is, en kan doorklikken
naar tickets of boeking.

**Layout:** één verticale kolom van volle breedte, secties zonder buitenmarges (edge-to-edge),
geen max-width container in het ontwerp; de pagina-inhoud loopt door tot de randen van het venster.
Verticale opbouw van boven naar beneden:

1. **Site header** — `display:flex; align-items:center; gap:24px; padding:12px 24px;`
   achtergrond `--bg-inset` (#090B0D), 1px onderrand `--border-default` (#333B42).
   - Links: wordmark-flat, hoogte 22px.
   - Nav (`margin-left:auto`): Shows · Foto's · Band — Oswald 600, 14px, letter-spacing 0.12em, uppercase, kleur #EDE5D4, hover #C9482F.
   - CTA-knop "Boeken": Oswald 700, 14px, ls 0.12em, uppercase, padding 8px 14px, achtergrond #B33A28, tekst #F7F2E8, hover #C9482F.
   - Taalindicator rechts: JetBrains Mono 11px, ls 0.1em — actieve taal #EDE5D4, inactieve #6B747C ("NL / en").
2. **Hero** — `position:relative; padding:72px 48px 48px;`
   achtergrondafbeelding `assets/background.jpg`, `center/cover`, op `--bg-base`.
   Twee overlays op elkaar:
   - gradient `linear-gradient(180deg, rgba(13,15,18,0.45), rgba(13,15,18,0.92))`
   - grain: `assets/grain.png` (256×256, tilend), `opacity:0.5; mix-blend-mode:overlay`
   Inhoud (`display:flex; flex-direction:column; gap:24px`):
   - Kicker: "Eerste show — 10 november 2026" — JetBrains Mono 12px, ls 0.28em, uppercase, kleur #2AA5B5.
   - Wordmark `staticline-wordmark.png`, breedte **720px**, `filter: drop-shadow(0 12px 40px rgba(0,0,0,0.6))`. **Nooit hertekenen, herkleuren of uitrekken.**
   - Subkop, max-width 560px, Inter 400 18px/28px, kleur #EDE5D4.
   - Actierij `gap:12px`: primaire knop "Boek ons" (#B33A28, tekst #F7F2E8) + ghost-knop "Alle shows" (1px rand #4A545C, hover rand #EDE5D4). Beide Oswald 700 16px, ls 0.12em, uppercase, padding 16px 28px.
3. **Volgende-show-balk** — `display:flex` over volle breedte, achtergrond #B33A28, tekst #F7F2E8.
   - Datumblok: padding 24px 32px, rechterrand 1px rgba(13,15,18,0.35); label "Volgende show" (Mono 11px, ls 0.22em, uppercase, opacity .85), dag "10.11" (Oswald 700, **64px**, line-height .95), meta "2026 · 20:30" (Mono 12px, ls 0.18em).
   - Tekstblok: padding 24px 32px; venue "Doornroosje, Nijmegen" (Oswald 700, 30px, ls 0.03em, uppercase); noot Inter 14px/22px, opacity .92.
   - Tickets-knop (`margin-left:auto`): achtergrond #090B0D, tekst #EDE5D4, padding 0 40px, volledige hoogte van de balk, Oswald 700 16px ls 0.12em uppercase.
4. **Alle shows** — `padding:64px 48px; display:flex; flex-direction:column; gap:24px`.
   - Kop: h2 Oswald 700 44px/1.05 uppercase + 2px onderrand #EDE5D4, daarnaast aantal ("5 data") in Mono 12px ls 0.18em #6B747C.
   - Rij: `display:grid; grid-template-columns:160px 1fr 200px 140px; gap:16px; padding:16px 8px;`
     1px onderrand #333B42, hover achtergrond #2A1614 (transition 120ms).
     Datum en venue Oswald 600 22px uppercase (#EDE5D4); stad Mono 12px ls 0.14em uppercase #9BA3AB;
     status rechts uitgelijnd Mono 12px ls 0.14em uppercase, kleur per status (zie *Interactions*).
5. **Foto's** — `padding:64px 48px;` achtergrond `--bg-surface` (#1C2126) + grain-overlay `opacity:0.35`.
   - h2 identiek aan Alle shows (zonder onderrand).
   - Grid: `grid-template-columns:2fr 1fr 1fr; grid-auto-rows:200px; gap:8px`; eerste figure `grid-row: span 2`.
     Elke cel: 1px rand #333B42, caption linksonder (Mono 11px ls 0.1em #6B747C), foto `object-fit:cover`.
6. **Footer** — `display:flex; align-items:center; gap:32px; padding:32px 48px;`
   achtergrond #090B0D, 1px bovenrand #333B42. Wordmark-flat 28px hoog (opacity .9),
   noot in Mono 12px/18px ls 0.08em #9BA3AB, e-mailadres rechts (`margin-left:auto`) Mono 12px ls 0.14em uppercase #2AA5B5.

### 2. Homepage — mobiel (≤640px, ontworpen op 390px)
Zelfde secties en volgorde, compacter:
- **Header:** wordmark 16px hoog, nav + CTA verborgen, hamburger rechts — **44×44px hit target**, drie lijnen van 2px in #EDE5D4, onderling 6px.
- **Hero:** padding 40px 20px 28px, gap 16px; wordmark 100% breedte; subkop korte variant (Inter 14px/22px); alleen de primaire knop, volle breedte, padding 14px 0, Oswald 700 15px. Gradient sterker: `rgba(13,15,18,0.4) → rgba(13,15,18,0.95)`.
- **Volgende show:** kolom, padding 20px; dag "10.11.26" Oswald 700 40px; venue 20px; noot verborgen; tickets-knop volle breedte, padding 12px 0, 14px.
- **Alle shows:** kop 26px; per show een gestapeld blok — datum in Mono 11px ls 0.16em #9BA3AB boven de venue (Oswald 600 18px), status rechts in Mono 10px; 1px onderrand, geen hover. Op mobiel worden **3** shows getoond met daaronder een link naar de volledige agenda.
- **Foto's / footer:** grid 2 kolommen (eerste cel volle breedte, 200px hoog), footer als kolom met gap 16px.

Zie `screens/staticline-desktop.jpg` en `screens/staticline-mobile.jpg` voor de gerenderde referentie (2× resolutie).

## Interactions & Behavior
- **Taalswitch NL/EN** — schakelt alle copy (nav, kicker, subkoppen, knoppen, statuslabels, datumnotatie: "10 nov 2026" vs "10 Nov 2026") en toont de actieve taal met volle kleur, de andere in #6B747C. In productie: routes `/` en `/en` (of i18n-routing van het framework), niet client-only. Het prototype bewaart de keuze in `localStorage` onder `sl-lang` — puur prototype-gemak, niet nabouwen.
- **Show-status** — vier toestanden, elk met eigen kleur en label:
  `release` → "Releaseshow" / "Release show", #2AA5B5
  `tickets` → "Tickets", #2AA5B5 (rij klikbaar naar ticketlink)
  `announced` → "Aangekondigd" / "Announced", #9BA3AB (geen link)
  `soldout` → "Uitverkocht" / "Sold out", #6B747C (geen link, rij niet klikbaar, `aria-disabled="true"`)
- **Hover** — showrij: achtergrond naar #2A1614, 120ms ease. Knoppen: primair #B33A28 → #C9482F; ghost: rand #4A545C → #EDE5D4. Links: #EDE5D4 → #C9482F. Geen transform/scale-effecten.
- **Focus** — `outline: 2px solid #2AA5B5; outline-offset: 2px` op alle interactieve elementen (`:focus-visible`).
- **Animatie** — het ontwerp bevat geen scroll- of entree-animaties; alleen de 120ms kleurtransities. Houd het zo.
- **Responsive** — breakpoints 1024px (tablet: hero-padding 32px, showrij 3 kolommen, fotogrid 2 kolommen) en 640px (mobiel, zie boven).
- **Loading/error states** — niet ontworpen. Voorstel: agenda serverside renderen; bij een lege agenda de sectie verbergen en in de volgende-show-balk "Geen shows gepland" tonen in plaats van datum/venue.

## State Management
Zeer beperkt:
- `lang: "nl" | "en"` — bij voorkeur via routing/i18n, niet als clientstate.
- `navOpen: boolean` — mobiel menu (het paneel zelf is nog niet ontworpen; vraag hier om design voor je improviseert).
- **Data:** lijst `shows` met velden `dateNl`, `dateEn`, `venue`, `city`, `status`, `ticketUrl`, `time`, `note`. De eerste toekomstige show vult de volgende-show-balk; de rest de agenda. Sorteren op datum, verlopen shows uitfilteren. Bron: CMS of een eenvoudig `shows.json`/markdown-frontmatter.
- **Fotosectie:** 5 items met `src`, `alt`, `caption`.

## Design Tokens
Volledige set: `reference/tokens.css`. Kort:

**Kleuren** — bg: base #0D0F12, surface #1C2126, raised #262D34, inset #090B0D ·
tekst: primary #EDE5D4, muted #9BA3AB, faint #6B747C (alleen mono-labels), on-accent #F7F2E8 ·
accent #B33A28, hover #C9482F, quiet #2A1614, alt/teal #2AA5B5 ·
lijnen #333B42 / #4A545C · focus #2AA5B5 · danger #D9503C.
**Dark only** — er is geen light theme.

**Typografie** — display **Oswald** 500/600/700 (koppen, knoppen, nav, data; altijd uppercase,
letter-spacing 0.02–0.12em) · body **Inter** 400/600 (lopende tekst) · **JetBrains Mono** 400/500
(labels, statussen, metadata; letter-spacing 0.08–0.28em).
Schaal: 64px / 44px / 30px / 26px / 22px / 18px / 16px / 14px / 12px / 11px.

**Spacing** (px): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.

**Border radius: 0** — overal, zonder uitzondering. **Geen schaduwen** behalve de drop-shadow op
het hero-wordmark. Geen gradients als decoratie; de enige gradient is de leesbaarheids-overlay in de hero.

## Assets
In `assets/`:
- `staticline-wordmark.png` — hoofd-wordmark (textuur, scheuren, rode spatten). Uit het design system, **ongewijzigd gebruiken**: niet herkleuren, niet uitrekken, niet als SVG hertekenen. Levert de textuur van het merk; zet hem altijd op een donkere ondergrond.
- `staticline-wordmark-flat.png` — vlakke variant voor kleine formaten (header 16–22px, footer 28px).
- `background.jpg` — hero-achtergrond (donkere geschilderde/verweerde plaat) uit het design system.
- `grain.png` — 256×256 tilende ruistextuur, in dit project gegenereerd als vervanging voor een SVG-noise-filter (dat niet betrouwbaar exporteert). Gebruik als `background-image` met `mix-blend-mode: overlay`, opacity 0.35–0.5. Vervang gerust door een eigen grain-asset.
- **Nog aan te leveren: fotografie.** 5 beelden: (1) live shot staand/portrait — duotone rood #B33A28, (2) bandportret, (3) crowd — duotone teal #2AA5B5, (4) backstage, (5) gitaardetail. Behandeling: duotone op de merkkleuren, hoog contrast, korrel toegestaan. In de referentie zitten placeholders met deze labels.
- **Fonts:** Oswald, Inter en JetBrains Mono. In de referentie via Google Fonts; in productie zelf hosten (woff2, `font-display: swap`) voor snelheid en privacy.

## Files
```
design_handoff_static_line_homepage/
├── README.md                     ← dit document (zelfstandig te lezen)
├── reference/
│   ├── index.html                ← semantische, responsive referentie-implementatie (NL)
│   ├── styles.css                ← alle component-CSS + breakpoints 1024/640
│   └── tokens.css                ← design tokens als CSS-variabelen
├── prototype/
│   ├── Static Line Homepage.dc.html  ← origineel prototype met NL/EN-switch, desktop- en mobielframe naast elkaar
│   ├── support.js                    ← runtime van het prototype (niet nodig in productie)
│   └── assets/
├── screens/
│   ├── staticline-desktop.jpg    ← gerenderde referentie, 2244px breed
│   └── staticline-mobile.jpg     ← gerenderde referentie, 784px breed
└── assets/                       ← wordmarks, hero-achtergrond, grain
```

Open `reference/index.html` direct in een browser om het design te bekijken en de responsive
overgangen te testen; open `prototype/Static Line Homepage.dc.html` om de NL/EN-switch en beide
frames naast elkaar te zien.

## Implementatie-checklist
1. Tokens overnemen in het styling-systeem van de codebase (CSS-variabelen, Tailwind theme, of gelijkwaardig).
2. Fonts zelf hosten; `Oswald` alleen in de gewichten 500/600/700, `Inter` 400/600.
3. Secties bouwen als componenten: `SiteHeader`, `Hero`, `NextShow`, `ShowList` + `ShowRow`, `PhotoGrid`, `SiteFooter`.
4. Shows uit één databron halen; `NextShow` = eerste toekomstige item.
5. i18n via routing; alle copy uit een resource-bestand (NL en EN staan in het prototype en in `reference/index.html`).
6. Mobiel menu-paneel laten ontwerpen voor je het bouwt.
7. Toegankelijkheid: contrast is gecontroleerd (body #EDE5D4 op #0D0F12; #6B747C uitsluitend voor mono-labels van 11–12px in secundaire rol — gebruik het nooit voor lopende tekst), focus-ring 2px #2AA5B5, hit targets ≥44px op mobiel, `alt`-teksten op fotografie, wordmark als `alt="Static Line"`.

# Static Line v2 — Motion-systeem en specs per onderdeel

Concept: **"Ruis → Lijn"**. Gekozen in de checkpoint, onderbouwing in `RESEARCH.md` §5.
Alles komt binnen als ruis (korrel, scanlines, decoderende tekens) en eindigt als een strakke lijn of rechte rand.
De rusttoestand is altijd het ontwerp uit de README; beweging is de weg ernaartoe, nooit een blijvende storing.

Waarden staan als CSS-variabelen in `reference/tokens.css`. Het prototype (`prototype/`) leest ze daar ook uit,
zodat CSS en JS één bron hebben. Referenties naar het onderzoek staan als **[W4]**, **[V1]**, **[N5]** enzovoort
(W = WeEvolveIT, V = Volt, N = No Art; zie `RESEARCH.md`).

---

## 1. Motion-principes

1. **Ruis is de entree, de lijn is de rust.** Elk element komt binnen via storing en eindigt stil, scherp en recht. Storing duurt kort (≤ 600 ms per element) en blijft nooit hangen.
2. **Horizontaal en recht.** Beweging loopt langs de horizontale as: banden, wipes, scanlines, lijnen die van links naar rechts tekenen. Verticaal alleen voor parallax, tekst die opkomt en het openen van de loaderlijn. Geen rotatie van content, geen bounce, geen elastiek. De enige draaiing is het ×-icoon van het menu.
3. **Hard in, lang uit.** Entrees zetten snel aan en lopen lang uit (`--ease-signal`); wat verdwijnt, knipt versnellend weg (`--ease-cut`); vlakken en banden bewegen symmetrisch (`--ease-band`).
4. **Het wordmark is heilig.** Het wordmark beweegt alleen als geheel (`translate`, `opacity`) en wordt alleen onthuld met maskers, banden of ruis erover. Nooit schalen, splitsen, verschuiven per deel, herkleuren of vervormen. Het staat vanaf de eerste paint in de DOM (LCP).
5. **Eén keer is spektakel.** Het grote gebaar (loader + hero-intro) gebeurt één keer per sessie. Daarna is alles kort en functioneel. Content is binnen 2,5 s bruikbaar, overslaan kan altijd en zonder JavaScript staat alles gewoon in beeld.

---

## 2. Motion tokens

Zie `reference/tokens.css` voor de CSS. Samenvatting:

| Groep | Token | Waarde | Gebruik |
|---|---|---|---|
| Duur | `--dur-instant` | 80 ms | één storingsframe, drukfeedback |
| | `--dur-fast` | 160 ms | hoverkleur, dimmen, kanaalverschuiving (AFW-1) |
| | `--dur-base` | 320 ms | header in/uit, hover-wipes, korte lijnen, cursorlabel |
| | `--dur-slow` | 640 ms | sectie-entrees, band-wipes, tekst die opkomt |
| | `--dur-dramatic` | 1100 ms | tracking-band in de loader |
| Easing | `--ease-signal` | `cubic-bezier(0.16, 1, 0.3, 1)` | **in**: entrees, hover-vulling |
| | `--ease-cut` | `cubic-bezier(0.7, 0, 0.84, 0)` | **uit**: header weg, menu dicht, loader klapt samen |
| | `--ease-band` | `cubic-bezier(0.87, 0, 0.13, 1)` | banden, wipes, page transitions, lightbox |
| | `--ease-line` | `cubic-bezier(0.65, 0, 0.35, 1)` | lijnen tekenen (`scaleX`) |
| | `--ease-drift` | `linear` | parallax en alles wat gescrubd is |
| | `--ease-glitch` | `steps(2, jump-none)` | storingsframes zonder tussenwaarden |
| Stagger | `--stagger-char` | 22 ms | tekens klikken vast (schaalt mee met de decode-duur) |
| | `--stagger-item` | 60 ms | menu-items, hero-knoppen |
| | `--stagger-row` | 70 ms | showrijen |
| | `--stagger-photo` | 90 ms | foto's in rasterorde |
| | `--stagger-band` | 40 ms | banden (menu, page transition, foto-entree) |
| Afstand | `--shift-glitch` | 2 px | kanaalverschuiving |
| | `--shift-sm` | 12 px | tekst en rijen die opkomen |
| | `--shift-md` | 24 px | menu-items |
| | `--shift-lg` | 48 px | reserve voor grote koppen |
| | `--parallax-bg` | 18% | hero-achtergrond, van de hero-hoogte |
| | `--parallax-mark` | 10% | hero-wordmark, van de hero-hoogte |
| Ruis/lijn | `--noise-opacity` | 0.5 | bestaande hero-grain |
| | `--noise-step` | 125 ms | levende korrel: 8 sprongen per seconde |
| | `--scanline` / `--scanline-opacity` | `scanlines.png` / 0.08 | AFW-2, alleen tijdens loader en transitions |
| | `--line-weight` | 2 px | loaderlijn, kop-onderlijn, doorhaallijn |
| Caps | `--loader-min` / `--loader-max` | 900 / 1200 ms (mobiel 700 / 1000) | teller-duur |
| | `--intro-max` | 2500 ms | eerste paint → alle hero-elementen stil |

Alle easings zijn gangbare standaardcurves (easeOutExpo, easeInExpo, easeInOutExpo, easeInOutCubic), geen signature-curves van de referentiesites.

**Reduced motion** overschrijft in `tokens.css`: alle staggers en afstanden naar 0, `--dur-base` 160 ms, `--dur-slow` en `--dur-dramatic` 200 ms. Wat per effect wegvalt, staat in §7.

---

## 3. Afwijkingen van visuele regels (goedgekeurd in de checkpoint)

| Code | Wat | Status |
|---|---|---|
| **AFW-1** | Kanaalverschuiving: twee harde tekstkopieën in teal `#2AA5B5` en oxiderood `#B33A28`, ±2 px horizontaal, 120–160 ms. Alleen op mono-labels tijdens decode en op knoplabels bij hover/focus. Technisch `text-shadow` zonder blur. **Nooit op het wordmark.** | **Aan** |
| **AFW-2** | Scanlines: `assets/scanlines.png` (1 px lijn per 3 px), dekking 0.08–0.12, **alleen tijdelijk**: loader, page transition, menu-opening, lightbox-opening. Nooit permanent op content. | **Aan** |
| AFW-3 | Gloed op de loaderlijn. | **Uit** (lijn zonder gloed) |

Alle andere regels blijven: radius 0, geen schaduwen (behalve de bestaande drop-shadow op het hero-wordmark en AFW-1), geen decoratieve gradients (behalve de bestaande leesbaarheidsgradient in de hero).

---

## 4. Motion-state en het inline head-script

De motion-laag hangt aan klassen op `<html>`, gezet **vóór de eerste paint** door een klein inline script in `<head>`:

```html
<html lang="nl" class="no-js">
<head>
<script>
(function () {
  var d = document.documentElement;
  d.classList.remove("no-js"); d.classList.add("js");
  var reduce = false;
  try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  if (reduce) { d.classList.add("reduce-motion"); return; }
  d.classList.add("motion");
  var seen = true;
  try { seen = sessionStorage.getItem("sl-intro-seen") === "1"; } catch (e) {}
  if (!seen) d.classList.add("sl-intro");                 // alleen op publieke routes, nooit in het portaal
  setTimeout(function () {                                // failsafe: motion-laag niet gestart → alles tonen
    if (!d.classList.contains("motion-ready")) d.classList.remove("motion", "sl-intro");
  }, 2500);
})();
</script>
```

| Klasse | Betekenis | Effect in CSS |
|---|---|---|
| `.no-js` | geen JS | alles in eindtoestand; mobiel: navigatielinks in de header, geen hamburger |
| `.motion` | JS aan, geen reduced motion | begin-toestanden van entrees gelden (`[data-reveal]:not(.is-in)`, `[data-decode]:not(.is-decoded)`) |
| `.motion-ready` | motion-laag gestart | zet de CSS-failsafe van de loader uit |
| `.sl-intro` | eerste bezoek in deze sessie | loader zichtbaar, header staat klaar boven beeld |
| `.reduce-motion` | reduced motion | zie §7 |
| `[data-page="home"]` | homepage | docking van het header-wordmark actief |

Markup-hooks (zie `reference/index.html`):

| Attribuut | Betekenis |
|---|---|
| `data-reveal="rise \| wipe \| mask"` of leeg | entree via IntersectionObserver → `.is-in`; na afloop `.is-settled` |
| `data-reveal-manual` | niet door de observer, maar door een choreografie (hero) |
| `data-stagger="row \| photo \| item"` | gelijktijdige binnenkomers krijgen `--delay` = index × `--stagger-*` |
| `data-decode` (+ `data-decode-digits`) | tekst decodeert uit ruis; alleen mono-labels en cijfers |
| `data-decode-manual` | decode wordt door een component gestart (menu-index, lightbox-caption, hero-kicker) |
| `data-scramble-hover` / `data-scramble-target` | korte scramble bij hover (fijne pointer) |
| `data-cursor="Tekst"` | contextueel cursorlabel (fijne pointer) |

---

## 5. Choreografie

### 5.1 Eerste bezoek (desktop, typische verbinding)

| t (ms) | Wat | Duur · easing |
|---|---|---|
| 0 | Eerste paint: loader ligt over de volledig gerenderde pagina (hero-wordmark = LCP-kandidaat, al geschilderd). Ruis start, readout-label decodeert. | label 360 ms |
| 0 → 1100 | Tracking-band (14vh, iets lichter) loopt één keer van boven naar beneden. | 1100 ms · linear |
| 0 → 900…1200 | Teller 000 → 092 op tijd, → 100 zodra fonts + wordmark klaar zijn **en** minimaal 900 ms verstreken is. Harde grens 1200 ms. | — |
| G (900–1200) | **Samenklappen**: ruislaag `scaleY 1 → 0.004` naar het midden; readout en hint verdwijnen; op +180 ms verschijnt de 2 px lijn. | 240 ms · `--ease-cut` |
| G + 300 | **Openen**: bovenste en onderste paneel schuiven uit elkaar (`translateY ∓100%`); lijn vervaagt; header schuift binnen. | 500 ms · `--ease-band`; header 320 ms · `--ease-signal` |
| G + 300 | Hero-intro "full" start (zie §6.3). | tot ±1000 ms |
| G + 600 | Scroll-entrees gaan aan (de volgende-show-balk komt binnen als hij in beeld is). | — |
| **≤ 2500** | Alle hero-elementen staan stil. | cap `--intro-max` |

**Overslaan:** klik/tik op de loader of een willekeurige toets → samenklappen 120 ms, openen 260 ms, hero-intro "short". Content is direct daarna bedienbaar.
**Mobiel:** zelfde volgorde, teller 700–1000 ms, ruis op ¼ resolutie, geen hint-tekst.

### 5.2 Herhaalbezoek in dezelfde sessie / aankomst via page transition
Geen loader. Hero-intro "short" (≤ 800 ms). Scroll-entrees direct aan.

### 5.3 Page transition
Uit ≈ 520 ms (5 banden × 40 ms stagger + 360 ms) → content wissel → in ≈ 580 ms. Totaal ≈ 1,1 s plus laadtijd.

### 5.4 Maximale duren
Loader ≤ 1,2 s teller + 0,8 s sluiten/openen · intro-cap 2,5 s · page transition ≤ 1,1 s + laadtijd · menu open ≤ 1,0 s (bedienbaar na 260 ms) · menu dicht ≤ 0,5 s · decode ≤ 600 ms · hover ≤ 320 ms.

---

## 6. Specs per onderdeel

Notatie: **begin → eind** · eigenschappen · duur · easing · delay/stagger.

### 6.1 Loader "Afstemmen"
*Inspiratie: [V1] ruis in tegels en storingsbanden · [W1] één keer per sessie, teller · [N1] beeld "opent" als een zoeker.*
*Vertaling: echte tv-sneeuw in plaats van tegels, geen nep-haperende teller maar een teller op echte gereedheid, en de ruis wordt letterlijk een lijn.*

| | Desktop | Mobiel |
|---|---|---|
| **Trigger** | Eerste paginalading in de sessie (`sessionStorage["sl-intro-seen"]` ontbreekt), JS aan, geen reduced motion. Nooit in het portaal. Geldt voor elke publieke landingsroute. | idem |
| **Opbouw** | Twee panelen `--bg-inset` (elk 50,5% hoog), daarop een groep "signaal": ruiscanvas (1/3 resolutie, 22 fps, grijswaarden `#090909`–`#393939`), scanlines (AFW-2, 0.08), tracking-band (14vh, `rgba(237,229,212,.035)`). Readout linksonder: label "SIGNAAL ZOEKEN" / "SEARCHING SIGNAL" (mono 11 px, 0.22em, `--text-muted`) + teller `000` (`--text-primary`, tabulair). Hint rechtsonder: "Klik of druk op een toets om over te slaan" (`--text-faint`). | Ruis op ¼ resolutie. Readout op 20 px van de rand. Geen hint. |
| **Sequentie** | Zie §5.1. Samenklappen: `.loader__signal` `transform: scaleY(1) → scaleY(0.004)` rond het midden, 240 ms `--ease-cut`. Lijn (`2px`, `--text-primary`, volle breedte, verticaal gecentreerd) opacity 0 → 1 in 60 ms op +180 ms. Openen: panelen `translateY(0) → ∓100%`, 500 ms `--ease-band`; lijn opacity 1 → 0, 200 ms, +120 ms. Daarna wordt de loader uit de DOM verwijderd. | Teller 700–1000 ms; verder gelijk. |
| **Interactie** | Klik/tik op de overlay of een toets = overslaan (zie §5.1). Het `.loader`-element is `aria-hidden`; schermlezers lezen de pagina eronder gewoon. | Tik = overslaan. |
| **Robuustheid** | Het hero-wordmark wordt **nooit** verborgen: de loader ligt erbovenop, dus LCP wordt niet vertraagd. CSS-failsafe: de loader verdwijnt na 3 s ook zonder JS-initialisatie. Head-failsafe: na 2,5 s zonder `motion-ready` gaan `.motion` en `.sl-intro` eraf. | idem |
| **Reduced motion** | Geen loader. | Geen loader. |

### 6.2 Page transitions "Kanaalwissel" (incl. NL/EN en portaal)
*Inspiratie: [N10] overlay over een echte paginalading, bfcache-fix · [W8] View Transitions, korte uit/in · [V9] doek dicht, doek open, maar in ±1,1 s in plaats van 2,3 s.*

**Variant `band` — publieke routes** (`/`, `/en`, `/shows`, `/band` en hun `/en/…`-varianten)

| | Desktop | Mobiel |
|---|---|---|
| **Trigger** | Klik op een interne link naar een andere route. Niet bij ankers op dezelfde pagina, `mailto:`, externe links, `target=_blank`, of klikken met modifier-toetsen. Ook bij terug/vooruit. | idem |
| **Uit (oude pagina)** | 5 horizontale banden (elk 20% hoog, `--bg-inset`, scanlines AFW-2). Oneven banden van `translateX(-101%)`, even van `translateX(101%)` naar `0`. 360 ms `--ease-band`, stagger 40 ms. Op +220 ms verschijnt midden in beeld een label "CH 02 · SHOWS" (mono 12 px, 0.28em, teal) dat in 300 ms decodeert. | 4 banden (25% hoog). |
| **Wissel** | Content vervangen terwijl alles bedekt is. Scroll naar boven (of **terug naar de bewaarde positie** bij terug/vooruit). `document.title` bijwerken. Focus naar de `<h1>` van de nieuwe pagina (`tabindex="-1"`, `preventScroll`). | idem |
| **In (nieuwe pagina)** | Banden lopen **door in dezelfde richting** (oneven → `101%`, even → `-101%`), 420 ms `--ease-band`, stagger 40 ms. Label weg. Tegelijk start de pagina-intro (home: hero "short"; andere pagina's: gewone scroll-entrees). | idem |
| **Techniek** | Voorkeur: View Transitions API (same-document bij client-routing, cross-document `@view-transition` bij MPA), met de banden als eigen overlay-element. Fallback: klik onderscheppen → uit-animatie → navigeren → op de nieuwe pagina de overlay gesloten laten starten (klasse vóór eerste paint) en openen. Zonder JS: gewone navigatie. | idem |

**Variant `lang` — NL ↔ EN (zelfde pagina)**
Geen banden. Scrollpositie blijft. Alle `[data-decode]` in (of net onder) beeld decoderen naar de nieuwe taal in 360 ms; koppen, alinea's, knoplabels en navigatie vervagen van 0.15 naar 1 in 240 ms `--ease-signal`. Focus blijft op de taalschakelaar. `<html lang>` wisselt. Reduced motion: direct wisselen, geen fade.

**Variant `calm` — portaal** (naar, van en binnen `/portaal`)
Dezelfde banden, maar alleen opacity: 0 → 1 in 200 ms linear, daarna 1 → 0 in 240 ms. Geen verschuiving, geen scanlines, geen label, geen ruis. Voor trage acties (inloggen, laden van data): **voortgangslijn** van 2 px teal bovenaan (`scaleX 0 → 0.85 → 1` en uitfaden, `--ease-line`).

**Desktop en mobiel:** `lang` en `calm` zijn gelijk op alle breedtes; `band` gebruikt op mobiel 4 banden.
**Reduced motion (alle varianten):** crossfade van 120 ms via de banden, zonder beweging; taalwissel direct.

### 6.3 Hero: intro en scrollgedrag
*Inspiratie: [W2] ritme kop → sub → knoppen · [V3] logo dockt in de header · [N2] hero-parallax · [W6]/[N4] decode.*

| Element | Intro "full" (na loader) | Intro "short" (herhaalbezoek / aankomst) |
|---|---|---|
| Ruissluier `.hero__veil` (grain + scanlines, `mix-blend-mode: screen`) | opacity 0.55 → 0, 800 ms `--ease-signal`, t = 0 | 0.40 → 0, 600 ms, t = 0 |
| Wordmark | **Altijd zichtbaar**, alleen de sluier gaat eraf | idem |
| Kicker (`data-decode`) | decode 600 ms, t = 140 ms | 480 ms, t = 60 ms |
| Subkop (`rise`) | opacity 0 → 1, `translateY(12px) → 0`, 640 ms `--ease-signal`, t = 220 ms | t = 120 ms |
| Knoppen | `clip-path: inset(0 100% 0 0) → inset(0)` (vulling/rand wipet van links in), 640 ms `--ease-signal`, t = 280 ms + 60 ms per knop | t = 180 ms + 60 ms |
| Header | schuift binnen (`translateY(-100%) → 0`), 320 ms `--ease-signal`, t = 0 | staat er al |

**Scroll (gescrubd, `--ease-drift`)**, p = scrollY / hero-hoogte (0 → 1):
- achtergrond: `translateY(0 → 18% van de hero-hoogte)` (loopt achter, geeft diepte);
- wordmark: `translateY(0 → 10% van de hero-hoogte)` en opacity 1 → 0.35;
- levende korrel blijft doorlopen (8 sprongen per seconde).

**Docking (alleen homepage):** het vlakke header-wordmark is verborgen (`clip-path: inset(0 0 100% 0)`) zolang het hero-wordmark in beeld is. Zodra de onderkant van het hero-wordmark onder de header verdwijnt (≤ header-onderkant + 8 px), wordt het in 320 ms `--ease-band` van onder naar boven onthuld; omhoog scrollen draait dit om. Focus op de home-link toont het altijd. Op andere pagina's staat het er gewoon.

| | Desktop | Mobiel |
|---|---|---|
| Afwijkingen | — | Wordmark 100% breed; korte subkop; alleen de primaire knop (volle breedte). Parallaxwaarden gelijk. |
| Reduced motion | Alles direct zichtbaar; geen sluier, geen parallax, geen docking (header-wordmark altijd zichtbaar). | idem |

### 6.4 Volgende-show-balk
*Inspiratie: [V5] kleur als overgangsmiddel · [W6]/[N4] decode.*

| | Desktop | Mobiel |
|---|---|---|
| **Trigger** | IntersectionObserver (onderrand −10%), pas nadat de loader opent. | idem |
| **Entree** | De rode balk wipet van links naar rechts in: een afdekvlak (`--bg-base`) `scaleX(1) → 0` met `transform-origin: right`, 640 ms `--ease-band`. | idem |
| **Daarna** | Op +260 ms decoderen: label "Volgende show" (520 ms), dag `10.11` (alleen cijfers 0–9, punten blijven staan, 500 ms), meta `2026 · 20:30` (520 ms), onderling +60 ms. | Dag `10.11.26`; meta verborgen. |
| **Tickets-knop** | Hover/focus: zwarte vulling (`#000`) wipet van links in, 320 ms `--ease-signal`; label kanaalverschuiving (AFW-1) 160 ms `--ease-glitch`, één keer. Cursorlabel "TICKETS ↗". | Volle breedte; drukfeedback `translateY(1px)`. |
| **Reduced motion** | Direct zichtbaar, geen wipe, geen decode. Hover = kleurfade van 160 ms. | idem |

### 6.5 Alle shows
*Inspiratie: [N6] rest dimt · [N5] cursorlabel · [W6] decode · concept C (lijn tekent zich).*

| | Desktop | Mobiel |
|---|---|---|
| **Kop** | `<h2>` schuift van onder een regelmasker omhoog (`translateY(105%) → 0`, 640 ms `--ease-signal`); de 2 px onderlijn tekent van links (`scaleX 0 → 1`, 800 ms `--ease-line`, +120 ms); aantal ("5 data") decodeert. | Kop 26 px; aantal verborgen. |
| **Rijen binnenkomen** | Per rij (stagger 70 ms): eerst de 1 px onderlijn (`scaleX 0 → 1`, 640 ms `--ease-line`), op +120 ms de inhoud (`translateY(12px) → 0`, opacity 0 → 1, 640 ms `--ease-signal`), op +180 ms decoderen stad en status (520 ms, onderling +60 ms). | Idem; 3 rijen + link "Volledige agenda →" naar `/shows`. |
| **Uitverkocht** | Een 2 px doorhaallijn (`--text-faint`) tekent over de zaalnaam, `scaleX 0 → 1`, 800 ms `--ease-line`, +360 ms. Blijft staan. | idem |
| **Hover/focus op klikbare rij** (`tickets`, `release`) | Vulling `--accent-quiet` wipet van links in (`scaleX 0 → 1`, 320 ms `--ease-signal`); zaalnaam schuift 8 px naar rechts; statustekst schuift 18 px naar links en maakt plaats voor `↗` (opacity + `translateX(-6px → 0)`, 160/320 ms); status scramblet kort (380 ms); **alle andere rijen dimmen naar 45%** (160 ms). Cursorlabel "TICKETS ↗". Focus-visible geeft hetzelfde plus de focusring. | Geen hover. Tik: vulling direct (80 ms) als drukfeedback. Geen verschuivingen. |
| **Niet-klikbaar** (`announced`, `soldout`) | **Geen enkele hover-respons**: geen vulling, geen pijl, geen dimmen, geen cursorlabel, standaardcursor. Zo is het verschil met klikbare rijen voelbaar zonder dat het afhangt van kleur alleen. `aria-disabled="true"` blijft. | idem |
| **Reduced motion** | Alles direct zichtbaar (doorhaallijn staat er al). Hover: vulling als fade van 160 ms, geen verschuivingen, geen pijl, geen scramble, geen cursorlabel. Dimmen van de rest blijft (dat is geen beweging). | idem |

### 6.6 Foto's (+ lightbox)
*Inspiratie: [V6] gedempt → kleur · [N1]/[N2]/[N6] zoekerhoeken · [V1] tegels, vertaald naar banden.*

| | Desktop | Mobiel |
|---|---|---|
| **Kop** | Zelfde regelmasker als "Alle shows". | idem |
| **Entree** | Per foto (stagger 90 ms, rasterorde): 5 horizontale banden in `--bg-surface` trekken zich terug (`scaleX 1 → 0`, oneven naar rechts, even naar links), 640 ms `--ease-band`, onderling 40 ms; foto `scale(1.08) → 1`, 640 ms `--ease-signal`; caption fadet in op +400 ms. | idem, raster 2 kolommen. |
| **Rusttoestand** | Gedempt: `filter: grayscale(.6) brightness(.72) contrast(1.05)`. | **Niet gedempt** (geen hover op touch → foto's staan in volle duotone). |
| **Hover/focus** | Filter → `none` (320 ms); vier zoekerhoeken (14 px, 2 px `--text-primary`) klikken in vanuit 8 px buiten de hoek (`translate` + opacity, 160/320 ms); caption scramblet (380 ms); cursorlabel "BEKIJK" / "VIEW". | — |
| **Lightbox** (native `<dialog>`) | Klik/Enter → de foto vliegt van zijn rasterpositie naar het midden: **uniforme** schaal + `translate` + `clip-path` die de rasteruitsnede loslaat, 560 ms `--ease-band` (nooit niet-uniform schalen). Scanlines flitsen 0 → 0.12 → 0 in 420 ms (AFW-2). Caption decodeert (420 ms, +260 ms). Sluiten (Esc, knop "Sluiten", klik op de achtergrond): omgekeerde vlucht, 380 ms `--ease-cut`; focus terug naar de foto. Scroll staat stil zolang hij open is. | Tik opent; knop "Sluiten" 44 × 44 px. |
| **Reduced motion** | Geen banden, geen schaal; foto's direct zichtbaar. Lightbox opent met een fade van 150 ms, zonder vlucht. Hoekjes verschijnen zonder beweging. | idem |

### 6.7 Header, navigatie en het mobiele menupaneel
*Inspiratie: [W9] menu groeit uit de header · [V10] paneel rolt uit, label wisselt · [N11] snelheid · [N4] scramble op links.*

**Header (desktop en mobiel)**
- `position: sticky`. Naar beneden scrollen (na 120 px): `translateY(0 → -100%)`, 320 ms `--ease-cut`. Omhoog scrollen: terug in 320 ms `--ease-signal`. Altijd zichtbaar bovenaan, als het menu open is en als de focus in de header staat.
- Navigatielinks: onderlijn 2 px `--accent-hover` tekent van links (`scaleX`, 320 ms `--ease-line`); tekst scramblet kort (380 ms, fijne pointer); kleur → `--accent-hover` (160 ms). De actieve pagina houdt de onderlijn.
- CTA "Boeken": vulling `--accent-hover` wipet in (320 ms), label met kanaalverschuiving (AFW-1, 160 ms).
- Taalwissel: zie §6.2 (variant `lang`). Op mobiel zijn NL/EN tikdoelen van 44 × 44 px.
- Docking van het wordmark: zie §6.3.
- Mobiel: zelfde verberg/toon-gedrag; nav en CTA zitten in het menupaneel; geen scramble (geen hover).
- Reduced motion: header blijft altijd staan (geen verbergen), onderlijnen verschijnen zonder te tekenen, geen scramble, geen kanaalverschuiving; CTA-hover is een kleurfade van 160 ms.

**Mobiel menupaneel (nieuw, ≤ 640 px)** — ontwerp

| Onderdeel | Spec |
|---|---|
| Plek | Vast over het volle scherm, **onder** de sticky header (header `z-index` 60, paneel 55), zodat de knop bereikbaar blijft. Padding `88px 20px 24px`. Scrollt zelfstandig (`overscroll-behavior: contain`). |
| Achtergrond | 4 horizontale banden in `--bg-inset`; korrel komt van de scanline-flits tijdens het openen. |
| Links | `<ol>` met Shows / Foto's / Band. Oswald 700, 44 px, hoofdletters, 0.02em, `--text-primary`; hover/focus `--accent-hover`. Per item een mono-index `01`–`03` (12 px, 0.18em, teal) links van het woord; hoogte ≥ 64 px; onderlijn 1 px `--border-default`. |
| Voet | Primaire knop "Boek ons" (volle breedte, ≥ 48 px) · taal NL / EN (mono 14 px, elk 44 × 44 px, actieve taal `--text-primary`, andere `--text-faint`) · `boeking@staticline.nl` (mono 12 px, teal). |
| Knop | Hamburger (44 × 44, 3 × 2 px lijnen, 6 px tussenruimte). **Openen**: de drie lijnen klappen samen tot **één lijn** (160 ms `--ease-cut`, static → line), daarna draaien twee lijnen naar × (320 ms `--ease-signal`, +160 ms). `aria-expanded`, `aria-controls="menu-panel"`, label "Menu openen" / "Menu sluiten". |
| **Open-animatie** | Banden `scaleX 0 → 1`, afwisselend vanaf links en rechts, 420 ms `--ease-band`, stagger 40 ms. Scanlines flitsen 0 → 0.12 → 0 in 520 ms. Items (links, knop, taal, mail): opacity 0 → 1 (320 ms) en `translateY(24px) → 0` (640 ms `--ease-signal`), vanaf 160 ms + 60 ms per item. Onderlijnen tekenen (640 ms `--ease-line`, 200 ms + 60 ms per item). Indexen decoderen (360 ms, 220 ms + 60 ms per item). Focus naar de eerste link na 260 ms. |
| **Dicht-animatie** | Items vervagen (160 ms), daarna banden `scaleX 1 → 0` in omgekeerde volgorde (320 ms `--ease-cut`, stagger 30 ms). Knop × → lijnen. Totaal ≤ 500 ms. |
| Gedrag | Sluit met de knop, Esc of een klik op een link (bij een link gaat de focus naar de bestemming, anders terug naar de knop). Tijdens open: `inert` op `main` en `footer`, scroll-lock (ook Lenis). Sluit automatisch als het venster breder wordt dan 640 px. |
| Reduced motion | Paneel verschijnt met een fade van 160 ms (banden tegelijk); items zonder verschuiving; geen decode, geen scanlines; hamburger wisselt direct. |
| Zonder JS | Paneel wordt niet gebruikt; de drie links staan in de header (12 px). |

### 6.8 Footer
*Eigen voorstel (geen referentie-element).*
- **Gordijn**: `main` (z-index 1, eigen achtergrond) schuift van de footer af; de footer staat `position: sticky; bottom: 0` eronder. Alleen CSS, geen JS.
- Links (mail, Bandportaal): onderlijn tekent (320 ms `--ease-line`); mailadres scramblet kort bij hover (380 ms).
- Mobiel: zelfde gordijn; links als tikdoelen van ≥ 44 px hoog.
- Reduced motion: footer gewoon statisch onder de pagina.

### 6.9 Globaal
| Onderwerp | Keuze | Details |
|---|---|---|
| **Smooth scroll** | **Ja, alleen desktop met fijne pointer** | Lenis, `lerp: 0.12`. Uit op touch en bij reduced motion. Ankers scrollen met een offset voor de header. Lenis stopt tijdens menu en lightbox. Na een route-wissel eerst `lenis.resize()`, anders klemt hij op de oude paginahoogte. |
| **Cursor** | **Geen algemene custom cursor. Wel een contextueel label**, alleen bij `(hover: hover) and (pointer: fine)` en nooit op touch | De systeemcursor blijft zichtbaar. Het label (mono 11 px, `--accent` met `--text-on-accent`, padding 6 × 8 px) volgt de muis met lerp 0.22 per frame (±0,35 s gevoel), 18 px rechtsonder de pointer, en klapt naar links aan de rechterrand. In: `clip-path` wipe 320 ms `--ease-signal`; tekst decodeert (360 ms). Teksten: "TICKETS ↗" (klikbare showrijen, tickets-knop), "BEKIJK" / "VIEW" (foto's). Het label is `aria-hidden`; de betekenis staat ook in de linktekst. Reduced motion: uit. |
| **Bewegende korrel** | **Ja** | `grain.png` op een pseudo-element van 200%, dat in 4 sprongen per 500 ms verspringt (`steps`, alleen `transform`, dus composited). Pauzeert buiten beeld (IntersectionObserver). Op hero (0.5) en foto's (0.35). Reduced motion: stilstaand. |
| **Knoppen** | Vulling-wipe + AFW-1 | `::before` met de hovervulling, `scaleX 0 → 1` vanaf links, 320 ms `--ease-signal`; label kanaalverschuiving 160 ms (één keer per hover/focus); indrukken `translateY(1px)` 80 ms. Ghost: randkleur → `--text-primary` (160 ms). Mobiel: geen hover, alleen de drukfeedback. Reduced motion: vulling als fade van 160 ms, geen kanaalverschuiving. |
| **Links** | Tekenende onderlijn | 1–2 px, `scaleX 0 → 1` vanaf links, 320 ms `--ease-line`; kleur 160 ms. Mobiel: geen hover. Reduced motion: onderlijn verschijnt direct. |
| **Focus** | Nooit geanimeerd | 2 px teal, offset 2 px, direct zichtbaar. Focus-visible triggert dezelfde toestand als hover. |

---

## 7. Reduced motion per effect

| Effect | Valt weg | Wordt |
|---|---|---|
| Loader | alles | geen loader |
| Hero-intro, sluier, parallax, docking | alles | direct zichtbaar, header-wordmark altijd zichtbaar |
| Decode / scramble | alles | echte tekst direct |
| Kanaalverschuiving (AFW-1) | alles | — |
| Scanlines (AFW-2) | alles | — |
| Scroll-entrees (rise, wipe, mask, lijnen, banden) | beweging | direct zichtbaar |
| Hover-wipes (knoppen, showrij) | `scaleX`-beweging | kleurfade 160 ms |
| Showrij-verschuivingen en pijl | alles | alleen vulling (fade) + dimmen van de rest |
| Foto-hover | beweging van hoekjes | filter-fade 160 ms, hoekjes zonder beweging |
| Lightbox | vlucht, scanlines | fade 150 ms |
| Page transitions | banden-beweging, label | crossfade 120 ms |
| Taalwissel | decode, fade | directe wissel |
| Mobiel menu | banden, verschuivingen, decode | fade 160 ms |
| Header verbergen bij scroll | — | header blijft staan |
| Levende korrel | animatie | stilstaande korrel |
| Footer-gordijn | sticky | statische footer |
| Smooth scroll, cursorlabel | alles | native scroll, systeemcursor |

---

## 8. Toegankelijkheid en flitsveiligheid

- **Geen flitsen.** De ruis in de loader blijft tussen `#090909` en `#393939` (relatieve luminantie < 0,045): minder dan 4% verschil, dus geen "flash" in WCAG 2.3.1-zin. De levende korrel houdt een constante gemiddelde helderheid. Decode-tekens verversen met 20 fps op kleine tekstvlakken; de kanaalverschuiving speelt één keer per hover (2 frames). **Geen enkel effect herhaalt vaker dan 2× per seconde over een groot vlak.** De enige heldere gebeurtenis is de loaderlijn (2 px hoog, één keer).
- **Schermlezers.** Decode schrijft ruis in een `aria-hidden` overlay; de echte tekst blijft in de DOM. Loader, banden, cursorlabel en decoratieve lagen zijn `aria-hidden`. De loader blokkeert geen hulptechnologie.
- **Focus.** Na een page transition naar de `<h1>`; na het menu terug naar de knop; na de lightbox terug naar de foto. De focusring animeert nooit.
- **Zonder JavaScript.** Alle content staat in de eindtoestand; begin-toestanden gelden alleen onder `html.motion`.

## 9. Implementatienotities (valkuilen uit het prototype)

1. **Geen `clip-path` op een element dat je met IntersectionObserver observeert.** De observer rekent de clip-path van het target mee en gaat dan nooit af. Gebruik een afdekvlak (`::after`) of observeer een ouder.
2. **`.is-settled` na een entree.** Entree-transities hebben een `transition-delay` (stagger). Haal die weg na afloop, anders erven hover-transities de vertraging.
3. **Decode zonder layout shift.** Alleen mono-tekst en cijfers decoderen. De echte tekst krijgt `-webkit-text-fill-color: transparent`, de overlay staat er absoluut overheen.
4. **Hero-wordmark nooit op `opacity: 0` zetten** (ook niet voor een reveal): anders telt hij niet als LCP en schuift LCP naar achteren.
5. **Lenis na een route-wissel** eerst `resize()`, daarna pas scrollen of de scrollpositie herstellen.
6. **Easings uit de tokens.** Web Animations API accepteert `cubic-bezier()`-strings direct, dus lees de CSS-variabelen uit in plaats van waarden te dupliceren.

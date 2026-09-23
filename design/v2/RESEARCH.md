# Static Line v2 — onderzoek referentiesites, shortlist en conceptkeuze

Dit document hoort bij `design_handoff_static_line_v2/`. Het legt vast wat er op de drie referentiesites
**werkelijk is waargenomen** (deel 1–3), en daarna, strikt gescheiden, **wat wij daarvan maken** (deel 4–6).

---

## 0. Methode en beperkingen

| Onderdeel | Hoe gedaan | Beperking |
|---|---|---|
| Browser | De ingebouwde browser van de Claude-desktopapp (echte Chromium, geen web fetch). Elke site vers geladen met gewiste `sessionStorage` om een eerste bezoek na te bootsen. | Geen GIF-opname beschikbaar in deze browser; beweging is vastgelegd als **reeksen screenshots** (begin/midden/eind) met vaste wachttijden (0,3–1,5 s). |
| Desktop | Het browservenster is van zichzelf 803 × 1030 px. Een emulatie op 1440 × 900 is geprobeerd (WeEvolveIT), maar werd zo sterk verkleind weergegeven dat details onleesbaar waren. Desktopgedrag is daarom op **803 px** bekeken (alle drie de sites tonen daar hun desktoplayout, ≥ 768 px). | Layoutverschillen die alleen boven ±1200 px optreden, kunnen gemist zijn. |
| Mobiel | Emulatie **390 × 844** met touch-user-agent. Loader, scroll, menu. | Touch-scroll is als muiswiel gesimuleerd. |
| Timings en easings | Eerst **visueel** geschat uit de screenshotreeksen, daarna **afgelezen** uit de JS/CSS die de sites zelf in de browser laden (alleen gelezen voor analyse; er is niets overgenomen in het pakket). | Waar alleen geschat: aangegeven met "±". |
| Techniek | `window`-globals, geladen scripts, CSS-regels en bundels doorzocht op bibliotheeksignaturen. | Gebundelde bibliotheken (Next.js) zijn herkend aan code-signaturen, niet aan bestandsnamen. |
| `prefers-reduced-motion` | **Kon niet omgezet worden** in deze browser. Gecontroleerd via de CSS-mediaqueries en de JS-checks in de broncode. | Het daadwerkelijke reduced-motion-gedrag is niet visueel geverifieerd. |
| Performance | LCP gemeten met `PerformanceObserver` in het venster (desktop, niet koud gecachet) en subjectief vloeiend/haperend beoordeeld. | Geen labmeting; geen middenklasse-telefoon. |

Bezochte pagina's: weevolveit.com `/`, `/method`, `/case-studies` · voltlites.com `/`, `/projects/` · noartmusic.com `/`, `/events`.
Terugnavigatie is op alle drie getest.

---

## 1. WeEvolveIT — weevolveit.com

**Techniek (waargenomen):** Next.js (Turbopack-build) · GSAP met ScrollTrigger en SplitText (gebundeld, via `useGSAP`) ·
Lenis (`html.lenis`) · Three.js (particle-globe en sterrenveld op canvas) · View Transitions API voor page transitions
(`::view-transition-old/new(.page-cross)`). Gedecodeerde JS ±2,3 MB, waarvan het grootste stuk Three.js.
Eigen easings in CSS: `--ease-out: cubic-bezier(.16,1,.3,1)`, `--ease-exit: cubic-bezier(.55,.055,.675,.19)`,
`--ease-in-out: cubic-bezier(.77,0,.175,1)`.

| # | Element | Type | Wat je ziet (concreet) | Vermoedelijke techniek | Timing & easing | Waarom het werkt | Past bij Static Line? | Risico's |
|---|---|---|---|---|---|---|---|---|
| W1 | Intro-loader met teller en fasen | loader | Zwart scherm, grote teller `000%` in de displayfont (tabulaire cijfers). Daaronder vijf labels (DISCOVER … EVOLVE) met stipjes die één voor één oplichten; het laatste stipje in accentroze met gloed. Waargenomen: 000 → 030% (±0,5 s) → 090% (±1,3 s) → 100% → overlay fadet weg (±2,9 s totaal). | GSAP-tween op een getal + React-state; overlay `autoAlpha`. | Teller naar 92% in 2,1 s `power2.inOut`, fasen elke 0,42 s; na `load` naar 100% in 0,35 s `power2.out`, 0,5 s stilstand, overlay weg in 0,6 s `expo.inOut`. Harde cap 4,5 s. | Het wachten vertelt het merkverhaal (de vijf fasen). Wordt maar **één keer per sessie** getoond (`sessionStorage`), **niet op mobiel** (< 768 px) en niet bij reduced motion. | **4** — teller + oplichtende stappen = "signaal wordt gevonden". De teller zelf is generiek. | Blokkeert ±3 s de content bij eerste bezoek. |
| W2 | Hero: woorden ontwazen | tekst | Na de loader verschijnen de woorden van de kop één voor één van wazig naar scherp; subkop volgt, daarna cijfers en carrousel die 24 px omhoog schuiven. | SplitText (woorden) + `filter: blur(10px)` → `0`, opacity. | Per woord 1,2 s, stagger totaal 1,2 s, start 0,6 s; subkop op 1,4 s; stats op 2,0 s (`y:24→0`, 1,2 s `expo.out`); carrousel op 2,6 s. **Uit op mobiel.** | Rustige, gecontroleerde opbouw na de loader. | **3** — het ritme (kop → sub → knoppen) is bruikbaar; blur is te zacht voor een rauw merk. | `filter: blur` op grote tekst is duur; daarom op mobiel uit. |
| W3 | Particle-globe + sterrenveld | WebGL | Draaiende wereldbol van witte puntjes boven de kop; over de hele pagina een vast canvas met twinkelende sterren. | Three.js `Points`; apart vast canvas op `z-index:-2`. | Continu. | Diepte en "tech"-sfeer. | **2** — een globe zegt niets over een band; de continue achtergrondruis is wél verwant aan grain. | ±700 kB extra JS, GPU-belasting. |
| W4 | Inktrand-sectieovergang | sectie-overgang (scroll) | Tussen een donkere en een witte sectie groeit een **grillige inkt-/verfrand** omhoog terwijl je scrollt; de rand is gerafeld met losse spetters. Ook op mobiel. | ScrollTrigger `scrub` op `scaleY` van een laag met een SVG-filter/masker als rand. | Van `top bottom` tot `top -25%`, gescrubd; eigen ease met een sprong in de eerste 2%. | Tastbaar, organisch; maakt de kleurwissel tot een gebeurtenis. | **5** — gescheurde, verweerde affiche-esthetiek sluit direct aan op het wordmark (scheuren, rode spatten). | SVG-filters kunnen zwaar zijn op mobiel; statische fallback nodig. |
| W5 | Gepinde horizontale methode-rail | scroll | Sectie "The 5 method" blijft staan; koppen Discover → Evolve schuiven horizontaal binnen, met enorme spooknummers (01–04) erachter. De achtergrond verkleurt per fase van wit naar lichtgrijs, middengrijs en donker. Rechts een voortgangsbolletje. | ScrollTrigger `pin` + horizontale tween, gescrubd. | Gescrubd over ±5 schermhoogtes. | Maakt een abstract proces fysiek; de kleurprogressie geeft voortgang. | **3** — voor vijf showrijen te zwaar; het principe "kleur verschuift per stap" is bruikbaar. | Voelt als scroll-kaping; lange scrollafstand; mobiel lastig. |
| W6 | Scramble-tekst | tekst | Labels als `[ THE FRAMEWORK ]` en reviewteksten verschijnen eerst als willekeurige tekens die daarna "vastklikken" tot de echte tekst. | Eigen `ScrambleText`-component met vertraging; de echte tekst staat in `aria-label`. | ±0,6–1 s per label. | Leest als een signaal dat gedecodeerd wordt; trekt het oog naar kleine labels. | **5** — letterlijk "static": ruis wordt tekst. | Schermlezers (hier goed opgelost met `aria-label`); breedte verspringt tenzij monospace. |
| W7 | Scheve marquee-band | tekst / beeld | Een licht gekantelde band (±−3°) met doorlopende tekst in mono-hoofdletters; één woord in accentkleur. Met de muis sleepbaar; na loslaten komt de snelheid geleidelijk terug. | GSAP-timeline in een lus; pointer-drag met inertie; `timeScale` terug naar 1. | Continu; terugveren met exponentiële demping. | Energie en "tape"-gevoel tussen secties. | **4** — als "afzetlint" met showinfo. | Continue beweging leidt af; moet stoppen bij reduced motion. |
| W8 | Page transition via View Transitions | page transition | Klik op "Method": de oude pagina zakt kort weg en vervaagt, de nieuwe komt 16 px van onder in beeld; de kop speelt daarna weer de ontwaas-reveal. Het onderstreepje in de nav schuift naar het actieve item. **Terug**: ±0,3–0,5 s een lege pagina, daarna speelt de kop-reveal opnieuw. | `document.startViewTransition` (via React/Next) + CSS-animaties op `::view-transition-old/new`. | Uit: 0,3 s `cubic-bezier(.55,.055,.675,.19)`, opacity → 0, `translateY(-12px)`. In: 0,45 s `cubic-bezier(.16,1,.3,1)`, van opacity 0 en `translateY(16px)`. Reduced motion: animatie uit. | Goedkoop, native, server-rendering blijft intact. | **4** — past bij SSR/Next. Zonder eigen karakter; dat karakter moet uit de sluier komen. | Niet elke browser ondersteunt het; valt dan terug op een gewone navigatie. |
| W9 | Zwevende pil-header + menu's | hover / menu | Desktop: afgeronde, glazige header; hover op "Case studies" opent een donker megapaneel. Mobiel: de pil **groeit naar beneden uit tot een paneel** met alle links; hamburger morpht via een pijlvorm naar ×. | CSS-transities op hoogte/opacity. | ±0,3–0,4 s. | Het menu ontstaat uit de header zelf: geen los element. | **3** — het principe "header groeit uit tot paneel" is bruikbaar; ronde glazen pil past niet (radius 0). | Hoogte animeren kan layout veroorzaken. |
| W10 | Knoppen en links | hover | Knoppen: een vulling schuift erin, tekstkleur keert om; bij indrukken `scale(.98)`. Links met een doorlopend onderstreepje en een wisselende pijl. | CSS-transities (`link-sweep`, `arrow-swap`). | ±0,2–0,3 s. | Direct voelbaar, zonder veel beweging. | **3** — de vul-wipe past; de klik-scale is subtiel genoeg. | Geen. |
| W11 | Scroll-uitlezing | scroll | Vaste verticale lijn rechts met een getal dat meeloopt met de scroll, in `mix-blend-mode: difference` zodat hij op licht en donker leesbaar blijft. | Vast element + `mix-blend-difference`. | Live. | Een "meter" die voortgang geeft. | **3** — als signaalmeter denkbaar, voor een korte homepage niet nodig. | Geen. |
| W12 | Reduced motion | toegankelijkheid | In CSS: een globale regel die alle animaties/transities naar 0,01 ms zet, met uitzonderingen voor kleurtransities op links en knoppen (0,12 s); de intro en de hero-reveal worden in JS overgeslagen. | Mediaquery + JS-check. | — | Goed voorbeeld van volledige ondersteuning. | **5** als werkwijze. | — |

**Performance (waargenomen):** vloeiend in het venster, geen haperingen gezien. LCP 2,0 s bij een tweede bezoek in dezelfde sessie (intro overgeslagen).
Geen custom cursor gevonden (gecontroleerd op vaste elementen die met de muis meebewegen).

---

## 2. Volt — voltlites.com

**Techniek (waargenomen):** WordPress-thema · **Barba.js 2.10** (page transitions) · GSAP 3.13 met ScrollTrigger, SplitText,
CustomEase, Flip en Observer · Lenis 1.3.1 · Three.js r150 (vast canvas over het volle scherm) · een 2D-canvas voor een logo-effect
(verborgen op touch) · jQuery, Flickity (sliders), GLightbox (lightbox) · Tweakpane (een debug-UI-bibliotheek, ook in productie geladen) ·
zes autoplay-video's (mp4, `preload="metadata"`). Eigen easings: `main` `0.65,0.01,0.05,0.99`, `elastic` `.2,1.33,.25,1`, `verticalEase` `0.4,0,0.2,1`.

| # | Element | Type | Wat je ziet (concreet) | Vermoedelijke techniek | Timing & easing | Waarom het werkt | Past bij Static Line? | Risico's |
|---|---|---|---|---|---|---|---|---|
| V1 | Pixeltegel-loader | loader | Het scherm staat vol vierkante tegels (11 per korte zijde op desktop, 7 op mobiel). Een wit "voortgangstegeltje" met een percentage springt van tegel naar tegel; achtergelaten tegels worden limegroen, de rest kleurt willekeurig mee, zodat een **lime/wit pixelruispatroon** ontstaat. De teller hapert bewust (30 → 32 → 60 → 62 → 85 → 86 → 100%). Het laatste tegeltje wordt het beeldmerk; daarna klappen alle tegels in willekeurige volgorde verticaal dicht, wat leest als **horizontale storingsbanden** (goed zichtbaar op mobiel). | DOM-grid van tegels + GSAP met `stagger: {from: "random"}`; tegels `scaleY → 0`. | Totaal **4,8 s**. Sprong per tegel 0,6 s `expo.out`; dichtklappen 0,3 s `power2.out` op 4,3 s; loader weg op 4,8 s; content-intro start op 3,8 s. Speelt **bij elke volledige paginalading** (geen sessievlag); interne navigatie via Barba slaat hem over. Tegelgrid overgeslagen bij reduced motion. | Pixelruis in merkkleur, voelt als een signaal dat binnenkomt; de haperende teller oogt "echt". | **5** voor het principe (ruisblokken = tv-sneeuw, storingsbanden). Te lang. | LCP gemeten **6,6 s** (kop in de hero): de loader vertraagt LCP sterk. Op mobiel kon ik onder de loader al scrollen terwijl de tegels dichtklapten. |
| V2 | Hero-video met logo en cursormasker | beeld / cursor | Video over het volle scherm, groot limegroen "VOLT"-logo linksonder, tagline "Lighting the future of entertainment" waarin het eerste woord grijs is. Rond de cursor wordt het logo een **venster op de video** (het masker volgt de muis met vertraging). In de code tekent een 2D-canvas het logo met RGB-kanaalverschuiving; dat heb ik visueel niet eenduidig gezien. | CSS-variabelen `--mask-px-x/y/size` via `requestAnimationFrame` met lerp; 2D-canvas; uit op touch en bij reduced motion. | Lerp per frame. | Het logo reageert op de bezoeker. | **4** — "venster op het signaal" is sterk. Voor ons alleen als masker/onthulling, nooit als vervorming van het wordmark. | Canvaswerk per mousemove; moet uit op touch. |
| V3 | Hero krimpt tot mozaïek, logo "dockt" in de header | scroll | Bij scrollen krimpt de hero-video tot één tegel in een raster van andere video's en foto's; het grote logo schuift tegelijk omhoog, wordt kleiner en **eindigt als logo in de header**. | ScrollTrigger `scrub` + Flip/transform. | Gescrubd over ±1,5 schermhoogte. | Sterke continuïteit: het merk verdwijnt niet, het verhuist. | **5** — hero-wordmark → header-wordmark als doorlopende beweging. | Breedte/hoogte animeren veroorzaakt layout; alleen `transform` gebruiken. |
| V4 | Woorden kleuren in bij scroll | tekst | Introtekst ("Volt is a Burbank-based…") staat eerst grijs en kleurt woord voor woord wit mee met de scroll. | SplitText + ScrollTrigger `scrub` op kleur. | Gescrubd. | Leesvoortgang wordt zichtbaar. | **3**. | Weinig. |
| V5 | Kleurvlak → beeld-overgang | sectie-overgang | Diensten als raster van gekleurde vlakken (lime → donkergroen, genummerd 01–05). Daarna een volledig limegroen scherm dat overgaat in een foto met een lime kleurzweem die geleidelijk donkerder wordt; aan de bovenrand van het limevlak kort horizontale lijnen. | Gescrubde overlay-opacity; duotone via kleurlaag. | Gescrubd. | Kleur als overgangsmiddel; merkkleur domineert. | **4** — sluit aan op onze duotone-fotografie (rood/teal). | Weinig. |
| V6 | Projectkaarten grijs → kleur | hover / beeld | Op de projectenpagina zijn alle foto's grijs; hover zet de foto in kleur. Op de homepage schuiven kaarten over een vaste, steeds donkerder wordende achtergrondfoto. | CSS `filter: grayscale()`-transitie; gepinde achtergrond. | ±0,4 s. | Rust in het raster, beloning bij hover. | **4** — foto's gedempt, duotone bij hover. | Geen. |
| V7 | Knop met pixelstof | hover | Hover op "View all projects": kleine vierkantjes spatten over de knop; het pijltje verandert van ⌝ naar ›. | Canvas/DOM-deeltjes. | ±0,5 s. | Micro-beloning die bij het pixelthema hoort. | **4** — pixelstof = ruis; moet subtiel blijven. | Mag niet flitsen. |
| V8 | Volg-cursor | cursor | Een `.cursor`-element volgt de muis met vertraging; verborgen op touch. | `gsap.quickTo` op x/y. | 0,4 s `power3`. | Zachtheid en "gewicht". | **3**. | Moet uit op touch; nooit de systeemcursor verbergen zonder vervanging. |
| V9 | Page transition met panelen | page transition | Klik op "Projects": een donker paneel groeit vanuit het midden-onder (half zo breed, geen hoogte) uit tot het hele scherm; ±0,8 s volledig donker; daarna trekt een tweede paneel zich naar boven terug en onthult de nieuwe pagina. **Terug**: dezelfde overgang; je komt bovenaan de pagina uit (scrollpositie niet hersteld). | Barba.js `leave`/`enter` + GSAP op drie overlay-lagen. | Leave: 0,8 s `power4.inOut` (`scaleX .5→1`, `scaleY 0→1`) + tweede laag naar opacity .8 in 1 s. Enter: `scaleY 1→0` in **1,5 s `expo.inOut`**. Totaal ±2,3 s. | Theatraal "doek dicht, doek open". | **4** voor het principe; te lang. | 2,3 s per navigatie; scrollpositie terug gaat verloren. |
| V10 | Menu | menu | Desktop: een limegroen paneel valt onder de header open met kolommen; "MENU +" wordt "CLOSE ×", met pixelstof. Mobiel: een donker paneel rolt van boven naar beneden uit; het label rolt letter voor letter om. | Clip/scale-animatie van boven. | ±0,4–0,5 s. | Menu voelt als onderdeel van de header. | **4**. | Weinig. |
| V11 | Reduced motion | toegankelijkheid | 17 checks in de JS (tegelgrid en cursorcanvas uit). CSS niet volledig bekeken. | — | — | Deels ondersteund. | — | Loader blijft 4,8 s staan. |

**Performance (waargenomen):** zware video's en een lange loader; scrollen voelde vloeiend. LCP 6,6 s.

---

## 3. No Art — noartmusic.com

**Techniek (waargenomen):** Webflow · GSAP 3.15 met ScrollTrigger, SplitText, **ScrambleTextPlugin**, Flip, CustomEase, Observer,
Draggable en Inertia · Lenis 1.3.21 · Three.js r128 (kleine globe, 347 px) · hls.js (videostream) · Swiper 12 · Finsweet Attributes.
Eigen code via Slater. **Geen SPA**: elke klik is een volledige paginalading met een overlay ervoor en erna.

| # | Element | Type | Wat je ziet (concreet) | Vermoedelijke techniek | Timing & easing | Waarom het werkt | Past bij Static Line? | Risico's |
|---|---|---|---|---|---|---|---|---|
| N1 | Zoekerloader | loader | Zwart scherm met klein mono-label "■ BROADEN YOUR MIND". Dan wit, met in het midden een **klein vierkantje met zoekerhoekjes** (⌐ ¬). Het vierkantje groeit, toont video, wordt een liggend kader met het logo erop en groeit daarna door tot het volle scherm; daarna schuiven de heroteksten en de navigatie binnen. | GSAP-timeline op breedte/hoogte van een videocontainer + teller/balk. | Teller 0→100% in 2,1 s `power2.inOut`; kader 0 → 4rem (0,6 s `power4.out`) → 45vw × 25vw (mobiel 65vw) (0,8 s `power4.inOut`) → 100vw × 100vh (0,8 s `power4.inOut`); tekst en nav 1 s `power4.out`, +0,5 s. Totaal ±4 s. **Eén keer per sessie** (`sessionStorage`). **Geen** reduced-motion-afhandeling. | Filmisch: het beeld "gaat open" als een zoeker of monitor. | **5** voor het principe "kader opent tot volledig beeld". | LCP gemeten **4,0 s**. Animeert `width/height` (layout). Op mobiel niet opnieuw waargenomen: de loader leek direct voorbij. |
| N2 | Hero met zoekerhoeken | beeld | Videoachtergrond over het volle scherm; handgeschreven logo met **hoekmarkeringen** eromheen; de video schuift gescrubd iets omlaag bij scrollen. | CSS-hoekjes + ScrollTrigger `scrub` (`bottom: -20%`). | Gescrubd. | Technisch kader rond iets rauws. | **4** — hoekmarkeringen passen bij radius 0 en lijnen. | Weinig. |
| N3 | Uitvullende tekst-reveal | tekst | Koppen en alinea's springen bij binnenkomst van een rafelige zetting naar een **volledig uitgevulde** zetting; de woorden schuiven naar hun plek. | SplitText (woorden) + Flip, `ScrollTrigger` `once`. | 1 s `expo.out`, stagger 0,3 s, start `top 85%`. | Ongewoon en typografisch. | **2** — past niet bij Oswald-hoofdletters. | Layout-shift tijdens de animatie. |
| N4 | Scramble bij hover | hover / tekst | Navigatie- en kaartteksten "ruisen" bij hover: tekens worden willekeurige letters, cijfers en #$%&@; een deel licht **rood** op; na ±0,5 s staat de echte tekst er weer. | Eigen scramble op `mouseenter`. | 0,65 s `power1.out`; elke 0,06 s nieuwe tekens; ±60% van de tekens; 15% rood (#ff2b29); stopt op 75%. | Ruis als interactie, met accentkleur. | **5** — letterlijk statische ruis, in rood en teal te vertalen. | Schermlezers moeten de echte tekst krijgen. |
| N5 | Cursorlabel | cursor | Over eventkaarten verandert de cursor in een **rood label** "INFO & TICKETS ↳" dat zichzelf in-scramblet. | Vast element, `gsap.quickTo`; label-scramble; alleen bij `(hover: hover) and (pointer: fine)`. | 0,4 s `power3.out`; label 0,65 s. | Zegt wat een klik doet, op de plek waar je kijkt. | **5** — voor showrijen: "TICKETS ↗". | Label mag niet de enige aanwijzing zijn (toetsenbord, touch). |
| N6 | Kaarthover: rest dimt | hover | De gehoverde kaart krijgt hoekmarkeringen; alle andere kaarten dimmen naar ±30% dekking; titel en datum scramblen. | CSS-opacity op broertjes + scramble. | ±0,3 s. | Focus zonder beweging van de layout. | **4** — voor de showlijst. | Laag contrast bij de gedimde rijen, alleen tijdelijk. |
| N7 | Swipers met index | beeld | Horizontale kaartrijen met `[01]`-nummers en een streepjesindicator onder de rij. | Swiper 12. | Swipe. | — | **2**. | — |
| N8 | Gesynchroniseerde lijst | scroll | Op /events: tijdens het scrollen door een verticale beeldstapel licht in een zijlijst het actieve event op ("[2] NO ART LISBON"); de rest staat gedimd; de actieve afbeelding krijgt hoekmarkeringen. | ScrollTrigger per item → actieve klasse. | Live. | Oriëntatie in een lange lijst. | **3** — voor 5 shows niet nodig; het "actief item licht op" wel. | Weinig. |
| N9 | Globe met lokale tijd | WebGL | Kleine 3D-globe met eventmarkeringen, plus live tijd, tijdzone en coördinaten. | Three.js r128. | Continu. | Wereldwijd gevoel. | **1**. | Extra JS. |
| N10 | Overlay-transition over een echte paginalading | page transition | Klik: een zwart paneel met "■ BROADEN YOUR MIND" schuift van onder omhoog over het scherm; daarna laadt de nieuwe pagina, die eerst bedekt is en na een korte pauze het paneel omhoog wegschuift. **Terug**: het paneel speelt opnieuw weg; scrollpositie blijft behouden (bfcache). Loader speelt niet opnieuw. | Vanilla JS + GSAP: klik onderscheppen → animatie → `location.href`; `pageshow` voor bfcache. | Uit: `y 100%→0`, 0,6 s `power3.inOut`. In: 0,5 s pauze, dan `y 0→−100%`, 0,8 s `power3.inOut`. Totaal ±1,9 s + laadtijd. | Werkt met gewone, server-gerenderde pagina's. | **5** voor het principe (SSR-veilig). | De vaste pauze van 0,5 s voelt als wachten. |
| N11 | Menu | menu | Wit kaartpaneel **ploft** in beeld (van 0 naar volledige grootte), met ingesprongen randen en een gedimde achtergrond; mono-hoofdletters met ■-bullets, socials onderaan. Op mobiel hetzelfde. | GSAP. | Wrapper opacity 0,1 s + paneel `scale 0→1` in **0,2 s `expo.out`**. | Kort en direct. | **3** — de snelheid is goed; de scale-plof minder. | Weinig. |
| N12 | Reduced motion | toegankelijkheid | Alleen productkaart-transities worden uitgezet; loader, scramble en cursor niet. | — | — | — | Negatief voorbeeld. | Niet toegankelijk voor wie beweging uit heeft staan. |

**Performance (waargenomen):** vloeiend. LCP 4,0 s door de loader.

---

## 4. Shortlist — vertaald naar Static Line (eigen voorstel)

We nemen **patronen** over, geen code, assets of herkenbare signature-effecten. Elk element krijgt een eigen Static Line-vorm.

| # | Kandidaat | Bron | Vertaling naar Static Line |
|---|---|---|---|
| S1 | Loader: ruis die een signaal vindt, één keer per sessie | V1, W1, N1 | Beeldvullende tv-sneeuw (fijne korrel, laag contrast) met een mono-uitlezing die aftelt; de ruis klapt samen tot **één horizontale lijn** die zich verticaal opent tot de hero. Maximaal 2,2 s, overslaanbaar, niet op herhaalbezoek. |
| S2 | Decoderende tekst | W6, N4 | Mono-labels (kicker, statussen, datums, tellers) komen binnen als ruistekens en klikken vast; enkele tekens kort in oxiderood of teal. |
| S3 | Rafelige sectierand | W4 | Eén keer, tussen hero en volgende-show-balk: de rode balk komt binnen met een horizontale **scanline-wipe**. De inktrand zelf is te herkenbaar en krijgt geen 1-op-1-equivalent. |
| S4 | SSR-veilige page transition | N10, W8, V9 | "Kanaalwissel": horizontale banden sluiten over het scherm en openen weer (±0,7 s totaal); View Transitions waar mogelijk, anders klik-onderschepping zoals N10. |
| S5 | Wordmark dockt in de header | V3 | Het hero-wordmark schuift omhoog en vervaagt; op het moment dat het onder de header verdwijnt, verschijnt het vlakke wordmark in de header. Twee aparte assets, geen vervorming. |
| S6 | Zoekerhoeken als focuskader | N1, N2, N6 | Hoekmarkeringen (2 px, bone white) die rond een foto of rij "inklikken" bij hover/focus. |
| S7 | Cursorlabel | N5 | Alleen op fijne pointers, alleen boven showrijen en foto's: label "TICKETS ↗", "BEKIJK" enz., decodeert in. |
| S8 | Rest dimt bij hover | N6 | Showrijen: bij hover op een klikbare rij dimmen de andere rijen naar 45%. |
| S9 | Gedempt → duotone bij hover | V6, V5 | Foto's staan gedempt (donker en lage verzadiging); bij hover gaan ze naar volle duotone. |
| S10 | Scheve band | W7 | Een licht gekantelde teal band met de showdata als lopende tekst, boven de agenda. **Niet in de basis-scope**: voegt een element toe dat niet in de huidige informatiestructuur staat; zie open vraag. |
| S11 | Storings-micro-interactie | V7, V2 | Knop-hover: vulling wipet binnen + tekst krijgt 120 ms een kanaalverschuiving (teal/rood). Vereist afwijking AFW-1. |
| S12 | Menu groeit uit de header | W9, V10 | Mobiel paneel rolt vanuit de header naar beneden in horizontale banden; items decoderen binnen met een nummer in mono. |

---

## 5. Conceptrichtingen (eigen voorstel)

### A — "Ruis → Lijn" (aanbevolen)
De bandnaam als bewegingsregel: **alles begint als ruis (static) en wordt een scherpe lijn (line)**.
Beweging komt binnen als storing (korrel, scanlines, decoderende tekens) en eindigt altijd op een strakke horizontale
lijn of een rechte rand. De loader is letterlijk een tv die aangaat: sneeuw → één lijn → beeld.
Overgangen zijn **horizontale banden** (kanaalwissel), rijen en koppen worden eerst als lijn getekend en daarna gevuld.
**Shortlist:** S1, S2, S4, S5, S6, S7, S8, S9, S11, S12 (+ S3 als scanline-wipe).

### B — "Aanplakbiljet"
Het wordmark als uitgangspunt: een verweerde affiche. Secties worden "geplakt" in stroken, overgangen **scheuren** een laag weg,
datums worden als stempel neergezet, foto's als geplakte prints. Fysiek, papierachtig, met gerafelde maskers.
**Shortlist:** S3 (gerafelde rand), S5, S6, S9, S10.

### C — "Oscilloscoop"
Eén teal signaallijn als rode draad: de loader is een vlakke lijn die gaat pulseren en overgaat in het wordmark;
kaders, onderstrepingen en scheidingslijnen tekenen zichzelf; de lijn reageert op scrollsnelheid. Precies en technisch.
**Shortlist:** S2, S4 (als lijn-wipe), S5, S8, lijntekeningen op alle randen.

### Keuze en argumenten
**Aanbeveling: A — "Ruis → Lijn".**
1. **Komt uit de naam zelf.** A is de enige richting die beide helften gebruikt: *static* (ruis) en *line* (lijn). B leunt alleen op het wordmark, C alleen op "line".
2. **Bouwt voort op wat er al is.** Het merk heeft al grain; A laat die korrel leven in plaats van nieuwe texturen toe te voegen. B vraagt nieuwe gescheurde-randassets en maskers die snel kitscherig worden.
3. **Wordmark blijft intact.** A onthult het wordmark met maskers, banden en ruis erover, precies binnen de regel. B verleidt tot scheuren *door* het wordmark heen.
4. **Performance en toegankelijkheid.** Banden (`clip-path: inset`), lijnen (`scaleX`) en opacity zijn goedkoop op mobiel; ruis is een kleine canvas of een tilende PNG. C is even licht maar te koel voor een rauwe rockband; B is zwaarder (SVG-maskers).
5. **Schaalbaar naar het portaal.** "Een band sluit en opent" is in een rustige variant (één band, 250 ms, geen ruis) direct bruikbaar voor het portaal.

Wat A van de andere richtingen leent: van C de **lijn die eerst getekend wordt** (koppen, rijranden); van B alleen de **rauwe korrel** als textuur. Geen scheuren. De hoekmarkeringen (S6) komen uit het onderzoek (N1/N2) en passen in A als "zoeker die scherpstelt".

### Open punt voor de checkpoint
- **S10 (scheve band met showdata)** voegt een element toe dat niet in de huidige informatiestructuur staat. Voorstel: niet opnemen, tenzij jij het wilt.

---

## 6. Voorgestelde afwijkingen van visuele regels (expliciet, ter goedkeuring)

| Code | Afwijking | Regel die geraakt wordt | Motivatie | Voorstel |
|---|---|---|---|---|
| AFW-1 | **Kanaalverschuiving** op tekst: twee kopieën van de tekst in teal (#2AA5B5) en oxiderood (#B33A28), 2 px verschoven, 120–160 ms, alleen bij hover/decode. | "Geen schaduwen" (visueel lijkt het op een harde tekstschaduw). | Het meest herkenbare storingsbeeld; kort en klein. | Aan, alleen op knoppen en mono-labels, **nooit op het wordmark**. |
| AFW-2 | **Scanlines** als overlay: horizontale lijntjes van 1 px om de 3 px, 6–10% dekking, alleen tijdens loader en transitions. | "Geen gradients als decoratie" (technisch een herhalend patroon). | Draagt het "line"-deel van het concept tijdens overgangen. | Aan, alleen tijdelijk, nooit permanent op content. |
| AFW-3 | **Lichtlijn in de loader**: de horizontale lijn waarin de ruis samenklapt, in bone white met een zachte gloed (`box-shadow 0 0 24px rgba(237,229,212,.35)`), ±300 ms. | "Geen glow". | Het "tv gaat aan"-moment wordt fysiek geloofwaardig. | Optioneel; standaard **uit** (lijn zonder gloed werkt ook). |

## Bronnen
- https://weevolveit.com/ (+ /method, /case-studies)
- https://voltlites.com/ (+ /projects/)
- https://www.noartmusic.com/ (+ /events)
- Bestaande handoff: `design_handoff_static_line_homepage` (README, reference/, screens/)

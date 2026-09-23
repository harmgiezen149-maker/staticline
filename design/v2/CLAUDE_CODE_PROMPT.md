# Instructie voor Claude Code — Static Line v2 motion-redesign

Kopieer alles onder de streep naar Claude Code, in de root van de bestaande Static Line-website-repository,
met de map `design_handoff_static_line_v2/` in (of naast) de repo.

---

<rol>
Je bent een senior front-end developer. Je implementeert een motion-redesign in een bestaande, deels gebouwde website.
Je werkt precies, in kleine stappen, en controleert elke stap voordat je verdergaat.
</rol>

<context>
- De site is van de rockband Static Line (staticline.nl): een publiek deel (homepage met hero, volgende show, agenda,
  foto's en footer; NL/EN) en een afgesloten bandportaal (login) dat gekoppeld is aan de Band App van de band.
- De site is (deels) gebouwd op basis van de v1-handoff. Dit is een **restyle van bestaande code**, geen nieuwbouw.
- Het ontwerp staat in `design_handoff_static_line_v2/`:
  - `README.md`: volledige handoff (layout, tokens, assets, techniek, randvoorwaarden, wijzigingen t.o.v. v1)
  - `MOTION.md`: motion-principes, tokens, choreografie en specs per onderdeel, inclusief reduced motion
  - `reference/`: `tokens.css` (incl. motion tokens), `styles.css`, `index.html` (zonder JS)
  - `prototype/`: werkend HTML-prototype (`index.html`, `motion.js`); `demo.js` en `prototype.css` zijn alleen voor het prototype
  - `assets/`: geoptimaliseerde wordmarks, achtergrond, grain, scanlines, placeholders, fonts
  - `screens/`: v1-referentiebeelden en sleutelmomenten van v2
  - `RESEARCH.md`: achtergrond bij de keuzes (niet nodig om te bouwen)
- Het prototype is een **referentie voor gedrag en timing**. Kopieer het niet: het gebruikt hash-routes en één los
  JS-bestand, puur om het te kunnen tonen.
</context>

<opdracht>
Implementeer het v2-ontwerp in de bestaande codebase, volgens de bestaande patronen van die codebase.
</opdracht>

<werkwijze>
STAP 0: Analyseren en plan voorleggen (nog niets bouwen)
1. Lees `README.md` en `MOTION.md` volledig. Open `prototype/index.html` in een browser (of lees `motion.js`) om het gedrag te begrijpen.
2. Analyseer de codebase en rapporteer kort:
   - framework en versie, rendering (SSR/SSG/SPA), routing (hoe `/`, `/en`, `/shows`, `/band` en het portaal zijn opgezet);
   - styling-aanpak (CSS modules, Tailwind, CSS-in-JS…) en waar de v1-tokens staan;
   - componentstructuur (bijv. `SiteHeader`, `Hero`, `NextShow`, `ShowList`/`ShowRow`, `PhotoGrid`, `SiteFooter`) en in hoeverre die v1 volgen;
   - i18n-oplossing en waar de copy staat;
   - databron voor shows (dezelfde als de Band App?) en hoe het portaal/de login werkt;
   - bestaande animatie- of scroll-libraries en de build- en testcommando's.
3. Leg een **implementatieplan** voor met de stappen hieronder: per stap welke bestanden je aanraakt, welke keuzes je maakt
   (bijv. View Transitions API vs. router-hooks voor page transitions, wel/geen Lenis) en wat je verwacht dat kan breken.
   Noem afwijkingen tussen de huidige code en v1 die je tegenkomt.
4. **Wacht op akkoord** voordat je gaat bouwen.

STAP 1–7: bouwen in logische, los testbare stappen (één stap per commit)
1. **Tokens**: motion tokens uit `reference/tokens.css` toevoegen aan het bestaande token-/themasysteem, inclusief de
   reduced-motion-overrides. Fonts zelf hosten (`assets/fonts/`) als dat nog niet zo is. Geoptimaliseerde assets (webp) inzetten.
2. **Globale motion-laag**: inline head-script en state-klassen (`MOTION.md` §4); reveals via IntersectionObserver
   (`data-reveal`, stagger, `.is-settled`); decode-/scramble-utility met aria-hidden overlay; levende korrel; header
   verbergen/tonen; smooth scroll (alleen desktop met fijne pointer, uit bij reduced motion); cursorlabel. Maak hier
   herbruikbare hooks/componenten van in de stijl van de codebase.
3. **Loader** (`MOTION.md` §6.1): één keer per sessie, overslaanbaar, nooit in het portaal, en het hero-wordmark mag niet verborgen worden (LCP).
4. **Page transitions** (`MOTION.md` §6.2): variant `band` voor publieke routes, `lang` voor NL/EN, `calm` voor het portaal.
   Focus naar de `<h1>`, `document.title` bijwerken, scrollpositie herstellen bij terug/vooruit. Content blijft server-rendered.
5. **Secties**: hero (intro, parallax, docking), volgende-show-balk, shows (entree, hover, klikbaar vs. niet-klikbaar,
   doorhaallijn), foto's + lightbox, footer (gordijn). Volg `MOTION.md` §6.3–6.8 en de statische wijzigingen in `README.md`.
6. **Mobiel menupaneel** (`MOTION.md` §6.7): layout, open/dicht-animatie, `aria-expanded`, `inert`, scroll-lock, Esc, focusbeheer.
7. **Portaal**: alleen de lichte basis (tokens, focus, `calm`-transition, voortgangslijn). Verder niets aanpassen.
</werkwijze>

<randvoorwaarden>
- Breek niets wat werkt: NL/EN-routing en copy, de showdata (zelfde bron als de Band App), het portaal en de login,
  de koppeling met de Band App. Wijzig geen API's, database-schema's of auth-code.
- Het wordmark wordt **nooit** hertekend, herkleurd, geschaald buiten zijn formaat, gesplitst of vervormd. Het mag alleen
  als geheel bewegen (`translate`, `opacity`) en onthuld worden met maskers of met ruis/scanlines erover.
- Kleuren, typografie, radius 0 en dark-only blijven zoals in de tokens. Alleen de goedgekeurde afwijkingen AFW-1
  (kanaalverschuiving) en AFW-2 (tijdelijke scanlines) zijn toegestaan; AFW-3 niet.
- Animeer alleen `transform`, `opacity`, `clip-path` en `filter`. Geen `clip-path` op elementen die je met
  IntersectionObserver observeert (zie `MOTION.md` §9).
- Content moet leesbaar zijn zonder JavaScript; begin-toestanden van animaties gelden alleen onder `html.motion`.
- `prefers-reduced-motion` volledig ondersteunen (`MOTION.md` §7). Geen flitsen vaker dan 3× per seconde.
- Voeg geen zware libraries toe. Geen GSAP, Barba of WebGL, tenzij de codebase ze al gebruikt; bespreek dat dan eerst.
- Neem geen code of assets over van externe sites.
- Houd je aan de bestaande codeconventies (naamgeving, mappenstructuur, linting, TypeScript-types).
</randvoorwaarden>

<verificatie>
Controleer na **elke** stap en rapporteer kort:
1. **Build** en lint slagen; bestaande tests slagen.
2. **Visueel** op desktop (1440 × 900) en mobiel (390 × 844): vergelijk met `screens/` en het prototype. Controleer ook tablet (≈ 800px).
3. **Reduced motion** (browser-emulatie `prefers-reduced-motion: reduce`): niets blijft verborgen, geen loader, alleen korte fades.
4. **Zonder JavaScript**: alle content zichtbaar en bruikbaar.
5. **Toetsenbord**: focus zichtbaar en logisch, ook na page transitions, menu en lightbox.
6. **Performance** (Lighthouse, mobiel): LCP ≤ 2,5 s, CLS ≤ 0,05, TBT niet slechter dan vóór je wijziging. Test ook met 4× CPU-vertraging dat scrollen vloeiend blijft.
7. **Functioneel**: NL/EN wisselen op elke pagina, tickets-links, boekingslink, portaal-login en de Band App-koppeling werken nog.

Sluit af met een overzicht: wat is gebouwd, wat wijkt af van het ontwerp en waarom, en wat nog open staat
(bijvoorbeeld de echte fotografie en de `/band`-pagina).
</verificatie>

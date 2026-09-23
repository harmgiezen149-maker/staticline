/* =============================================================================
   Static Line — PROTOTYPE-ONLY: templates, NL/EN-copy, hash-router en de
   prototype-bediening (reduced-motion-schakelaar, loader opnieuw).
   In productie: routes /, /en, /shows, /band, /portaal via het framework (SSR),
   copy uit de i18n-resources van de codebase. Niet nabouwen.
   Dit bestand draait ook in Node (build-script) om de statische HTML te genereren.
   ============================================================================= */
(function (global) {
  "use strict";

  const COPY = {
    nl: {
      skip: "Naar de inhoud",
      navShows: "Shows", navPhotos: "Foto's", navBand: "Band", navBooking: "Boeken", navLabel: "Hoofdmenu",
      menuOpen: "Menu openen", menuClose: "Menu sluiten", menuLabel: "Menu",
      heroKicker: "Eerste show — 10 november 2026",
      heroSub: "Rauwe, opgefokte rock uit Nijmegen. Drie man, geen omweg. Losse snaren, kapotte versterkers en een set die niet stilstaat.",
      heroSubShort: "Rauwe rock uit Nijmegen. Drie man, geen omweg.",
      ctaBook: "Boek ons", ctaShows: "Alle shows",
      nextLabel: "Volgende show",
      nextSub: "Releaseshow met support. Deuren 20:00, wij om 21:15.",
      allShows: "Alle shows", count: "5 data", photos: "Foto's", tickets: "Tickets",
      moreShows: "Volledige agenda",
      footer: "Static Line · Nijmegen · Boekingen en technische rider op aanvraag",
      portal: "Bandportaal",
      soldout: "Uitverkocht", announced: "Aangekondigd", release: "Releaseshow",
      view: "Bekijk", enlarge: "Foto vergroten", close: "Sluiten",
      loaderLabel: "Signaal zoeken", loaderHint: "Klik of druk op een toets om over te slaan",
      chHome: "Home", chShows: "Shows", chBand: "Band",
      bandLead: "Rauwe, opgefokte rock uit Nijmegen. Drie man, geen omweg.",
      placeholderNote: "Placeholder-pagina: bestaat in dit prototype alleen om de page transition te tonen.",
      login: "Inloggen", email: "E-mail", password: "Wachtwoord", back: "← Terug naar de site",
      loginDemo: "Demo: hier start de echte login van de Band App.",
      captions: ["live shot — duotone rood", "bandportret", "crowd — duotone teal", "backstage", "gitaar detail"],
      alts: ["Live shot van Static Line (placeholder)", "Bandportret (placeholder)", "Publiek bij een show (placeholder)", "Backstage (placeholder)", "Detail van een gitaar (placeholder)"],
      title: { home: "Static Line — rock uit Nijmegen", shows: "Alle shows — Static Line", band: "Band — Static Line", portaal: "Bandportaal — Static Line" },
    },
    en: {
      skip: "Skip to content",
      navShows: "Shows", navPhotos: "Photos", navBand: "Band", navBooking: "Booking", navLabel: "Main menu",
      menuOpen: "Open menu", menuClose: "Close menu", menuLabel: "Menu",
      heroKicker: "First show — 10 November 2026",
      heroSub: "Raw, wired rock from Nijmegen. Three players, no detours. Loose strings, blown amps, a set that never sits still.",
      heroSubShort: "Raw rock from Nijmegen. Three players, no detours.",
      ctaBook: "Book us", ctaShows: "All shows",
      nextLabel: "Next show",
      nextSub: "Release show with support. Doors 20:00, we play 21:15.",
      allShows: "All shows", count: "5 dates", photos: "Photos", tickets: "Tickets",
      moreShows: "Full agenda",
      footer: "Static Line · Nijmegen · Booking and tech rider on request",
      portal: "Band portal",
      soldout: "Sold out", announced: "Announced", release: "Release show",
      view: "View", enlarge: "Enlarge photo", close: "Close",
      loaderLabel: "Searching signal", loaderHint: "Click or press any key to skip",
      chHome: "Home", chShows: "Shows", chBand: "Band",
      bandLead: "Raw, wired rock from Nijmegen. Three players, no detours.",
      placeholderNote: "Placeholder page: exists in this prototype only to show the page transition.",
      login: "Log in", email: "Email", password: "Password", back: "← Back to the site",
      loginDemo: "Demo: the real Band App login starts here.",
      captions: ["live shot — red duotone", "band portrait", "crowd — teal duotone", "backstage", "guitar detail"],
      alts: ["Live shot of Static Line (placeholder)", "Band portrait (placeholder)", "Crowd at a show (placeholder)", "Backstage (placeholder)", "Guitar detail (placeholder)"],
      title: { home: "Static Line — rock from Nijmegen", shows: "All shows — Static Line", band: "Band — Static Line", portaal: "Band portal — Static Line" },
    },
  };

  const SHOWS = [
    { dateNl: "10 nov 2026", dateEn: "10 Nov 2026", venue: "Doornroosje", city: "Nijmegen", status: "release" },
    { dateNl: "21 nov 2026", dateEn: "21 Nov 2026", venue: "Luxor Live", city: "Arnhem", status: "tickets" },
    { dateNl: "05 dec 2026", dateEn: "05 Dec 2026", venue: "dB's", city: "Utrecht", status: "soldout" },
    { dateNl: "17 jan 2027", dateEn: "17 Jan 2027", venue: "Effenaar, Kleine Zaal", city: "Eindhoven", status: "tickets" },
    { dateNl: "07 feb 2027", dateEn: "07 Feb 2027", venue: "Trix", city: "Antwerpen", status: "announced" },
  ];
  const PHOTOS = [
    { src: "../assets/placeholder-1.webp", w: 800, h: 1100 },
    { src: "../assets/placeholder-2.webp", w: 900, h: 640 },
    { src: "../assets/placeholder-3.webp", w: 900, h: 640 },
    { src: "../assets/placeholder-4.webp", w: 900, h: 640 },
    { src: "../assets/placeholder-5.webp", w: 900, h: 640 },
  ];

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const pre = (lang) => (lang === "en" ? "#/en" : "#");
  const route = (lang, page) => (page === "home" ? (lang === "en" ? "#/en" : "#/") : `${pre(lang)}/${page}`);

  // ---------------------------------------------------------------- templates
  const T = {
    hero: (c) => `
<section class="hero grain" id="top">
  <div class="hero__bg" aria-hidden="true"></div>
  <div class="hero__inner">
    <p class="hero__kicker" data-decode data-decode-manual>${esc(c.heroKicker)}</p>
    <h1 class="hero__title"><img class="hero__wordmark" src="../assets/staticline-wordmark-1440.webp" srcset="../assets/staticline-wordmark-960.webp 960w, ../assets/staticline-wordmark-1440.webp 1440w" sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) 520px, 720px" width="1440" height="835" alt="Static Line" fetchpriority="high"></h1>
    <p class="hero__sub" data-reveal="rise" data-reveal-manual data-hero-sub>${esc(c.heroSub)}</p>
    <p class="hero__sub hero__sub--short" data-reveal="rise" data-reveal-manual data-hero-sub>${esc(c.heroSubShort)}</p>
    <div class="hero__actions">
      <a class="btn btn--primary" href="#booking" data-reveal data-reveal-manual><span class="btn__label">${esc(c.ctaBook)}</span></a>
      <a class="btn btn--ghost" href="#shows" data-reveal data-reveal-manual><span class="btn__label">${esc(c.ctaShows)}</span></a>
    </div>
  </div>
  <div class="hero__veil" aria-hidden="true"></div>
</section>`,

    nextShow: (c) => `
<section class="next-show" aria-labelledby="next-venue" data-reveal="wipe" data-decode-delay="260">
  <div class="next-show__date">
    <p class="next-show__label" data-decode>${esc(c.nextLabel)}</p>
    <p class="next-show__day"><span class="next-show__day-full" data-decode data-decode-digits>10.11</span><span class="next-show__day-short" data-decode data-decode-digits>10.11.26</span></p>
    <p class="next-show__meta" data-decode>2026 · 20:30</p>
  </div>
  <div class="next-show__body">
    <h2 class="next-show__venue" id="next-venue">Doornroosje, Nijmegen</h2>
    <p class="next-show__note">${esc(c.nextSub)}</p>
  </div>
  <a class="btn btn--inset next-show__tickets" href="#tickets" data-cursor="${esc(c.tickets)} ↗"><span class="btn__label">${esc(c.tickets)}</span></a>
</section>`,

    showRow: (s, c, lang) => {
      const date = lang === "en" ? s.dateEn : s.dateNl;
      const clickable = s.status === "tickets" || s.status === "release";
      const label = c[s.status === "tickets" ? "tickets" : s.status];
      const inner = `
    <span class="show-row__date">${esc(date)}</span>
    <span class="show-row__venue"><span class="show-row__venue-text">${esc(s.venue)}</span></span>
    <span class="show-row__city" data-decode>${esc(s.city)}</span>
    <span class="show-row__status" data-status="${s.status}"><span class="show-row__status-text" data-decode>${esc(label)}</span>${clickable ? '<span class="show-row__arrow" aria-hidden="true">↗</span>' : ""}</span>`;
      return clickable
        ? `\n  <a class="show-row" href="#tickets" data-status="${s.status}" data-reveal data-stagger="row" data-cursor="${esc(c.tickets)} ↗" data-scramble-hover>${inner.replace('class="show-row__status-text" data-decode', 'class="show-row__status-text" data-decode data-scramble-target')}\n  </a>`
        : `\n  <div class="show-row" data-status="${s.status}" aria-disabled="true" data-reveal data-stagger="row">${inner}\n  </div>`;
    },

    shows: (c, lang, { all = false, h1 = false } = {}) => {
      const H = h1 ? "h1" : "h2";
      return `
<section class="shows${all ? " shows--page" : ""}" id="shows" aria-labelledby="shows-title">
  <div class="shows__head" data-reveal="mask">
    <${H} class="display h2" id="shows-title"><span class="mask-line"><span>${esc(c.allShows)}</span></span></${H}>
    <p class="shows__count" data-decode>${esc(c.count)}</p>
  </div>
  <div class="show-list${all ? " show-list--all" : ""}">${SHOWS.map((s) => T.showRow(s, c, lang)).join("")}
  </div>${all ? "" : `
  <a class="shows__more link-line" href="${route(lang, "shows")}">${esc(c.moreShows)} →</a>`}
</section>`;
    },

    photos: (c) => `
<section class="photos grain" id="photos" aria-labelledby="photos-title">
  <div class="photos__inner">
    <h2 class="display h2" id="photos-title" data-reveal="mask"><span class="mask-line"><span>${esc(c.photos)}</span></span></h2>
    <div class="photo-grid">${PHOTOS.map((p, i) => `
      <figure class="photo" data-reveal data-stagger="photo" data-scramble-hover>
        <img src="${p.src}" alt="${esc(c.alts[i])}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async">
        <span class="photo__bands" aria-hidden="true"><i style="--band-i:0"></i><i style="--band-i:1"></i><i style="--band-i:2"></i><i style="--band-i:3"></i><i style="--band-i:4"></i></span>
        <span class="photo__frame" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <figcaption data-scramble-target>${esc(c.captions[i])}</figcaption>
        <button class="photo__button" type="button" data-lightbox data-cursor="${esc(c.view)}" aria-label="${esc(c.enlarge)}: ${esc(c.captions[i])}"></button>
      </figure>`).join("")}
    </div>
  </div>
</section>`,

    home: (lang) => { const c = COPY[lang]; return T.hero(c) + T.nextShow(c) + T.shows(c, lang) + T.photos(c); },
    showsPage: (lang) => T.shows(COPY[lang], lang, { all: true, h1: true }),
    bandPage: (lang) => { const c = COPY[lang]; return `
<section class="page">
  <p class="page__kicker" data-decode>CH 03 · ${esc(c.chBand)}</p>
  <h1 class="display page__title" data-reveal="mask"><span class="mask-line"><span>${esc(c.navBand)}</span></span></h1>
  <p class="page__lead" data-reveal="rise">${esc(c.bandLead)}</p>
  <p class="page__note" data-reveal="rise">${esc(c.placeholderNote)}</p>
</section>`; },
    portalPage: (lang) => { const c = COPY[lang]; return `
<section class="portal">
  <div class="portal__card">
    <p class="label">${esc(c.portal)}</p>
    <h1 class="display portal__title">${esc(c.login)}</h1>
    <form class="portal__form" novalidate>
      <label class="portal__field"><span>${esc(c.email)}</span><input type="email" name="email" autocomplete="username"></label>
      <label class="portal__field"><span>${esc(c.password)}</span><input type="password" name="password" autocomplete="current-password"></label>
      <button class="btn btn--primary" type="submit"><span class="btn__label">${esc(c.login)}</span></button>
      <p class="portal__status" role="status" aria-live="polite"></p>
    </form>
    <a class="portal__back link-line" href="${route(lang, "home")}">${esc(c.back)}</a>
  </div>
</section>`; },
  };

  const API = { COPY, SHOWS, PHOTOS, T, route };
  if (typeof module !== "undefined" && module.exports) { module.exports = API; return; }
  global.SLDemo = API;

  // ================================================================ browser
  const root = document.documentElement;
  const main = document.getElementById("main");

  function parse(hash) {
    const parts = (hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
    if (hash && hash.startsWith("#") && !hash.startsWith("#/") && hash.length > 1) return null; // anker
    let lang = "nl";
    if (parts[0] === "en") { lang = "en"; parts.shift(); }
    const page = ["shows", "band", "portaal"].includes(parts[0]) ? parts[0] : "home";
    return { lang, page };
  }
  let state = parse(location.hash) || { lang: "nl", page: "home" };

  function render({ lang, page }) {
    main.innerHTML = page === "home" ? T.home(lang) : page === "shows" ? T.showsPage(lang) : page === "band" ? T.bandPage(lang) : T.portalPage(lang);
    applyChrome(lang, page);
  }

  function applyChrome(lang, page) {
    const c = COPY[lang];
    root.lang = lang;
    root.dataset.page = page;
    document.title = c.title[page];
    const set = (sel, fn) => document.querySelectorAll(sel).forEach(fn);
    set(".skip-link", (a) => (a.textContent = c.skip));
    set(".site-nav", (n) => n.setAttribute("aria-label", c.navLabel));
    set("[data-nav='shows']", (a) => { a.href = route(lang, "shows"); a.firstElementChild.textContent = c.navShows; a.toggleAttribute("aria-current", page === "shows"); if (page === "shows") a.setAttribute("aria-current", "page"); });
    set("[data-nav='photos']", (a) => { a.href = "#photos"; a.firstElementChild.textContent = c.navPhotos; });
    set("[data-nav='band']", (a) => { a.href = route(lang, "band"); a.firstElementChild.textContent = c.navBand; a.toggleAttribute("aria-current", page === "band"); if (page === "band") a.setAttribute("aria-current", "page"); });
    set(".site-header__cta .btn__label", (s) => (s.textContent = c.navBooking));
    set(".site-header__home", (a) => (a.href = route(lang, "home")));
    set("[data-lang]", (a) => {
      const l = a.dataset.lang;
      a.href = route(l, page);
      if (l === lang) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    const tg = document.querySelector(".nav-toggle");
    if (tg) { tg.dataset.labelOpen = c.menuOpen; tg.dataset.labelClose = c.menuClose; tg.setAttribute("aria-label", tg.getAttribute("aria-expanded") === "true" ? c.menuClose : c.menuOpen); }
    set(".menu-panel nav", (n) => n.setAttribute("aria-label", c.menuLabel));
    set("[data-menu='shows']", (a) => { a.href = route(lang, "shows"); a.lastElementChild.textContent = c.navShows; });
    set("[data-menu='photos']", (a) => { a.lastElementChild.textContent = c.navPhotos; });
    set("[data-menu='band']", (a) => { a.href = route(lang, "band"); a.lastElementChild.textContent = c.navBand; });
    set("[data-menu='book'] .btn__label", (s) => (s.textContent = c.ctaBook));
    set("[data-l10n]", (el) => (el.textContent = c[el.dataset.l10n]));
    set(".site-footer__portal", (a) => (a.href = route(lang, "portaal")));
    set(".lightbox__close", (b) => (b.textContent = c.close));
  }

  const chLabel = ({ lang, page }) => {
    const c = COPY[lang];
    return page === "home" ? `CH 01 · ${c.chHome}` : page === "shows" ? `CH 02 · ${c.chShows}` : page === "band" ? `CH 03 · ${c.chBand}` : c.portal;
  };

  let busy = false;
  async function go(next, { push = true, anchor = null, restoreY = 0 } = {}) {
    if (busy) return;
    const cur = state;
    if (next.page === cur.page && next.lang === cur.lang) { if (anchor) scrollToAnchor(anchor); return; }
    busy = true;
    const variant = next.page === "portaal" || cur.page === "portaal" ? "calm"
      : next.page === cur.page ? "lang" : "band";
    // scrollpositie van de huidige pagina bewaren, zodat "terug" daar weer uitkomt
    try { history.replaceState({ y: window.scrollY }, ""); } catch (e) {}
    if (push) history.pushState({ y: 0 }, "", route(next.lang, next.page));

    if (variant === "lang") {
      const y = window.scrollY;
      render(next);
      SLMotion.mount(main, { instant: true });
      window.scrollTo(0, y);
      state = next;
      SLMotion.langSwap(document);
      const l = document.querySelector(`.lang-switch [data-lang='${next.lang}']`);
      l && l.focus({ preventScroll: true });
      busy = false;
      return;
    }

    await SLMotion.leave({ variant, label: chLabel(next) });
    render(next);
    state = next;
    SLMotion.scrollToTarget(restoreY || 0, { immediate: true });
    SLMotion.mount(main);
    const h1 = main.querySelector("h1");
    if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
    if (next.page === "home") SLMotion.heroIntro("short");
    const entering = SLMotion.enter({ variant });
    if (anchor) setTimeout(() => scrollToAnchor(anchor), 450);
    await entering;
    busy = false;
  }

  function scrollToAnchor(id) {
    const el = document.getElementById(id);
    if (el) SLMotion.scrollToTarget(el);
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = a.getAttribute("href");
    if (href === "#tickets") { e.preventDefault(); return; }       // demo: geen echte ticketlink
    e.preventDefault();
    if (href.startsWith("#/")) return go(parse(href));
    const id = href.slice(1);
    if (id === "main") { main.focus(); return; }
    if (document.getElementById(id)) return scrollToAnchor(id);
    go({ lang: state.lang, page: "home" }, { anchor: id });           // anker op de homepage
  });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("popstate", (e) => {
    const n = parse(location.hash);
    if (n) go(n, { push: false, restoreY: (e.state && e.state.y) || 0 });
  });

  // portaal: demo-login toont de voortgangslijn
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest(".portal__form");
    if (!f) return;
    e.preventDefault();
    await SLMotion.progressLine(900);
    f.querySelector(".portal__status").textContent = COPY[state.lang].loginDemo;
  });

  // prototype-bediening
  function initProtoPanel() {
    const panel = document.querySelector(".proto-panel");
    if (!panel) return;
    const btn = panel.querySelector("[data-proto='reduce']");
    const on = root.classList.contains("reduce-motion");
    btn.setAttribute("aria-pressed", String(on));
    btn.querySelector("span").textContent = on ? "aan" : "uit";
    btn.addEventListener("click", () => {
      try { sessionStorage.setItem("sl-proto-reduce", on ? "0" : "1"); } catch (e) {}
      location.reload();
    });
    panel.querySelector("[data-proto='replay']").addEventListener("click", () => {
      try { sessionStorage.removeItem("sl-intro-seen"); } catch (e) {}
      location.href = location.pathname + route(state.lang, "home");
      location.reload();
    });
    panel.querySelector("[data-proto='hide']").addEventListener("click", () => panel.classList.toggle("is-min"));
  }

  // start: homepage NL staat al server-side in de HTML (LCP); andere routes renderen we nu
  if (!(state.page === "home" && state.lang === "nl" && main.querySelector(".hero"))) render(state);
  else applyChrome(state.lang, state.page);
  initProtoPanel();
  const start = () => SLMotion.init();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})(typeof window !== "undefined" ? window : globalThis);

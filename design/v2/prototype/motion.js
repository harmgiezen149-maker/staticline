/* =============================================================================
   Static Line — motion layer v2 "Ruis → Lijn" (PROTOTYPE)
   Vanilla JS + Web Animations API + IntersectionObserver. Lenis (optioneel) voor
   smooth scroll op desktop. Geen GSAP nodig.

   Dit is een referentie om gedrag en timing te tonen. NIET 1-op-1 kopiëren:
   implementeer volgens de patronen van de codebase (zie CLAUDE_CODE_PROMPT.md).

   Eén bron voor waarden: alle durations/easings/staggers komen uit tokens.css
   (CSS-variabelen), gelezen via getComputedStyle.
   ============================================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const tok = (name) => cs.getPropertyValue(name).trim();
  const ms = (name) => parseFloat(tok(name)) || 0;
  const pct = (name) => (parseFloat(tok(name)) || 0) / 100;

  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const mqMobile = window.matchMedia("(max-width: 640px)");
  const reduced = () => root.classList.contains("reduce-motion");
  const motionOn = () => root.classList.contains("motion") && !reduced();
  const wait = (t) => new Promise((r) => setTimeout(r, t));
  const raf = () => new Promise((r) => requestAnimationFrame(r));

  // ---------------------------------------------------------------------------
  // 1. DECODE — ruis wordt tekst. Echte tekst blijft in de DOM (layout + schermlezer);
  //    een aria-hidden overlay toont de ruistekens. Alleen voor mono-labels en cijfers
  //    (vaste tekenbreedte → geen layout shift).
  // ---------------------------------------------------------------------------
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/%&*+=<>";
  const DIGITS = "0123456789";
  const isStable = (ch) => /[\s.,:·—–\-\/'↗→←]/.test(ch); // leestekens blijven staan: vorm blijft leesbaar

  function decode(el, opts = {}) {
    if (!el) return Promise.resolve();
    if (el._decodeCancel) el._decodeCancel();
    const text = el.textContent;
    const finish = () => {
      el.classList.add("is-decoded");
      el.classList.remove("is-scrambling");
    };
    if (reduced() || !text.trim()) { finish(); return Promise.resolve(); }

    const duration = opts.duration ?? 600;
    const charset = opts.digits || el.hasAttribute("data-decode-digits") ? DIGITS : GLYPHS;
    const staggerChar = ms("--stagger-char");
    const hotChance = opts.hot ?? 0.12;
    const chars = [...text];
    const n = chars.length;
    // tekens klikken van links naar rechts vast; eerste 35% van de tijd is pure ruis
    const resolveAt = chars.map((_, i) => Math.min(duration, duration * 0.35 + i * staggerChar * (duration / 600)));

    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    const overlay = document.createElement("span");
    overlay.className = "decode-overlay is-shifted"; // AFW-1 kanaalverschuiving in de ruisfase
    overlay.setAttribute("aria-hidden", "true");
    el.appendChild(overlay);
    el.classList.add("is-scrambling");
    el.classList.remove("is-decoded");

    let rafId = 0;
    let lastSwap = -1;
    const t0 = performance.now();
    const esc = (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c);

    return new Promise((resolve) => {
      const done = () => {
        cancelAnimationFrame(rafId);
        overlay.remove();
        finish();
        el._decodeCancel = null;
        resolve();
      };
      el._decodeCancel = done;
      const frame = (now) => {
        const t = now - t0;
        if (t >= duration) return done();
        if (t > duration * 0.35) overlay.classList.remove("is-shifted");
        // ruistekens verversen met 20 fps: storing, geen flikkering
        const slot = Math.floor(t / 50);
        if (slot !== lastSwap) {
          lastSwap = slot;
          let html = "";
          for (let i = 0; i < n; i++) {
            const ch = chars[i];
            if (t >= resolveAt[i] || isStable(ch)) { html += esc(ch); continue; }
            const g = charset[(Math.random() * charset.length) | 0];
            const r = Math.random();
            html += r < hotChance / 2 ? `<span class="is-hot-red">${esc(g)}</span>`
                  : r < hotChance ? `<span class="is-hot-teal">${esc(g)}</span>` : esc(g);
          }
          overlay.innerHTML = html;
        }
        rafId = requestAnimationFrame(frame);
      };
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------------------
  // 2. REVEALS — IntersectionObserver zet .is-in; gelijktijdige binnenkomers krijgen stagger.
  // ---------------------------------------------------------------------------
  const staggerFor = (el) => {
    const s = el.getAttribute("data-stagger");
    return s ? ms(`--stagger-${s}`) : 0;
  };
  let revealsEnabled = false;
  const pending = new Set();

  function reveal(el, delay = 0) {
    if (el.classList.contains("is-in")) return;
    el.style.setProperty("--delay", `${delay}ms`);
    el.classList.add("is-in");
    // decodes binnen het element starten na de entree-aanzet
    const decodeDelay = parseFloat(el.getAttribute("data-decode-delay") || "180");
    const targets = el.matches("[data-decode]") ? [el] : [...el.querySelectorAll("[data-decode]")];
    targets.forEach((t, i) => setTimeout(() => decode(t, { duration: t.hasAttribute("data-decode-digits") ? 500 : 520 }), delay + decodeDelay + i * 60));
    // na afloop: .is-settled zodat hover-transities geen entree-delay erven
    setTimeout(() => el.classList.add("is-settled"), delay + ms("--dur-slow") * 1.5 + 400);
  }

  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    const incoming = entries.filter((e) => e.isIntersecting).map((e) => e.target);
    incoming.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const counters = new Map();
    incoming.forEach((el) => {
      io.unobserve(el);
      const key = el.getAttribute("data-stagger") || "_";
      const i = counters.get(key) || 0;
      counters.set(key, i + 1);
      reveal(el, i * staggerFor(el));
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.01 }) : null;

  function observeReveals(scope = document, { instant = false } = {}) {
    scope.querySelectorAll(instant ? "[data-reveal]:not(.is-in)" : "[data-reveal]:not([data-reveal-manual]):not(.is-in)").forEach((el) => {
      if (instant || !motionOn() || !io) { el.classList.add("is-in", "is-settled"); return; }
      if (!revealsEnabled) { pending.add(el); return; }
      io.observe(el);
    });
    // losse decodes (niet in een reveal, niet handmatig): decoderen zodra ze in beeld komen
    scope.querySelectorAll("[data-decode]:not([data-decode-manual]):not(.is-decoded)").forEach((el) => {
      if (instant || !motionOn() || !decodeIO) { el.classList.add("is-decoded"); return; }
      if (el.closest("[data-reveal]")) return;
      if (!revealsEnabled) { pendingDecode.add(el); return; }
      decodeIO.observe(el);
    });
  }
  const pendingDecode = new Set();
  const decodeIO = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e, i) => {
      decodeIO.unobserve(e.target);
      setTimeout(() => decode(e.target, { duration: 520 }), i * 60);
    });
  }, { rootMargin: "0px 0px -10% 0px" }) : null;
  function enableReveals() {
    revealsEnabled = true;
    pending.forEach((el) => io && io.observe(el));
    pending.clear();
    pendingDecode.forEach((el) => decodeIO && decodeIO.observe(el));
    pendingDecode.clear();
  }

  // ---------------------------------------------------------------------------
  // 3. RUIS-CANVAS — lage amplitude (#090909–#393939): < 4% luminantieverschil,
  //    dus nooit een "flits" in WCAG-zin. 22 fps, 1/3 resolutie.
  // ---------------------------------------------------------------------------
  function startNoise(canvas) {
    const ctx = canvas.getContext("2d", { alpha: false });
    const scale = mqMobile.matches ? 0.25 : 0.33;
    const w = Math.ceil(innerWidth * scale), h = Math.ceil(innerHeight * scale);
    canvas.width = w; canvas.height = h;
    const img = ctx.createImageData(w, h);
    const buf = new Uint32Array(img.data.buffer);
    let id = 0, last = 0, alive = true;
    const loop = (t) => {
      if (!alive) return;
      if (t - last > 45) {
        last = t;
        for (let i = 0; i < buf.length; i++) {
          const v = 9 + ((Math.random() * 48) | 0);
          buf[i] = 0xff000000 | (v << 16) | (v << 8) | v;
        }
        ctx.putImageData(img, 0, 0);
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(id); };
  }

  // ---------------------------------------------------------------------------
  // 4. LOADER "Afstemmen" — ruis → lijn → beeld. Eén keer per sessie, overslaanbaar.
  //    Het hero-wordmark ligt er al (LCP), de loader ligt er alleen bovenop.
  // ---------------------------------------------------------------------------
  function runLoader() {
    const L = document.querySelector(".loader");
    if (!L || !root.classList.contains("sl-intro") || !motionOn()) {
      root.classList.remove("sl-intro");
      if (L) L.remove();
      return null;
    }
    try { sessionStorage.setItem("sl-intro-seen", "1"); } catch (e) {}

    const mobile = mqMobile.matches;
    const minT = mobile ? 700 : ms("--loader-min");
    const maxT = mobile ? 1000 : ms("--loader-max");
    const signal = L.querySelector(".loader__signal");
    const line = L.querySelector(".loader__line");
    const count = L.querySelector(".loader__count");
    const readout = L.querySelector(".loader__readout");
    const hint = L.querySelector(".loader__hint");
    const track = L.querySelector(".loader__track");
    const top = L.querySelector(".loader__panel--top");
    const bottom = L.querySelector(".loader__panel--bottom");
    const stopNoise = startNoise(L.querySelector(".loader__noise"));

    let skipped = false;
    let skipResolve;
    const skipP = new Promise((r) => (skipResolve = r));
    const skip = () => { skipped = true; skipResolve(); };
    L.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });

    decode(readout.firstElementChild, { duration: 360, hot: 0.2 });
    track.animate([{ transform: "translate3d(0,-100%,0)" }, { transform: `translate3d(0,${innerHeight}px,0)` }],
      { duration: ms("--dur-dramatic"), easing: "linear", iterations: 1 });

    // gereedheid: fonts + gedecodeerd hero-wordmark, minimaal minT, maximaal maxT
    const mark = document.querySelector(".hero__wordmark");
    const ready = Promise.all([
      document.fonts ? document.fonts.ready : null,
      mark && mark.decode ? mark.decode().catch(() => {}) : null,
    ]);
    const t0 = performance.now();
    let isReady = false;
    ready.then(() => (isReady = true));

    // teller: loopt naar 92 op tijd, 92→100 zodra klaar
    let shown = 0;
    const tick = () => {
      const t = performance.now() - t0;
      const target = isReady && t >= minT ? 100 : Math.min(92, (t / maxT) * 92);
      shown += (target - shown) * 0.25;
      count.textContent = String(Math.round(shown)).padStart(3, "0");
      if (!skipped && shown < 99.5 && t < maxT + 400) requestAnimationFrame(tick);
      else count.textContent = "100";
    };
    requestAnimationFrame(tick);

    const gate = Promise.race([
      Promise.all([ready, wait(minT)]).then(() => wait(160)),
      wait(maxT),
      skipP,
    ]);

    const eBand = tok("--ease-band"), eCut = tok("--ease-cut");
    const opened = gate.then(async () => {
      count.textContent = "100";
      const fast = skipped;
      // ruis klapt samen tot één lijn
      readout.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
      if (hint) hint.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
      const collapse = signal.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(0.004)" }],
        { duration: fast ? 120 : 240, easing: eCut, fill: "forwards" });
      line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 60, delay: fast ? 80 : 180, fill: "forwards" });
      await collapse.finished;
      stopNoise();
      signal.style.visibility = "hidden";
      await wait(fast ? 0 : 60);
      // de lijn opent zich tot beeld: panelen uit elkaar
      root.classList.remove("sl-intro"); // header schuift binnen
      const dur = fast ? 260 : 500;
      top.animate([{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0,-100%,0)" }], { duration: dur, easing: eBand, fill: "forwards" });
      const b = bottom.animate([{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0,100%,0)" }], { duration: dur, easing: eBand, fill: "forwards" });
      line.animate([{ opacity: 1, transform: "scaleX(1)" }, { opacity: 0, transform: "scaleX(1)" }], { duration: 200, delay: fast ? 0 : 120, fill: "forwards" });
      b.finished.then(() => { L.remove(); window.removeEventListener("keydown", skip); });
      return { skipped: fast };
    });
    return opened;
  }

  // ---------------------------------------------------------------------------
  // 5. HERO-INTRO — 'full' na de loader, 'short' bij herhaalbezoek of na een page transition.
  //    Wordmark wordt NOOIT verborgen of vervormd; er ligt alleen een ruissluier overheen.
  // ---------------------------------------------------------------------------
  function heroIntro(kind = "short") {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const kicker = hero.querySelector(".hero__kicker");
    const subs = hero.querySelectorAll("[data-hero-sub]");
    const btns = hero.querySelectorAll(".hero__actions .btn");
    const veil = hero.querySelector(".hero__veil");
    if (!motionOn()) {
      [...subs, ...btns].forEach((el) => el.classList.add("is-in", "is-settled"));
      if (kicker) kicker.classList.add("is-decoded");
      return;
    }
    const full = kind === "full";
    if (veil) veil.animate([{ opacity: full ? 0.55 : 0.4 }, { opacity: 0 }],
      { duration: full ? 800 : 600, easing: tok("--ease-signal"), fill: "forwards" });
    setTimeout(() => decode(kicker, { duration: full ? 600 : 480 }), full ? 140 : 60);
    subs.forEach((el) => reveal(el, full ? 220 : 120));
    btns.forEach((el, i) => reveal(el, (full ? 280 : 180) + i * ms("--stagger-item")));
  }

  // ---------------------------------------------------------------------------
  // 6. SCROLL — parallax hero, docking van het wordmark, header verbergen/tonen.
  // ---------------------------------------------------------------------------
  let lenis = null;
  function initLenis() {
    if (!window.Lenis || !mqFine.matches || reduced()) return;
    lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true, wheelMultiplier: 1 });
    const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  const scrollY = () => window.scrollY || document.documentElement.scrollTop;

  let lastY = 0, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; updateScroll(); });
  }
  function updateScroll() {
    const y = scrollY();
    const header = document.querySelector(".site-header");
    const hero = document.querySelector(".hero");
    const menuOpen = document.querySelector(".menu-panel")?.dataset.state === "open";

    // header: omlaag = weg, omhoog = terug
    if (header && motionOn()) {
      const down = y > lastY + 2, up = y < lastY - 2;
      if (y < 120 || menuOpen || header.contains(document.activeElement)) header.classList.remove("is-hidden");
      else if (down) header.classList.add("is-hidden");
      else if (up) header.classList.remove("is-hidden");
    }
    lastY = y;

    if (!hero) { header && header.classList.add("is-docked"); return; }
    const h = hero.offsetHeight;
    const p = Math.max(0, Math.min(1, y / h));
    if (motionOn() && y < h + 50) {
      const bg = hero.querySelector(".hero__bg");
      const mark = hero.querySelector(".hero__wordmark");
      if (bg) bg.style.transform = `translate3d(0, ${(p * pct("--parallax-bg") * h).toFixed(1)}px, 0)`;
      if (mark) {
        mark.style.transform = `translate3d(0, ${(p * pct("--parallax-mark") * h).toFixed(1)}px, 0)`;
        mark.style.opacity = String(1 - p * 0.65);
      }
      hero.style.setProperty("--hero-p", p.toFixed(3));
    }
    // docking: header-wordmark verschijnt zodra het hero-wordmark onder de header verdwijnt
    const mark = hero.querySelector(".hero__wordmark");
    if (header && mark) {
      const docked = mark.getBoundingClientRect().bottom < header.getBoundingClientRect().bottom + 8;
      header.classList.toggle("is-docked", docked);
    }
  }

  // levende korrel alleen animeren als hij in beeld is
  const grainIO = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    es.forEach((e) => e.target.classList.toggle("is-offscreen", !e.isIntersecting));
  }) : null;
  function observeGrain(scope = document) {
    if (grainIO) scope.querySelectorAll(".grain").forEach((g) => grainIO.observe(g));
  }

  // ---------------------------------------------------------------------------
  // 7. MOBIEL MENU — paneel rolt uit in banden, items decoderen/rijzen binnen.
  // ---------------------------------------------------------------------------
  function initMenu() {
    const toggle = document.querySelector(".nav-toggle");
    const panel = document.querySelector(".menu-panel");
    if (!toggle || !panel) return;
    const bands = [...panel.querySelectorAll(".menu-panel__bands i")];
    const items = [...panel.querySelectorAll("[data-menu-item]")];
    const scan = panel.querySelector(".menu-panel__scan");
    const inertTargets = () => [document.querySelector(".site-main"), document.querySelector(".site-footer")].filter(Boolean);
    let busy = false;

    const open = async () => {
      if (busy || panel.dataset.state === "open") return;
      busy = true;
      panel.hidden = false;
      items.forEach((el, i) => el.style.setProperty("--delay", `${160 + i * ms("--stagger-item")}ms`));
      panel.querySelectorAll(".menu-panel__list li").forEach((li, i) => li.style.setProperty("--delay", `${200 + i * ms("--stagger-item")}ms`));
      await raf();
      panel.dataset.state = "open";
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", toggle.dataset.labelClose || "Menu sluiten");
      inertTargets().forEach((el) => el.setAttribute("inert", ""));
      lenis && lenis.stop();
      document.body.style.overflow = "hidden";
      if (motionOn()) {
        bands.forEach((b, i) => b.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
          { duration: 420, delay: i * ms("--stagger-band"), easing: tok("--ease-band"), fill: "backwards" }));
        if (scan) scan.animate([{ opacity: 0 }, { opacity: 0.12 }, { opacity: 0 }], { duration: 520, easing: "linear" });
        panel.querySelectorAll(".menu-panel__index").forEach((el, i) => setTimeout(() => decode(el, { duration: 360 }), 220 + i * 60));
      }
      setTimeout(() => { const first = panel.querySelector("a"); first && first.focus({ preventScroll: true }); busy = false; }, motionOn() ? 260 : 0);
    };
    const close = async (returnFocus = true) => {
      if (busy || panel.dataset.state !== "open") return;
      busy = true;
      panel.dataset.state = "closing";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", toggle.dataset.labelOpen || "Menu openen");
      if (motionOn()) {
        await wait(ms("--dur-fast"));
        const anims = bands.slice().reverse().map((b, i) => b.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }],
          { duration: 320, delay: i * 30, easing: tok("--ease-cut"), fill: "forwards" }));
        await Promise.all(anims.map((a) => a.finished));
        anims.forEach((a) => a.cancel());
      } else {
        await wait(ms("--dur-fast"));
      }
      panel.dataset.state = "closed";
      panel.hidden = true;
      inertTargets().forEach((el) => el.removeAttribute("inert"));
      document.body.style.overflow = "";
      lenis && lenis.start();
      if (returnFocus) toggle.focus({ preventScroll: true });
      busy = false;
    };
    toggle.addEventListener("click", () => (panel.dataset.state === "open" ? close() : open()));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.dataset.state === "open") close(); });
    panel.addEventListener("click", (e) => { if (e.target.closest("a")) close(false); });
    mqMobile.addEventListener("change", () => { if (!mqMobile.matches && panel.dataset.state === "open") close(false); });
  }

  // ---------------------------------------------------------------------------
  // 8. PAGE TRANSITIONS "Kanaalwissel" — banden sluiten, pagina wisselt, banden openen.
  //    variant 'band' (publiek), 'calm' (portaal), 'lang' (NL/EN: geen banden, decode in place).
  // ---------------------------------------------------------------------------
  const ptEl = () => document.querySelector(".pt");
  const bandsOf = (pt) => [...pt.querySelectorAll(".pt__band")].filter((b) => getComputedStyle(b).display !== "none");

  async function leave({ variant = "band", label = "" } = {}) {
    const pt = ptEl();
    if (!pt) return;
    pt.classList.toggle("pt--calm", variant === "calm" || reduced());
    pt.classList.add("is-active");
    const bands = bandsOf(pt);
    if (variant === "calm" || reduced()) {
      await Promise.all(bands.map((b) => b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced() ? 120 : 200, easing: "linear", fill: "forwards" }).finished));
      return;
    }
    const lab = pt.querySelector(".pt__label");
    const anims = bands.map((b, i) => {
      const from = i % 2 === 0 ? "-101%" : "101%";
      return b.animate([{ transform: `translate3d(${from},0,0)` }, { transform: "translate3d(0,0,0)" }],
        { duration: 360, delay: i * ms("--stagger-band"), easing: tok("--ease-band"), fill: "forwards" });
    });
    if (lab && label) {
      lab.textContent = label;
      setTimeout(() => { lab.style.opacity = "1"; decode(lab, { duration: 300, hot: 0.2 }); }, 220);
    }
    await Promise.all(anims.map((a) => a.finished));
  }

  async function enter({ variant = "band" } = {}) {
    const pt = ptEl();
    if (!pt) return;
    const bands = bandsOf(pt);
    const lab = pt.querySelector(".pt__label");
    if (lab) lab.style.opacity = "0";
    let anims;
    if (variant === "calm" || reduced()) {
      anims = bands.map((b) => b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced() ? 120 : 240, easing: "linear", fill: "forwards" }));
    } else {
      anims = bands.map((b, i) => {
        const to = i % 2 === 0 ? "101%" : "-101%"; // banden lopen door in dezelfde richting
        return b.animate([{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(${to},0,0)` }],
          { duration: 420, delay: i * ms("--stagger-band"), easing: tok("--ease-band"), fill: "forwards" });
      });
    }
    await Promise.all(anims.map((a) => a.finished));
    bands.forEach((b) => b.getAnimations().forEach((a) => a.cancel()));
    pt.classList.remove("is-active", "pt--calm");
  }

  // Taalwissel: zelfde pagina, andere taal → labels decoderen, rest vervaagt kort in.
  function langSwap(scope = document) {
    if (!motionOn()) return;
    scope.querySelectorAll("[data-decode]").forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight * 1.2) decode(el, { duration: 360 });
      else el.classList.add("is-decoded");
    });
    scope.querySelectorAll("h1, h2, .hero__sub, .hero__sub--short, .show-row__venue, .show-row__date, .next-show__venue, .next-show__note, .btn__label, .site-nav a, .site-footer__note").forEach((el) => {
      el.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 240, easing: tok("--ease-signal") });
    });
  }

  // Voortgangslijn (portaal): 2px teal, tekent van links naar rechts.
  function progressLine(duration = 900) {
    let line = document.querySelector(".progress-line");
    if (!line) { line = document.createElement("div"); line.className = "progress-line"; document.body.appendChild(line); }
    return line.animate([{ transform: "scaleX(0)", opacity: 1 }, { transform: "scaleX(0.85)", opacity: 1, offset: 0.8 }, { transform: "scaleX(1)", opacity: 0 }],
      { duration: reduced() ? 1 : duration, easing: tok("--ease-line"), fill: "forwards" }).finished;
  }

  // ---------------------------------------------------------------------------
  // 9. CURSORLABEL — alleen fijne pointer, nooit touch/reduced. Systeemcursor blijft zichtbaar.
  // ---------------------------------------------------------------------------
  function initCursorLabel() {
    if (!mqFine.matches || reduced()) return;
    const lab = document.createElement("div");
    lab.className = "cursor-label";
    lab.setAttribute("aria-hidden", "true");
    document.body.appendChild(lab);
    let x = -200, y = -200, tx = -200, ty = -200, current = null, running = false;
    const follow = () => {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      const w = lab.offsetWidth;
      const ox = tx + 18 + w > innerWidth - 8 ? -w - 14 : 18; // aan de rechterrand naar links klappen
      lab.style.transform = `translate3d(${(x + ox).toFixed(1)}px, ${(y + 18).toFixed(1)}px, 0)`;
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) requestAnimationFrame(follow); else running = false;
    };
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY;
      if (!running) { running = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t === current) return;
      current = t;
      if (t) {
        lab.textContent = t.getAttribute("data-cursor");
        lab.classList.add("is-visible");
        decode(lab, { duration: 360, hot: 0.18 });
      } else {
        lab.classList.remove("is-visible");
      }
    });
    document.addEventListener("scroll", () => { if (current) { current = null; lab.classList.remove("is-visible"); } }, { passive: true });
  }

  // Hover-scramble op navigatie, statussen en mail (alleen fijne pointer)
  function initHoverScramble() {
    if (!mqFine.matches) return;
    document.addEventListener("pointerover", (e) => {
      if (reduced()) return;
      const host = e.target.closest("[data-scramble-hover]");
      if (!host || host.contains(e.relatedTarget)) return;
      const target = host.querySelector("[data-scramble-target]") || host;
      if (target._decodeCancel) return;
      decode(target, { duration: 380, hot: 0.15 });
    });
  }

  // ---------------------------------------------------------------------------
  // 10. LIGHTBOX — foto vliegt van rasterpositie naar het midden (uniforme schaal, geen vervorming).
  // ---------------------------------------------------------------------------
  function initLightbox() {
    const dlg = document.querySelector(".lightbox");
    if (!dlg || !dlg.showModal) return;
    const img = dlg.querySelector(".lightbox__img");
    const cap = dlg.querySelector(".lightbox__caption");
    const scan = dlg.querySelector(".lightbox__scan");
    let origin = null;

    const flip = (fromRect, toRect) => {
      const s = fromRect.width / toRect.width;
      const dx = fromRect.left + fromRect.width / 2 - (toRect.left + toRect.width / 2);
      const dy = fromRect.top + fromRect.height / 2 - (toRect.top + toRect.height / 2);
      const visH = Math.min(toRect.height, fromRect.height / s);
      const inset = Math.max(0, (toRect.height - visH) / 2);
      return { from: { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${s})`, clipPath: `inset(${inset}px 0 ${inset}px 0)` },
               to: { transform: "translate3d(0,0,0) scale(1)", clipPath: "inset(0 0 0 0)" } };
    };

    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-lightbox]");
      if (!btn) return;
      const fig = btn.closest(".photo");
      const src = fig.querySelector("img");
      origin = src;
      img.style.visibility = "hidden";
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      cap.textContent = fig.querySelector("figcaption")?.textContent || "";
      dlg.showModal();
      lenis && lenis.stop();
      await img.decode().catch(() => {});
      img.style.visibility = "";
      if (!motionOn()) { dlg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 }); cap.classList.add("is-decoded"); return; }
      const f = flip(src.getBoundingClientRect(), img.getBoundingClientRect());
      img.animate([f.from, f.to], { duration: 560, easing: tok("--ease-band") });
      if (scan) scan.animate([{ opacity: 0 }, { opacity: 0.12 }, { opacity: 0 }], { duration: 420, easing: "linear" });
      setTimeout(() => decode(cap, { duration: 420 }), 260);
    });

    const closeBox = async () => {
      if (motionOn() && origin) {
        const f = flip(origin.getBoundingClientRect(), img.getBoundingClientRect());
        await img.animate([f.to, f.from], { duration: 380, easing: tok("--ease-cut") }).finished.catch(() => {});
      }
      dlg.close();
    };
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); closeBox(); });
    dlg.querySelector(".lightbox__close").addEventListener("click", closeBox);
    dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.classList.contains("lightbox__stage")) closeBox(); });
    dlg.addEventListener("close", () => { lenis && lenis.start(); });
  }

  // ---------------------------------------------------------------------------
  // PUBLIEKE API
  // ---------------------------------------------------------------------------
  function mount(scope = document, opts = {}) {
    observeReveals(scope, opts);
    observeGrain(scope);
    updateScroll();
  }

  async function init({ onLoaderOpen } = {}) {
    root.classList.add("motion-ready");
    mqReduce.addEventListener("change", () => location.reload());
    initLenis();
    initMenu();
    initCursorLabel();
    initHoverScramble();
    initLightbox();
    (lenis ? lenis.on("scroll", onScroll) : null);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    mount(document);

    const opened = runLoader();
    if (opened) {
      const r = await opened;
      heroIntro(r.skipped ? "short" : "full");
      setTimeout(enableReveals, r.skipped ? 0 : 280);
    } else {
      heroIntro("short");
      enableReveals();
    }
    onLoaderOpen && onLoaderOpen();
  }

  function scrollToTarget(target, { immediate = false } = {}) {
    const header = document.querySelector(".site-header");
    const off = header ? header.offsetHeight : 0;
    if (lenis && immediate && typeof target === "number") {
      lenis.resize();                       // nieuwe pagina: afmetingen eerst bijwerken, anders klemt Lenis op de oude hoogte
      window.scrollTo(0, target);
      lenis.scrollTo(target, { immediate: true, force: true });
    } else if (lenis) lenis.scrollTo(target, { offset: typeof target === "number" ? 0 : -off, immediate, duration: 1.1 });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: immediate || reduced() ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: immediate || reduced() ? "auto" : "smooth", block: "start" });
  }

  window.SLMotion = { init, mount, leave, enter, langSwap, heroIntro, decode, progressLine, scrollToTarget, updateScroll,
    get lenis() { return lenis; } };
})();

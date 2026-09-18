# Static Line

The visual system for the band Static Line: a public website and a login-only band portal, live before the first show on 10 November 2026.

This is a foundation, not a finished system. The logo, the colours and the scales are settled and agreed by the band. Typography is a proposal that still needs a decision, and no components have been built yet. What is still open is listed at the bottom.

## Where this comes from

Everything here derives from one source: the STATIC LINE wordmark. Heavy condensed capitals, cut from weathered cream stock, cracked, with red paint bleeding into the letters and a lightning strike running through. The band settled on it unanimously, so every other choice answers to it rather than the other way round.

Three band members filled in a requirements questionnaire. Where they disagreed, the majority decided. The results that shape this system:

- **Raw and energetic** as the base register, with **retro/vintage** underneath. Both carried two of three votes.
- **Dark and mysterious** as an accent, not as the carrier.
- The logo goes **large at the top of the homepage and small in the footer**, not prominently on every page. Unanimous.
- The existing mockup was criticised for looking too AI-generated. It should be tighter and more deliberate.
- Grain and texture are wanted, and they fit: the background plate already carries them.

## Content fundamentals

**The site exists to get the band booked.** All three members said so in their own words. Every design decision serves that: the next show and the way to reach the band are never more than one screen away, and the booking form is the most carefully designed block on the site.

**Two voices, one system.** The public site may be loud, textured and full. The portal is a workspace where setlists get built and riders get filed — often on a phone, backstage, in the dark, shortly before going on. There the texture recedes and legibility wins. Same tokens, different density.

**Dutch and English, side by side.** Every string exists in both. English headings run short, Dutch long. Never design a heading that fits exactly on one line — check it at roughly thirty percent more characters before calling it done.

**Dark only.** There is no light theme and none is planned. Do not design one.

## Visual foundations

### Colour

Five colours come straight out of the logo: the near-black of the brush strokes, the antracite-teal of the background, the cream of the letters, the red of the paint and the teal of the splatter. Everything in `tokens.json` is built from those.

Two contrast facts worth knowing before you use them:

- `accent` red on `bg-base` reaches only 3.2:1. It is fine as a fill and for large headings, and wrong for body copy. When text sits on red, it is `text-on-accent` cream at 5.3:1 — never a dark colour.
- `text-faint` is 3.6:1 and exists for placeholders and disabled states. Anything a reader must actually read uses `text-muted` or better.

Red is the brand's colour and appears wherever the band speaks. `danger` is deliberately a lighter, oranger red so a form error never reads as a brand moment.

### Texture

The grain, the cracks and the splatter are the strongest thing this brand owns, and the fastest way to ruin it is to use them everywhere. The rule:

- **Yes** on the hero, on page edges, and behind short display type.
- **No** behind running text, form fields, tables or anything in the portal.

Prefer CSS for grain — an SVG noise filter or a small repeating pattern — over a full-page PNG overlay. The site is loaded on 4G from a sticker QR code in a venue car park, and a heavy overlay costs both bandwidth and scroll performance.

### Photography

Band photos arrive from different phones and different rooms and currently do not look like they belong together. One treatment fixes that: desaturate, then push through a red or teal duotone drawn from `accent` and `accent-alt`. Applied consistently, any snapshot joins the set. The treatment still needs to be picked and shown on real photos.

### Shape and space

Corners are sharp by default. `radius-none` is the standard; `radius-sm` at 2px exists so small controls do not look broken, and `radius-md` at 4px is the ceiling. Rounded corners fight the cut letterforms.

Spacing runs on a 4px base in nine steps. Staying on the scale means the build needs no exceptions; a stray 13px or 27px costs a config entry every time.

### Focus

One visible focus ring, `focus-ring` teal at 2px with 2px offset, on every interactive element. Dark interfaces with low-contrast surfaces lose keyboard focus faster than any other kind, and the portal is used one-handed under time pressure.

## Assets

The wordmark exists in four forms plus a background plate — see the Logos group. The short version:

- **Vector SVG** for anything printed: stickers, shirts, the favicon. Sharp at any size, one colour, no texture.
- **Textured PNG** for the web hero and any large on-screen use. This is the one that carries the cracks and paint.
- **Flat cream and flat black PNG** for small sizes, where texture turns to mud.
- **Background plate** for hero backgrounds and section fills.

The wordmark is final. Do not redraw, restyle or regenerate it.

## What is still open

| Item | Status |
| --- | --- |
| Typefaces | Oswald and Inter are a placeholder chosen to match the logo's condensed weight and stay loadable via `next/font`. Needs a decision before components are built. |
| Components | None built yet. Buttons, inputs, select, checkbox, cards, nav, footer, language switch, portal table, modal, alerts, empty states and loading skeletons are all required, each with every state. |
| Photo treatment | Defined in principle, not yet applied to real photos — none have been delivered. |
| Domain name | Not chosen. Determines footer text and the sticker artwork. |
| Sticker and QR artwork | Print deadline is late October, ahead of the site launch. |

## Building on this

The site is Next.js with Tailwind on Vercel, sharing a database with the band's existing Band App. The token names here map one-to-one onto CSS variables and Tailwind classes, and the spacing scale and breakpoints (640 / 768 / 1024 / 1280) are Tailwind's own. Design on the scale and the build needs no translation layer.

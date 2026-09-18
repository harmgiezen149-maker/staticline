# 05 — Build plan

Hard deadline: **10 November 2026**, the band's first show at Doornroosje in Nijmegen. The site has to be live before then, because stickers with a QR code get handed out that night.

Design is finished for the homepage and the domain is registered, so building can start immediately.

## Phase 0 — Foundation

- Next.js + TypeScript + Tailwind, GitHub repo, Vercel project connected
- `staticline.nl` pointed at Vercel, DNS staying at the registrar
- `boeking@staticline.nl` forwarding to two inboxes
- `styles/tokens.css` generated from `design-system/tokens.json`, wired into `tailwind.config`
- Fonts self-hosted: Oswald 500/600/700, Inter 400/600, JetBrains Mono 400/500
- i18n routing scaffolded with empty resource files

Done when a blank page deploys on the domain with the tokens available and both routes resolving.

## Phase 1 — Homepage

The only fully designed screen. Build it pixel-accurately from `design/DESIGN-HANDOFF.md`, using `design/reference/` for values and `design/screens/` for the rendered result.

Components: `SiteHeader`, `Hero`, `NextShow`, `ShowList` + `ShowRow`, `PhotoGrid`, `SiteFooter`.

Shows come from a local `shows.json` at this stage — the database can wait. Photo placeholders stay in until real photography arrives.

Both breakpoints, 1024 and 640. Both languages.

**Blocked:** the mobile navigation panel is not designed. The handoff says to ask for a design rather than improvise. Either get it designed or flag clearly that you are extrapolating.

## Phase 2 — Remaining public pages

Not designed. Extrapolate from the homepage patterns and the token set — no new colours, radii, shadows or motion.

Over de band, bandleden, muziek, video, fotogalerij, full agenda with map and archive.

## Phase 3 — Booking form

The most important block on the site, because getting booked is the point of it.

Single form with a Boeking / Algemene vraag switch; choosing Boeking expands eleven fields (listed in `docs/01-scope.md`). Group them — eleven fields in one column will lose people.

Submissions are stored in the database *and* emailed via Resend or Postmark. Confirmation mail to the sender. Captcha.

The downloadable technical rider and stage plan PDF also lives on this page. It can start as a static file and become generated later.

## Phase 4 — Database and auth

- Inspect the Band App first — see `docs/04-band-app-integration.md`
- Connect to the shared Postgres
- Move shows off `shows.json` onto the shared table
- Auth for four known users, roles `admin` and `member`, long-lived sessions

## Phase 5 — Portal

Not designed. Sober, legible, same tokens, much less texture. Used on a phone, backstage, in the dark.

Order within the phase, by how much the band actually needs them: agenda, setlists, ideas, then riders and stage plans, tasks, band information, and the CMS last.

`updatedAt` / `updatedBy` visible from the first screen, not retrofitted.

## Phase 6 — Content and launch

- Band bio written, photography delivered and duotoned, both languages complete
- Real show data replacing the placeholders — only 10-11-2026 is currently confirmed
- Accessibility pass: contrast, focus, hit targets, alt text
- Lighthouse on a throttled connection, because the launch audience is on 4G in a car park
- Both languages checked for broken layouts on long Dutch headings

## Ahead of the site: stickers

Sticker and QR artwork has to go to print in **late October**, before the site launches. It only needs the domain and the wordmark, both of which exist now. Do not let it wait on the build.

## If time runs short

The public site ships; the portal follows. That was the agreed fallback — two band members had no objection to phasing. Cut in this order: CMS first, then tasks and band information, then riders and stage plans. Agenda, setlists and ideas are the three all three members named, so they are the last to go.

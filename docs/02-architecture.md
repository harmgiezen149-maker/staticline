# 02 — Architecture

## Stack and why

**Next.js on Vercel, deployed from GitHub.** The deciding factor was the portal. A classic hosting package runs Apache and PHP — fine for WordPress, wrong for an app with authentication, a database and API routes. The alternative would be a VPS with self-managed Node, updates and security, which is exactly the operational overhead this project should avoid.

Vercel gives deploys from GitHub, free SSL, a preview deployment per branch (useful for showing the band a change before it goes live) and one-click rollback.

**One caveat, worth knowing now:** Vercel's Hobby plan is limited to personal, non-commercial use, and Vercel reads "commercial" broadly — any use that generates money for someone who worked on the project, donations included. While the band sells nothing, Hobby is fine. The moment the webshop arrives, it moves to Pro at $20/month. That belongs in the merch business case, not in a surprise email.

## Domain and DNS

`staticline.nl` is registered.

- Add the domain in Vercel, then set the A record for the apex and a CNAME for `www` at the registrar to the values Vercel shows.
- **Keep DNS at the registrar**, not at Vercel, so mail records stay in one place.
- SSL is automatic.

## Mail

Vercel does not do email. Two separate things:

**Receiving.** `boeking@staticline.nl` with forwarding to two band members' inboxes. Free at most registrars, and it satisfies both the wish for a single public address and the wish that two people see every request.

**Sending.** The contact form sends through Resend or Postmark, not through the domain mailbox — otherwise submissions land in spam. Set SPF and DKIM for the sending domain.

If the band later wants to reply *from* `boeking@staticline.nl` rather than their personal addresses, that needs a real mailbox: registrar mail hosting for a few euros a month, or Google Workspace.

## Database

**One Postgres database, shared with the Band App.** Not two databases with synchronisation between them.

This is the central architectural decision and it is worth stating plainly: "100% integrated" is achieved by not synchronising. One database means there is no second source of truth, so conflicting data cannot occur by construction. Synchronisation between two stores would have introduced exactly the duplicate-entry and conflict problems the band wanted to avoid.

This is feasible because the band built the Band App themselves with Claude Code, so its schema is under their control.

Practical consequences:

- Website and Band App both read and write the shared tables.
- Public CMS content lives in website-owned tables; the Band App has no business there.
- Migrations touch a schema another application depends on. See `docs/04-band-app-integration.md` for the rules.

If the Band App turns out not to be on Postgres, Supabase is the pragmatic target: Postgres plus ready-made auth and row-level security, with a free tier that easily covers four users.

## Authentication

Portal only; the public site has no login.

Four users, all known in advance. This does not need social login, magic links from six providers, or a registration flow. Email plus password with invite-only account creation, or magic links, both fine. Roles `admin` and `member` as described in `docs/01-scope.md`.

Because the portal is used on a phone backstage, sessions should be long-lived. Nobody wants to re-authenticate while the support act is finishing.

## Internationalisation

Dutch and English, routed: `/` and `/en`, or the framework's i18n routing. **Not client-side only.** The design prototype stores the choice in `localStorage` under `sl-lang`; that is prototype convenience and should not be rebuilt.

All copy lives in resource files, not inline in components. Both languages exist for every string, including date formats — "10 nov 2026" against "10 Nov 2026".

English headings run short and Dutch long. Layouts that fit exactly on one line in one language break in the other.

## Performance

The realistic worst case is a visitor on 4G in a venue car park who just scanned a sticker QR code. That shapes a few choices:

- Self-host fonts as woff2 with `font-display: swap`. Oswald in 500/600/700, Inter in 400/600, JetBrains Mono in 400/500 — no other weights.
- The grain texture is a 256×256 tiling PNG, not a full-page overlay image.
- Photography goes through `next/image` with a declared aspect ratio per block so layout does not shift while loading.
- The homepage intro film idea, if it ever happens, is a click-to-load YouTube embed. Not an autoplaying background video.

## Accessibility

- WCAG AA on text contrast. The risk areas on a dark ground are the red accent and grey captions — both are already resolved in the token set, so use the tokens rather than picking colours.
- `accent` red on `bg-base` is 3.2:1: fills and large headings only, never body copy.
- Text on an accent fill is `text-on-accent` cream at 5.3:1, never a dark colour.
- One focus ring, everywhere.
- Hit targets at least 44×44px on mobile.
- `alt` text on photography; the wordmark is `alt="Static Line"`.

## Costs

| Item | Cost |
| --- | --- |
| Domain | €5–15 per year |
| Vercel | €0 until the webshop, then $20/month |
| Database | €0 on a free tier |
| Mail forwarding | €0–3 per month |

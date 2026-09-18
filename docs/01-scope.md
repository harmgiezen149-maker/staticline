# 01 — Scope

What is being built, and what deliberately is not. Everything here traces back to a questionnaire filled in by three band members; where they disagreed, the majority decided. Two decisions overrule the majority and are marked as such.

## The point of the site

All three members said it in their own words: **the site exists to get the band booked.** The next show and the way to reach the band are never more than one screen away, and the booking form is the most carefully considered block on the site.

Secondary purpose: the band checking the agenda and setlists.

## Public site

| Section | Status | Notes |
| --- | --- | --- |
| Home | Designed | See `design/DESIGN-HANDOFF.md` |
| Over de band / bio | In scope | Copy not written yet |
| Bandleden | In scope | 2 of 3 votes; one member preferred Instagram only |
| Muziek | In scope | Spotify and YouTube embeds |
| Video | In scope | |
| Fotogalerij | In scope | On the homepage; a fuller gallery page if content warrants |
| Agenda | In scope | List, map with locations, archive of past shows |
| Contact / boeking | In scope | Single form, see below |
| Nieuwsbrief | In scope | Sign-up strip |
| Social links | In scope | Instagram prominent — an explicit wish |
| Language switch NL/EN | In scope | Routed, not client state |

**Not building:** news or blog (voted down), webshop (deferred until after launch), a separate press/EPK page (replaced by a downloadable PDF on the booking page containing bio, photos, technical rider and stage plan).

**No ticket links for now.** The first year of shows is free, so the design's `tickets` status exists but will mostly be unused at launch. Keep the status model — it is already built into the design.

## Booking form

One form. At the top, a choice between **Boeking** and **Algemene vraag**; choosing Boeking expands the booking fields. This is a compromise between one member who wanted a single simple form and another who wanted a separate, more serious booking form.

Booking fields, all from the most detailed questionnaire answer:

1. Datum
2. Locatie
3. Tijd
4. Speelduur
5. Type event
6. Budget
7. Grootte van de ruimte
8. Parkeergelegenheid
9. Backstage / veilige opslag aanwezig
10. PA aanwezig of in te huren
11. Captcha

Plus a confirmation mail to the sender. Submissions go to `boeking@staticline.nl`, which forwards to two band members so they can confer in their group chat.

Eleven fields in one column will scare people off. Group them.

## Band portal (login only)

| Feature | Notes |
| --- | --- |
| CMS for public content | Website is the source of truth for this |
| Bandinformatie | Contact details, contracts, technical rider |
| Ideeënbeheer | Including a separate category for songs currently being worked on — a specific request |
| Setlijsten | Reorderable, must work on a phone |
| Riders | Technical and hospitality |
| Podiumplannen / stageplots | With PDF export for venues |
| Interne agenda | Rehearsals, gigs, deadlines |
| Takenlijst | Per band member |

**Not building:** finances, internal chat, file sharing. One member wanted these; the other two did not. WhatsApp and a separate finance app stay in use. This keeps a tight timeline achievable.

The portal is used on a phone, backstage, in the dark, shortly before going on. Setlists and stage plans have to be readable in that situation.

## Roles

Not everyone gets the same rights (2 of 3 votes).

- **admin** — Harm. Everything, including the CMS and write access to shared data. The other members named him for this explicitly.
- **member** — read, tick off own tasks, add ideas.

External people (manager, booker, sound engineer) get no access for now, but build the role structure so it can be granted later without rework.

## Two decisions that overrule the majority

Both are Harm's calls, made knowingly. They are recorded here so nobody has to reconstruct the reasoning later.

1. **Editing from both sides.** Two members voted for the Band App being the sole leading system with the website read-only. Harm overruled this: he was made administrator, and administration with read-only access is not administration. There is still no second source of truth — see `docs/04-band-app-integration.md`.

2. **Phasing.** Harm preferred everything to go live at once; the other two had no objection to phasing. With the timeline available, the public site ships first and the portal follows if needed.

## Open content items

- Band bio — not written
- Photography — not delivered; five images specified with duotone treatment
- Stage layout — to be worked out at a rehearsal, which then determines the stage plan format
- Sticker and QR artwork — print deadline is late October, ahead of the site launch
- A fourth questionnaire response never arrived

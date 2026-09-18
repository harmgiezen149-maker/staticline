# 06 — Open questions

Things that are genuinely undecided. Each one blocks something, so raise it rather than guessing.

## Blocking a build phase

| Question | Blocks | Notes |
| --- | --- | --- |
| What database does the Band App actually use? | Phase 4 onward | The whole shared-database plan assumes Postgres. If it is not, the architecture needs revisiting before anything is built on it. |
| Does the Band App have a user table, and how does it authenticate? | Phase 4 | Extend it rather than creating a second one. |
| Mobile navigation panel | Phase 1 completion | Not designed. The handoff explicitly says to ask rather than improvise. |
| Portal screens | Phase 5 | Nothing designed. Either a design pass or a documented extrapolation. |

## Blocking launch

| Question | Notes |
| --- | --- |
| Band bio | Not written, in either language. |
| Photography | Five images specified with a duotone treatment, none delivered. Placeholders are in the reference. |
| Real show data | Only Doornroosje, Nijmegen, 10-11-2026 20:30 is confirmed. The other four in the design are placeholder. |
| Stage layout | To be worked out at a rehearsal; determines what the stage plan document looks like. |

## Content check

The hero subtitle reads "Drie man, geen omweg" — a three-piece. Four people were sent the questionnaire and three responded. Confirm the line-up before this goes live, and make sure it matches the band members page.

## Deferred, not open

These are decided. They are listed so nobody reopens them mid-build.

- Webshop — after launch, not at it. Note it moves Vercel to a paid plan.
- News or blog — voted down.
- Separate press/EPK page — replaced by a PDF on the booking page.
- Finances, internal chat, file sharing in the portal — out. WhatsApp and a separate app stay in use.
- Light theme — does not exist, is not planned.
- External access to the portal — not now, but the role structure should allow it later without rework.

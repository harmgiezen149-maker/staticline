# 04 — Band App integration

The Band App is an existing application the band built themselves with Claude Code. It is not in this repo. This document explains how the website relates to it and what you must not do to it.

## The arrangement

**One shared Postgres database. Both applications read and write. No synchronisation layer.**

The brief the band agreed on said the portal must be "100% integrated" with the Band App. The way to deliver that is not to build synchronisation between two databases — it is to have one database. With a single store there is no second source of truth, so conflicting data cannot arise. A sync layer would have created precisely the duplicate-entry and conflict problems the band wanted to prevent.

## Before writing any code

Inspect the Band App first:

1. What database does it actually use? This plan assumes Postgres. If it is something else, that decision needs revisiting before anything is built on top of it.
2. What tables exist, and what do shows, setlists, ideas and users look like in them?
3. Is there a migration tool, and what state is it in?
4. Does it have a user table, and how does it authenticate?

Only then map `docs/03-data-model.md` onto what is really there. That document is a proposal; the existing schema is the fact.

## Rules for shared tables

- **Additive migrations only.** A column you add is safe. A column you rename or drop breaks a running application the band uses at rehearsals.
- **Never rename or drop** an existing column or table without an explicit decision and a coordinated change in the Band App.
- **Both applications must tolerate rows they did not create.** The website will write shows the Band App has never seen, and the reverse.
- **Timestamps in UTC**, formatted at render time. Two applications formatting dates differently is a bug the band will notice on a show page.
- Every shared table carries `updatedAt` and `updatedBy`, and the portal surfaces them.

## Why the audit trail is not optional

Two of three band members voted for the Band App being the only system allowed to write, with the website read-only. That was overruled, deliberately, by the administrator — because administering a site you cannot edit is not administration.

The audit trail is what makes the override reasonable rather than high-handed. If a setlist changes, the person who did not change it can see who did and when. Build it early, not as a later refinement.

## Minimum shared scope

Three things must be shared from day one, because all three members named them:

- **Agenda / shows**
- **Setlists**
- **Ideas**

Riders, stage plans, tasks and band information can follow. Public CMS content is never shared — it belongs to the website.

## What stays out

The band decided against building finances, internal chat and file sharing. Those stay in WhatsApp and a separate finance app. Do not add tables for them, even speculatively.

# 03 — Data model

A starting point, not a finished schema. The Band App's existing tables take precedence: where this document and the real schema disagree, the real schema wins and this document gets updated. Inspect the Band App before creating anything.

## Ownership

| Data | Owner | Written by |
| --- | --- | --- |
| Shows / agenda | Shared | Website and Band App |
| Setlists | Shared | Website and Band App |
| Ideas | Shared | Website and Band App |
| Riders, stage plans | Shared | Website and Band App |
| Tasks | Shared | Website and Band App |
| Band information | Shared | Website and Band App |
| Public page content | Website | Website only |
| Photos, bio, embeds | Website | Website only |
| Booking submissions | Website | Website only |
| Newsletter subscribers | Website | Website only |

Anything marked Shared already exists in some form in the Band App. Do not create a parallel table for it.

## Shows

Drives both the public agenda and the portal calendar. Field names follow the design handoff where it specified them.

| Field | Notes |
| --- | --- |
| `id` | |
| `date` | Timestamp. The design renders `dateNl` and `dateEn` — format at render time, do not store two strings |
| `time` | Doors and stage time; the design shows "20:30" and a note "Deuren 20:00, wij om 21:15" |
| `venue` | "Doornroosje" |
| `city` | "Nijmegen" |
| `status` | `release` \| `tickets` \| `announced` \| `soldout` — exactly these four, they map to colours and labels in the design |
| `ticketUrl` | Nullable. Row is only clickable for `release` and `tickets` |
| `note` | Short line under the venue in the next-show bar |
| `lat`, `lng` | For the agenda map |
| `isPublic` | Rehearsals and internal dates live here too but must not reach the public site |

Public agenda shows future shows sorted by date, plus an archive of past ones. The next-show bar takes the first future show. On mobile the list shows three shows and links to the full agenda.

`isPublic` matters: the portal calendar holds rehearsals and deadlines. Never join the public query without filtering it.

## Setlists

| Field | Notes |
| --- | --- |
| `id`, `name` | |
| `showId` | Nullable — a setlist can exist before it is assigned |
| `items` | Ordered. Reordering must work on a phone, so store an explicit order value rather than relying on insertion order |

## Ideas

| Field | Notes |
| --- | --- |
| `id`, `title`, `body` | Lyrics, notes, links to demos |
| `category` | Must include a distinct "in progress" category for songs being worked on — an explicit request |
| `createdBy`, `createdAt` | |

## Riders and stage plans

| Field | Notes |
| --- | --- |
| `type` | `technical` \| `hospitality` \| `stageplot` |
| `content` | Structured where possible; the technical rider becomes a downloadable PDF on the booking page |
| `updatedAt`, `updatedBy` | |

The public PDF is generated from this, so venues always get the current version rather than an attachment someone emailed in 2026.

## Tasks

`id`, `title`, `assignedTo`, `done`, `dueDate`. Per band member.

## Users

Four known users. `id`, `name`, `email`, `role` (`admin` | `member`). If the Band App already has a user table, extend it rather than creating a second one — two user tables across one shared database is the one thing guaranteed to cause pain later.

## Audit trail

Every shared table carries `updatedAt` and `updatedBy`, and the portal shows them.

This is not bookkeeping for its own sake. Two band members wanted the Band App to be the only system that writes; that was overruled. Showing who changed what and when is what makes the two-way arrangement acceptable to them — nobody gets ambushed by a change from the other side.

## Website-only tables

- `booking_submissions` — the eleven fields from `docs/01-scope.md`, plus type (booking or general question), timestamp and handled flag. Store them rather than only emailing; email gets lost.
- `newsletter_subscribers` — email, timestamp, confirmed.
- Page content for the CMS — shape depends on how much editing the band actually needs. Start narrow.

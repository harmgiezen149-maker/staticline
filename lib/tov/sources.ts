import "server-only";

import { getCopy } from "@/content";
import { fetchBandAppPublic } from "@/lib/band-app";
import { formatShowDateLong, formatTime } from "@/lib/i18n";
import { type Show, getShows } from "@/lib/shows";
import { getSocials, getText } from "@/lib/site-content";

import { BAND_FACTS, type SubjectKind, type TextType } from "./config";
import {
  type FactMember,
  type FactShow,
  type FactSources,
  type Factsheet,
  type SourceKey,
  type SourceOptions,
  buildFactsheet,
} from "./factsheet";

/**
 * De bronnen ophalen en er een feitenblad van maken.
 *
 * Dit is de serverkant van lib/tov/factsheet.ts: die bouwt het blok, deze haalt
 * op wat erin gaat. De splitsing zit er omdat `npm test` op kaal Node draait en
 * `@/`-imports daar niet oplost — dezelfde reden als bij booking-status.ts en
 * translation-keys.ts.
 *
 * **De datums worden hier opgemaakt en nergens anders.** De Band App bewaart de
 * kloktijd van de band als UTC-onderdelen, bewust zonder zomertijd: 20:00 staat
 * als `20:00Z` en betekent 20:00 op de klok in de zaal. De helpers in lib/i18n.ts
 * formatteren op UTC. Doe dit niet met `toLocaleString` en een tijdzone erbij —
 * dan staat elke show een uur verkeerd in het feitenblad, en het feitenblad is
 * precies wat het model als waarheid aanneemt.
 */



/** Eén show, met de datum al op UTC opgemaakt. Zie de kop van dit bestand. */
function toFactShow(show: Show): FactShow {
  const tijd = formatTime(show.date);
  return {
    id: show.id,
    when: [formatShowDateLong(show.date, "nl"), tijd].filter(Boolean).join(" · "),
    venue: show.venue,
    city: show.city,
    status: show.status,
    ticketUrl: show.ticketUrl,
    note: show.note,
  };
}

function showLabel(show: FactShow): string {
  return [show.when, [show.venue, show.city].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");
}

function toFactMember(lid: {
  id: number;
  name: string;
  role: string;
  instrument: string;
  bio: string;
}): FactMember {
  return {
    id: lid.id,
    name: lid.name,
    role: lid.role,
    instrument: lid.instrument,
    bio: lid.bio,
  };
}

/** De keuzelijsten voor het scherm. */
export async function loadSourceOptions(): Promise<SourceOptions> {
  const [data, agenda] = await Promise.all([fetchBandAppPublic(), getShows()]);

  return {
    available: !!data && agenda.available,
    members: (data?.members ?? []).map((lid) => ({
      id: lid.id,
      label: [lid.name, lid.role || lid.instrument].filter(Boolean).join(" — "),
    })),
    upcoming: agenda.upcoming.map((show) => ({
      id: show.id,
      label: showLabel(toFactShow(show)),
    })),
    past: agenda.past.map((show) => ({
      id: show.id,
      label: showLabel(toFactShow(show)),
    })),
  };
}

export type BuildInput = {
  type: TextType;
  keys: SourceKey[];
  subjectId: number | null;
  notes: string;
};

export type BuiltSources = {
  sheet: Factsheet;
  /** False als het gekozen lid of de gekozen show niet meer bestaat. */
  subjectFound: boolean;
};

/**
 * Het feitenblad voor één opdracht.
 *
 * Alleen wat aangevinkt is komt erin. Dat is geen zuinigheid maar de controle:
 * `checkOutput` rekent de uitvoer af tegen dit blok, dus alles wat erin staat
 * mag het model zeggen. Zie de kop van lib/tov/factsheet.ts.
 */
export async function buildSources({
  type,
  keys,
  subjectId,
  notes,
}: BuildInput): Promise<BuiltSources> {
  const aan = (key: SourceKey) => keys.includes(key);

  // Alleen ophalen wat aangevinkt is. De Band App levert band, leden, agenda en
  // setlist in één antwoord, dus dat is hooguit één aanroep; de sitetekst en de
  // socials komen uit de eigen database en zijn dat alleen waard als iemand ze
  // ook vraagt.
  const wilBandApp =
    aan("band") ||
    aan("members") ||
    aan("upcoming") ||
    aan("past") ||
    aan("setlist") ||
    type.subject !== "none";

  const [data, agenda, siteRegels, socials] = await Promise.all([
    wilBandApp ? fetchBandAppPublic() : Promise.resolve(null),
    wilBandApp ? getShows() : Promise.resolve(null),
    aan("site") ? siteLines() : Promise.resolve([]),
    aan("socials") ? socialLines() : Promise.resolve([]),
  ]);

  const leden: FactMember[] = (data?.members ?? []).map(toFactMember);
  const komend = (agenda?.upcoming ?? []).map(toFactShow);
  const gespeeld = (agenda?.past ?? []).map(toFactShow);

  const sources: FactSources = {
    band: aan("band")
      ? {
          name: data?.band.name || BAND_FACTS.name,
          bio: data?.band.bio || "",
          city: BAND_FACTS.city,
        }
      : undefined,
    members: aan("members") ? leden : undefined,
    upcoming: aan("upcoming") ? komend : undefined,
    past: aan("past") ? gespeeld : undefined,
    setlist: aan("setlist") ? (data?.setlist ?? []) : undefined,
    site: aan("site") ? siteRegels : undefined,
    socials: aan("socials") ? socials : undefined,
    notes,
  };

  // Het onderwerp: één lid of één show, uitgelicht bovenaan. Staat hij er niet
  // (verwijderd, of een id uit een scherm dat al even open stond), dan zegt
  // `subjectFound` dat. Stilzwijgend zonder onderwerp schrijven is precies hoe
  // je een verkeerde datum in een aankondiging krijgt.
  let subjectFound = true;

  if (type.subject !== "none" && subjectId !== null) {
    const gevonden = findSubject(type.subject, subjectId, leden, komend, gespeeld);
    if (gevonden) sources.subject = gevonden;
    else subjectFound = false;
  }

  return { sheet: buildFactsheet(sources), subjectFound };
}

function findSubject(
  kind: SubjectKind,
  id: number,
  leden: FactMember[],
  komend: FactShow[],
  gespeeld: FactShow[],
): { label: string; lines: string[] } | null {
  if (kind === "member") {
    const lid = leden.find((l) => l.id === id);
    if (!lid) return null;

    return {
      label: "Lid",
      lines: [
        `naam: ${lid.name}`,
        lid.role ? `rol: ${lid.role}` : "",
        lid.instrument ? `instrument: ${lid.instrument}` : "",
        lid.bio ? `wat er nu over hem staat: ${lid.bio}` : "",
      ].filter(Boolean),
    };
  }

  const show = (kind === "gig" ? komend : gespeeld).find((s) => s.id === id);
  if (!show) return null;

  return {
    label: kind === "gig" ? "Show" : "Gespeelde show",
    lines: [
      `wanneer: ${show.when}`,
      `waar: ${[show.venue, show.city].filter(Boolean).join(", ")}`,
      show.status ? `status: ${show.status}` : "",
      show.note ? `notitie: ${show.note}` : "",
      show.ticketUrl ? `kaartjes: ${show.ticketUrl}` : "",
    ].filter(Boolean),
  };
}

/**
 * De teksten die op de site staan.
 *
 * Via `getText`, zodat een tekst die in `/beheer/inhoud` is aangepast hier
 * hetzelfde is als op de pagina zelf. Nederlands: de module schrijft beide talen
 * rechtstreeks uit de bron, en de Nederlandse tekst is het origineel.
 */
async function siteLines(): Promise<{ label: string; text: string }[]> {
  const copy = getCopy("nl");

  const regels = await Promise.all([
    getText("hero.sub", "nl", copy.hero.sub).then((text) => ({
      label: "regel onder het wordmark",
      text,
    })),
    getText("footer.note", "nl", copy.footer.note).then((text) => ({
      label: "voettekst",
      text,
    })),
  ]);

  return regels.filter((regel) => regel.text.trim().length > 0);
}

async function socialLines(): Promise<{ label: string; url: string }[]> {
  const socials = await getSocials();

  return Object.entries(socials)
    .filter(([, url]) => typeof url === "string" && url.trim().length > 0)
    .map(([naam, url]) => ({ label: naam, url: String(url) }));
}

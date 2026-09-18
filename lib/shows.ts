import "server-only";

import { fetchBandAppPublic, type BandAppGig } from "./band-app";

/**
 * Het showmodel zoals het ontwerp het nodig heeft.
 *
 * De design-handoff vraagt om zaalnaam en plaats apart, een status met vier
 * waarden, een ticketlink en een noot onder de zaalnaam. De Band App heeft die
 * velden nog niet — daar is een agenda-item een titel met een losse subregel.
 * Zolang de uitbreiding van band-app niet gemerged is, leidt deze module af wat
 * het kan en zet het de rest op een veilige standaardwaarde.
 *
 * Zodra de velden er wél zijn, komen ze mee in het antwoord van /api/public en
 * neemt `toShow()` ze over zonder dat hier verder iets hoeft te veranderen.
 */
export type ShowStatus = "release" | "tickets" | "announced" | "soldout";

export type Show = {
  id: number;
  /** ISO-tijdstempel. Kloktijd van de band, als UTC bewaard — zie lib/i18n.ts. */
  date: string;
  venue: string;
  city: string;
  status: ShowStatus;
  ticketUrl: string | null;
  /** Korte regel onder de zaalnaam in de volgende-show-balk. */
  note: string;
  /** Voor de kaart op de agendapagina. Null als er geen coördinaten bekend zijn. */
  lat: number | null;
  lng: number | null;
};

/** Alleen bij deze twee statussen is de rij aanklikbaar — uit de design-handoff. */
export function isClickable(show: Show): show is Show & { ticketUrl: string } {
  return (
    (show.status === "release" || show.status === "tickets") && !!show.ticketUrl
  );
}

const STATUSES: ShowStatus[] = ["release", "tickets", "announced", "soldout"];

function readStatus(value: unknown): ShowStatus {
  return typeof value === "string" && (STATUSES as string[]).includes(value)
    ? (value as ShowStatus)
    : // Aangekondigd is de veilige standaard: geen link, geen belofte over
      // tickets die er niet zijn. Het eerste jaar aan shows is gratis, dus
      // `tickets` blijft voorlopig toch grotendeels ongebruikt.
      "announced";
}

/**
 * Zaalnaam en plaats uit een titel halen.
 *
 * De Band App kent één titelveld. Waar iemand "Doornroosje, Nijmegen" heeft
 * ingevuld, levert dat netjes twee delen op. Waar dat niet zo is, blijft de hele
 * titel de zaalnaam staan en blijft de plaats leeg — het ontwerp laat die cel dan
 * gewoon leeg, wat beter is dan een gokje dat er zelfverzekerd naast zit.
 */
function splitVenue(title: string): { venue: string; city: string } {
  const [venue, ...rest] = title.split(",");
  return {
    venue: venue.trim() || title.trim(),
    city: rest.join(",").trim(),
  };
}

/**
 * De velden die de Band App erbij levert zodra de uitbreiding daar gemerged is.
 *
 * Allemaal optioneel, zodat deze site het doet met of zonder. Zolang ze er niet
 * zijn, leidt `toShow()` zaal en plaats af uit de titel en staat de status op
 * "aangekondigd".
 */
type MaybeExtended = BandAppGig & {
  venue?: string;
  city?: string;
  status?: string;
  ticketUrl?: string | null;
  note?: string;
  lat?: number | null;
  lng?: number | null;
};

function toShow(gig: MaybeExtended): Show | null {
  // Zonder datum valt er niets te sorteren en niets te tonen. De Band App zet
  // items zonder datum eenmalig om (lib/events.js daar), dus dit hoort zeldzaam
  // te zijn; overslaan is beter dan een lege regel in de agenda.
  if (!gig.date) return null;

  const derived = splitVenue(gig.title);

  return {
    id: gig.id,
    date: gig.date,
    venue: gig.venue?.trim() || derived.venue,
    city: gig.city?.trim() || derived.city,
    status: readStatus(gig.status),
    ticketUrl: gig.ticketUrl || null,
    lat: gig.lat ?? null,
    lng: gig.lng ?? null,
    note: gig.note?.trim() || "",
  };
}

export type ShowsResult = {
  /** Komende shows, oplopend op datum. */
  upcoming: Show[];
  /** De eerstvolgende show, of null als de agenda leeg is. */
  next: Show | null;
  /** Of de band al eerder gespeeld heeft. Bepaalt of de kicker "eerste" of "volgende" zegt. */
  hasPlayed: boolean;
  /** Of de Band App bereikbaar was. Bij false toont de site geen agenda in plaats van een verkeerde. */
  available: boolean;
};

/**
 * De agenda voor de publieke site.
 *
 * Repetities en interne data komen hier nooit langs: /api/public van de Band App
 * filtert zelf al op `type: "gig"`. Dat is geen toeval maar het ontwerp van die
 * route, en het is de reden dat de website geen eigen filter op zoiets als
 * `isPublic` hoeft te onderhouden — één filter op één plek.
 */
export async function getShows(): Promise<ShowsResult> {
  const data = await fetchBandAppPublic();

  if (!data) {
    return { upcoming: [], next: null, hasPlayed: false, available: false };
  }

  const upcoming = data.gigs
    .map(toShow)
    .filter((show): show is Show => show !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    upcoming,
    next: upcoming[0] ?? null,
    hasPlayed: data.pastGigs.length > 0,
    available: true,
  };
}

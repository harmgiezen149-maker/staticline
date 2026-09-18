import "server-only";

/**
 * De koppeling met de Band App.
 *
 * De Band App is de bron voor alles wat de band zelf bijhoudt: agenda, leden,
 * setlist. Die app heeft daar een publieke route voor die precies hiervoor
 * gebouwd is — zie app/api/public/route.js in harmgiezen149-maker/band-app, waar
 * in de code letterlijk staat dat de website van de band hem mag gebruiken.
 *
 * Waarom via de API en niet rechtstreeks in de database:
 *
 * 1. De Band App draait bij elke deploy `prisma db push` tegen zijn eigen
 *    productiedatabase, bewust zonder --accept-data-loss (scripts/vercel-build.mjs).
 *    Tabellen die deze site daar zou aanmaken, staan niet in het schema van de
 *    Band App; die build valt er dan over om.
 * 2. De Band App houdt afgeleide velden zelf bij — Event.mon/day/time naast
 *    startsAt, de volgorde binnen een setlist-sectie, de kanaalnummering van de
 *    inputlijst. Een tweede applicatie die er met een eigen ORM in schrijft,
 *    breekt die stil.
 *
 * Wat deze site zelf bezit — boekingen, nieuwsbriefabonnees, pagina-inhoud —
 * staat in een eigen database en komt hier niet langs.
 */

/** Eén lid zoals de Band App het publiek maakt. Geen e-mail, telefoon of adres. */
export type BandAppMember = {
  id: number;
  name: string;
  role: string;
  instrument: string;
  bio: string;
  photoUrl: string | null;
};

/** Eén agenda-item. `date` is ISO; zie lib/i18n.ts over de tijdzone. */
export type BandAppGig = {
  id: number;
  mon: string;
  day: string;
  time?: string;
  title: string;
  date: string | null;
};

export type BandAppPublic = {
  band: { name: string; bio: string; logoUrl: string };
  members: BandAppMember[];
  gigs: BandAppGig[];
  setlistSections: { name: string; songs: { title: string; artist: string }[] }[];
  setlist: { title: string; artist: string }[];
  pastGigs: BandAppGig[];
  updatedAt: string;
};

const BASE_URL = (
  process.env.BAND_APP_URL || "https://static-line-bandapp.vercel.app"
).replace(/\/$/, "");

/**
 * Hoe lang een antwoord hergebruikt mag worden.
 *
 * De Band App zet er zelf `max-age=60` op. Vijf minuten is ruim genoeg voor een
 * agenda die een paar keer per maand verandert, en het scheelt de Band App werk
 * als er na een show veel mensen tegelijk de QR-sticker scannen. Een wijziging in
 * de app is daarmee binnen vijf minuten op de site te zien.
 */
const REVALIDATE_SECONDS = 300;

/**
 * De publieke gegevens van de band ophalen.
 *
 * Geeft `null` als de Band App niet bereikbaar is of iets onverwachts teruggeeft.
 * Bewust geen exception: de homepage hoort te blijven staan als de agenda even
 * niet opgehaald kan worden. Wie hem aanroept, beslist wat er dan te zien is.
 */
export async function fetchBandAppPublic(): Promise<BandAppPublic | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/public`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["band-app"] },
    });

    if (!res.ok) {
      console.error(`[band-app] /api/public gaf ${res.status}`);
      return null;
    }

    const data = (await res.json()) as BandAppPublic;

    // Minimale controle dat we het juiste terugkrijgen. De route geeft bij een
    // lege installatie `{ error: "no-band" }` met status 404, maar een proxy of
    // een inlogpagina ervoor kan met status 200 iets heel anders teruggeven.
    if (!data || typeof data !== "object" || !Array.isArray(data.gigs)) {
      console.error("[band-app] /api/public gaf een onverwachte vorm");
      return null;
    }

    return data;
  } catch (error) {
    console.error("[band-app] /api/public niet bereikbaar:", error);
    return null;
  }
}

/**
 * De deelbare link naar de technische rider en het podiumplan.
 *
 * De Band App heeft daar een pagina voor op `/rider/<token>`, met de bezetting,
 * de plattegrond, de inputlijst en de tekst van de band, en een afdrukknop
 * waarmee een zaal er een pdf van maakt. Precies wat docs/01-scope.md als
 * downloadbare rider op de boekingspagina beschrijft — en altijd de actuele
 * versie, in plaats van een bijlage die iemand ooit gemaild heeft.
 *
 * Die sleutel is niet op te halen met een publieke aanroep: in de Band App zit hij
 * achter een inlog, want wie de link heeft mag de rider lezen. Hij hoort dus als
 * omgevingsvariabele ingesteld te worden:
 *
 *   BAND_APP_RIDER_URL="https://static-line-bandapp.vercel.app/rider/<token>"
 *
 * In de Band App staat die link onderaan het riderscherm. Wordt hij daar
 * vernieuwd, dan moet deze variabele mee. Zolang hij leeg is, zegt de
 * boekingspagina eerlijk dat de rider op aanvraag is.
 */
export async function getRiderUrl(): Promise<string | null> {
  const url = process.env.BAND_APP_RIDER_URL?.trim();
  if (!url) return null;
  // Alleen http(s): deze waarde komt in een `href` op een publieke pagina.
  return /^https?:\/\//i.test(url) ? url : null;
}

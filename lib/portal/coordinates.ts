/**
 * Coördinaten uit wat iemand plakt.
 *
 * De kaart op de agendapagina heeft een breedte- en lengtegraad per show nodig.
 * Die kent niemand uit zijn hoofd, en ze overtypen uit een adresbalk is precies
 * het soort werk waar een cijfer bij omdraait.
 *
 * Wat mensen wél hebben is een kaartlink. Die zoeken ze op, kopiëren ze, en
 * plakken ze hier. De vormen hieronder dekken wat Google Maps en OpenStreetMap
 * in de adresbalk zetten, plus twee getallen met een komma ertussen voor wie ze
 * toevallig al heeft.
 *
 * Zonder server-only, want het formulier gebruikt dit in de browser om de velden
 * meteen te vullen.
 */

export type Coordinates = { lat: number; lng: number };

/**
 * Een verkorte link bevat de coördinaten niet.
 *
 * `maps.app.goo.gl/xyz` en `goo.gl/maps/xyz` zijn verwijzingen; waar ze heen
 * gaan weet alleen Google. Dat is iets anders dan een link die we niet snappen,
 * en het verdient een eigen melding — anders zit iemand te zoeken naar een
 * typefout die er niet is.
 */
export function isShortLink(value: string): boolean {
  return /(^|\/\/|\.)(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(value.trim());
}

/** Binnen bereik: anders liever geen speld dan een speld op de verkeerde plek. */
const inRange = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

const make = (lat: number, lng: number): Coordinates | null =>
  inRange(lat, lng) ? { lat, lng } : null;

export function parseCoordinates(value: string): Coordinates | null {
  const input = value.trim();
  if (!input) return null;

  // Google Maps zet bij een plaats zowel het middelpunt van de kaart (`@`) als
  // de plaats zelf (`!3d` en `!4d`) in de link. De tweede is wat je bedoelt:
  // het middelpunt verschuift zodra je de kaart versleept.
  const place = input.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place) return make(Number(place[1]), Number(place[2]));

  const centre = input.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (centre) return make(Number(centre[1]), Number(centre[2]));

  // OpenStreetMap: #map=17/51.9692/5.6654
  const osm = input.match(/#map=\d+(?:\.\d+)?\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
  if (osm) return make(Number(osm[1]), Number(osm[2]));

  // ?q=51.9692,5.6654 — ook ?query= en ?ll= komen voor.
  const query = input.match(
    /[?&](?:q|query|ll|daddr)=(-?\d+(?:\.\d+)?)%2C\s*(-?\d+(?:\.\d+)?)|[?&](?:q|query|ll|daddr)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  );
  if (query) {
    const lat = query[1] ?? query[3];
    const lng = query[2] ?? query[4];
    return make(Number(lat), Number(lng));
  }

  // Twee kale getallen. Alleen als er verder niets in de tekst staat, anders
  // pikt dit zomaar twee cijfers uit een adres.
  const bare = input.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (bare) return make(Number(bare[1]), Number(bare[2]));

  return null;
}

/** Afronden op vijf decimalen: ongeveer een meter, en dat is ruim genoeg. */
export const roundCoordinate = (value: number) => Math.round(value * 1e5) / 1e5;

import type { Photo } from "@/components/PhotoGrid";

/**
 * Alles wat de band nog moet aanleveren, op één plek.
 *
 * De pagina's die dit gebruiken zijn af; ze tonen alleen een eerlijke lege staat
 * zolang hier niets staat. Iets toevoegen is dus een kwestie van een regel in dit
 * bestand, zonder dat er een component aangeraakt hoeft te worden.
 *
 * Wat er nog ontbreekt staat ook in docs/06-open-questions.md.
 */

/**
 * De vijf beelden uit de design-handoff, met een duotone-behandeling op de
 * merkkleuren: (1) live shot staand — duotone rood, (2) bandportret,
 * (3) crowd — duotone teal, (4) backstage, (5) gitaardetail.
 *
 * Zet de bestanden in `public/photos/` en vul ze hier in. Zolang deze lijst leeg
 * is, tonen de fotosecties de benoemde placeholders uit het ontwerp.
 */
export const photos: Photo[] = [];

/**
 * De Spotify-embed van de band.
 *
 * Een artiest-, album- of playlist-id. Te vinden in de deellink:
 * `https://open.spotify.com/artist/<id>`. Leeg = de Spotify-sectie blijft weg.
 *
 * Let op: dit is een embed van Spotify zelf. Die zet cookies zodra hij laadt, dus
 * hij wordt pas ingeladen nadat de bezoeker erop klikt — zie components/Embed.tsx.
 */
export const spotify: { type: "artist" | "album" | "playlist"; id: string } | null =
  null;

/**
 * Video's, nieuwste eerst. `id` is het YouTube-id uit de link
 * (`https://www.youtube.com/watch?v=<id>`).
 *
 * Ook deze laden pas na een klik: een automatisch ingeladen YouTube-embed haalt
 * honderden kilobytes en een reeks cookies binnen voor iemand die misschien
 * alleen de agenda kwam bekijken.
 */
export const videos: { id: string; title: string }[] = [];

/**
 * Sociale kanalen. Instagram staat vooraan — dat was een expliciete wens uit de
 * vragenlijst. Leeg laten wat er niet is; de link verschijnt dan niet.
 */
export const socials: {
  instagram?: string;
  youtube?: string;
  spotify?: string;
  facebook?: string;
} = {};

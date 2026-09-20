/**
 * Wat er in het Spotify-veld geplakt wordt, omzetten naar een embed.
 *
 * Het veld vroeg om "het stuk achter de laatste schuine streep in de deellink".
 * Dat is precies de instructie die niemand opvolgt: je plakt de link die je net
 * gekopieerd hebt. Die belandde dan ongewijzigd in het adres van de embed, en
 * Spotify antwoordde met "Page not found" — op de publieke muziekpagina.
 *
 * Dus niet het veld uitleggen maar de invoer lezen. Dezelfde keuze als bij de
 * coördinaten: mensen plakken wat ze hebben.
 *
 * Zonder imports en zonder `server-only`, zodat `npm test` dit kan draaien.
 */

export const SPOTIFY_TYPES = ["artist", "album", "playlist", "track", "show", "episode"] as const;
export type SpotifyType = (typeof SPOTIFY_TYPES)[number];

export type SpotifyRef = { type: SpotifyType; id: string };

const isType = (value: string): value is SpotifyType =>
  (SPOTIFY_TYPES as readonly string[]).includes(value);

/**
 * Een id van Spotify: tweeëntwintig tekens uit het base62-alfabet.
 *
 * De lengte staat er bewust in. Zonder die grens zou elk los woord als geldig id
 * doorgaan, en dan krijg je een embed die niet laadt in plaats van een veld
 * waarvan je ziet dat het fout is.
 */
const ID = /^[A-Za-z0-9]{22}$/;

export function parseSpotify(value: string, fallbackType?: string): SpotifyRef | null {
  const input = String(value ?? "").trim();
  if (!input) return null;

  // spotify:artist:3WrFJ7ztbogyGnTHbHJFl2
  const uri = input.match(/^spotify:([a-z]+):([A-Za-z0-9]{22})$/);
  if (uri && isType(uri[1])) return { type: uri[1], id: uri[2] };

  /**
   * Een gewone deellink. `intl-nl` staat er sinds Spotify de taal in het pad
   * zet — zonder dat stuk in het patroon lukt precies de link die een
   * Nederlandse bezoeker kopieert niet.
   *
   * Alles achter een `?` valt vanzelf buiten de treffer, dus de `si=`-sleutel
   * die Spotify erbij plakt hoeft niet apart weggehaald te worden.
   */
  const link = input.match(
    /open\.spotify\.com\/(?:intl-[a-z-]+\/)?([a-z]+)\/([A-Za-z0-9]{22})/,
  );
  if (link && isType(link[1])) return { type: link[1], id: link[2] };

  // Een kaal id. Het soort komt dan uit het veld ernaast; staat daar niets
  // bruikbaars, dan is het een artiest — verreweg het gewone geval.
  if (ID.test(input)) {
    const type = fallbackType && isType(fallbackType) ? fallbackType : "artist";
    return { type, id: input };
  }

  return null;
}

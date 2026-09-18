/**
 * Welke inhoud via /beheer aan te passen is.
 *
 * Zonder server-only, want het beheerformulier draait in de browser en de
 * publieke kant leest het op de server.
 *
 * Bewust een vaste lijst en geen vrij invulveld voor sleutels. Een typefout in
 * een sleutelnaam zou anders een tekst opleveren die nergens verschijnt, zonder
 * dat iemand ziet waarom.
 */

/** Een tekst die per taal verschilt. */
export type TextKey = {
  key: string;
  label: string;
  /** Waar het op de site staat, zodat je weet wat je aanpast. */
  where: string;
  /** Meerdere regels, of één. */
  long?: boolean;
};

export const TEXT_KEYS: TextKey[] = [
  {
    key: "hero.sub",
    label: "Ondertitel op de homepage",
    where: "Onder het logo, op een breed scherm",
    long: true,
  },
  {
    key: "hero.subShort",
    label: "Ondertitel, korte versie",
    where: "Onder het logo, op een telefoon",
  },
  {
    key: "footer.note",
    label: "Regel onderaan elke pagina",
    where: "De voettekst",
  },
];

/*
 * De omschrijving voor Google staat hier bewust niet bij. Die zit in de
 * `metadata`-export van de root layout, en dat is een waarde die bij de build
 * vastgelegd wordt. Er een databaseaanroep in zetten zou elke pagina van de site
 * dynamisch maken — een flinke prijs voor één regel tekst die één keer per jaar
 * verandert. Die past in content/nl.ts.
 */

/** Een instelling die niet van taal afhangt. */
export type SettingKey = {
  key: string;
  label: string;
  hint: string;
};

export const SOCIAL_KEYS: SettingKey[] = [
  {
    key: "social.instagram",
    label: "Instagram",
    hint: "https://instagram.com/…",
  },
  { key: "social.youtube", label: "YouTube", hint: "https://youtube.com/@…" },
  { key: "social.facebook", label: "Facebook", hint: "https://facebook.com/…" },
  {
    key: "social.spotify",
    label: "Spotify",
    hint: "https://open.spotify.com/artist/…",
  },
];

export const SPOTIFY_KEYS: SettingKey[] = [
  {
    key: "spotify.type",
    label: "Soort",
    hint: "artist, album of playlist",
  },
  {
    key: "spotify.id",
    label: "Id",
    hint: "Het stuk achter de laatste schuine streep in de deellink",
  },
];

/** De sleutel waaronder een waarde in de database staat. */
export const storageKey = (key: string, locale = "") => `${key}|${locale}`;

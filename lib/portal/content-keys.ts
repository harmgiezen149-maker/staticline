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

/**
 * De twee vaste beelden van de site.
 *
 * Het wordmark mag vervangen worden door een ander aangeleverd bestand — dat is
 * iets anders dan het hertekenen, herkleuren of uitrekken dat CLAUDE.md verbiedt.
 * Het bandlogo moest nog komen, en als het er is hoort het erin te kunnen zonder
 * dat er een commit aan te pas komt.
 *
 * Bij het wordmark worden ook de afmetingen bewaard. `next/image` heeft die
 * nodig om ruimte vrij te houden voordat het plaatje geladen is; zonder die twee
 * getallen springt de pagina op het moment dat het binnenkomt. Bij een bestand
 * uit de code komen ze uit de import, bij een geüpload bestand leest de browser
 * ze uit voordat hij uploadt.
 */
export const IMAGE_SLOTS = [
  {
    key: "image.wordmark",
    label: "Wordmark",
    where: "Het grote logo in de hero, op elke pagina bovenaan",
  },
  {
    key: "image.hero",
    label: "Achtergrond van de hero",
    where: "De foto achter het logo op de homepage",
  },
] as const;

export type ImageSlot = (typeof IMAGE_SLOTS)[number]["key"];

export function isImageSlot(value: unknown): value is ImageSlot {
  return IMAGE_SLOTS.some((slot) => slot.key === value);
}

/** De sleutel waaronder een waarde in de database staat. */
export const storageKey = (key: string, locale = "") => `${key}|${locale}`;

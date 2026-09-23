import { getCopy } from "@/content";

import { flattenCopy } from "@/lib/copy-paths";

/**
 * Alle teksten van de site, gegroepeerd voor het beheerscherm.
 *
 * De lijst komt uit content/nl.ts en wordt niet met de hand bijgehouden — zie
 * lib/copy-paths.ts. Wat hier wél met de hand staat, is de indeling: per groep
 * een Nederlandse naam en een regel over waar het staat. Zonder dat lees je op
 * dat scherm alleen puntpaden, en dan weet je nog niet wat je aanpast.
 *
 * Staat een groep hier niet bij, dan verschijnt hij onderaan met zijn eigen
 * naam. Dat is met opzet geen fout: een tekst die erbij komt hoort zichtbaar te
 * zijn, ook als niemand er een label bij gezet heeft.
 */

type GroupInfo = { label: string; where: string };

const GROUPS: Record<string, GroupInfo> = {
  hero: { label: "Hero", where: "Het blok met het logo, bovenaan de homepage" },
  nav: { label: "Menu", where: "De balk bovenaan elke pagina" },
  nextShow: { label: "Volgende show", where: "Het blok onder de hero" },
  shows: { label: "Shows", where: "De lijst met data op de homepage" },
  status: { label: "Status van een show", where: "Het label rechts van een datum" },
  photos: { label: "Fotoblok", where: "Op de homepage" },
  footer: { label: "Voettekst", where: "Onderaan elke pagina" },
  motion: {
    label: "Beweging",
    where: "De loader bij het eerste bezoek, de fotoviewer en de labels bij de muis",
  },
  agenda: { label: "Agenda", where: "De pagina /agenda" },
  band: { label: "Band", where: "De pagina /band" },
  music: { label: "Muziek", where: "De pagina /muziek" },
  video: { label: "Video", where: "De pagina /video" },
  gallery: { label: "Foto's", where: "De pagina /fotos" },
  booking: { label: "Boeken", where: "De pagina /boeken, inclusief het formulier" },
  newsletter: { label: "Nieuwsbrief", where: "De strook waar je je aanmeldt" },
  confirm: { label: "Aanmelding bevestigen", where: "De pagina uit de bevestigingsmail" },
  embed: { label: "Video en Spotify", where: "De knop over een embed die nog moet laden" },
  mail: { label: "Mails", where: "De bevestigingsmails aan bezoekers" },
};

export type CopyField = {
  /** Het puntpad, en meteen de sleutel in de database. */
  key: string;
  /** Het laatste stuk van het pad, als houvast in het formulier. */
  name: string;
  /** De tekst zoals die nu in de code staat. */
  code: string;
  /** Meer dan één regel? Dan een tekstvak in plaats van een invoerveld. */
  long: boolean;
};

export type CopyGroup = GroupInfo & { key: string; fields: CopyField[] };

/** Vanaf hoeveel tekens een tekst een tekstvak krijgt in plaats van één regel. */
const LONG = 90;

/**
 * De groepen, in de volgorde van GROUPS hierboven.
 *
 * Die volgorde is niet alfabetisch maar hoe je de site doorloopt: eerst wat er
 * op de homepage staat, dan de pagina's, dan wat er per mail uitgaat.
 */
export function copyGroups(): CopyGroup[] {
  const velden = flattenCopy(getCopy("nl"));

  const perGroep = new Map<string, CopyField[]>();
  for (const { path, text } of velden) {
    const [groep] = path.split(".");
    const lijst = perGroep.get(groep) ?? [];
    lijst.push({
      key: path,
      // Het pad zonder de groepsnaam ervoor: "fields.budget" in plaats van
      // "booking.fields.budget". Korter, en de groep staat er al boven.
      name: path.slice(groep.length + 1),
      code: text,
      long: text.length > LONG,
    });
    perGroep.set(groep, lijst);
  }

  const bekend = Object.keys(GROUPS).filter((key) => perGroep.has(key));
  const rest = [...perGroep.keys()].filter((key) => !(key in GROUPS));

  return [...bekend, ...rest].map((key) => ({
    key,
    label: GROUPS[key]?.label ?? key,
    where: GROUPS[key]?.where ?? "",
    fields: perGroep.get(key) ?? [],
  }));
}

/** Alle sleutels, plat. Voor het vertalen en voor het opslaan. */
export function copyKeys(): string[] {
  return flattenCopy(getCopy("nl")).map((row) => row.path);
}

/**
 * De mail waarin een nieuwe show aangekondigd wordt.
 *
 * Alleen het samenstellen, zonder versturen en zonder `server-only`, zodat
 * lib/announce-mail.test.ts het kan narekenen. Versturen gebeurt in
 * lib/announce.ts.
 *
 * Dezelfde soberheid als de bevestigingsmails (lib/mail-html.ts): platte regels,
 * geen afbeeldingen, geen opmaak. Een aankondiging die eruitziet als reclame
 * belandt eerder bij de spam, en wat erin moet staan past in een handvol regels:
 * wat, waar, wanneer, en waar de kaartjes zijn.
 *
 * Onderaan altijd de afmeldlink. Die is niet optioneel: de nieuwsbriefstrip
 * belooft "afmelden kan met één klik, in elke mail", en zonder zo'n link is
 * een mail aan een lijst adressen in Nederland niet toegestaan.
 */
import type { Copy } from "../content/types.ts";
import { formatShowDateLong, localePath, type Locale } from "./i18n.ts";
import type { Show } from "./shows.ts";

export type AnnouncementMail = { subject: string; lines: string[] };

/** De naam in het onderwerp: de naam van de avond, of anders zaal en plaats. */
export function showName(show: Show): string {
  return show.title ?? [show.venue, show.city].filter(Boolean).join(", ");
}

export function announcementMail({
  show,
  copy,
  locale,
  site,
  unsubscribeUrl,
}: {
  show: Show;
  copy: Copy["mail"];
  locale: Locale;
  /** Het adres van de site, zonder schuine streep aan het eind. */
  site: string;
  unsubscribeUrl: string;
}): AnnouncementMail {
  const where = [show.venue, show.city].filter(Boolean).join(", ");
  const when = [formatShowDateLong(show.date, locale), show.time]
    .filter(Boolean)
    .join(" · ");

  const lines = [
    copy.showGreeting,
    "",
    copy.showIntro,
    "",
    // Met een eigen naam van de avond staat die bovenaan, met de zaal eronder;
    // anders is de zaal de eerste regel.
    ...(show.title ? [show.title.toUpperCase(), where] : [where.toUpperCase()]),
    when,
    ...(show.note ? [show.note] : []),
    "",
    ...(show.ticketUrl ? [`${copy.showTickets} ${show.ticketUrl}`] : []),
    `${copy.showAgenda} ${site}${localePath(locale, "/agenda")}`,
    "",
    copy.showOutro,
    copy.signature,
    "",
    `${copy.showFooter} ${unsubscribeUrl}`,
  ];

  return {
    subject: copy.showSubject.replace("{show}", showName(show)),
    lines,
  };
}

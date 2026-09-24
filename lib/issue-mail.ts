/**
 * Een nieuwsbrief die in het beheer geschreven is, als mail.
 *
 * Zonder `server-only`, zodat lib/issue-mail.test.ts het kan narekenen. Wat de
 * band schrijft, gaat er ongewijzigd in; lib/mail-html.ts escapet het voor de
 * HTML-versie en maakt kale adressen klikbaar. Daaronder altijd de
 * ondertekening en de link naar afmelden en instellingen — die hoort bij elke
 * mail aan de lijst, net als bij de aankondiging van een show.
 */
import type { Copy } from "../content/types.ts";
import type { Locale } from "./i18n.ts";
import { listMailHtml } from "./list-mail-html.ts";

export type IssueText = {
  subject_nl: string;
  body_nl: string;
  subject_en: string;
  body_en: string;
};

/**
 * Welke tekst iemand krijgt.
 *
 * Engels alleen als er een Engels onderwerp én een Engelse tekst staat. Half
 * vertaald is erger dan niet vertaald: een Engels onderwerp boven een Nederlandse
 * tekst leest als een fout.
 */
export function issueText(
  issue: IssueText,
  locale: Locale,
): { subject: string; body: string } {
  const english = issue.subject_en.trim() && issue.body_en.trim();
  return locale === "en" && english
    ? { subject: issue.subject_en.trim(), body: issue.body_en }
    : { subject: issue.subject_nl.trim(), body: issue.body_nl };
}

export function issueMail({
  issue,
  locale,
  copy,
  preferences,
  site,
}: {
  issue: IssueText;
  locale: Locale;
  /** Het adres van de site, voor het wordmark bovenaan de opgemaakte versie. */
  site: string;
  /** De mailteksten in de taal van de abonnee, voor ondertekening en voet. */
  copy: Copy["mail"];
  preferences: string;
}): { subject: string; lines: string[]; html: string } {
  const { subject, body } = issueText(issue, locale);
  const lines = body
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd());
  // Geen lege regels aan het begin of eind: die komen uit het tekstvak mee en
  // maken van de voet een los eiland onderaan.
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines.at(-1)!.trim()) lines.pop();

  const html = listMailHtml({
    lang: locale,
    site,
    title: subject,
    // De eerste echte zin, zonder aanhef: "Hoi," is geen voorproefje.
    preheader:
      lines.find(
        (line) =>
          line.trim() && !/^(hoi|hi|hey|hallo|hello)\b/i.test(line.trim()),
      ) ?? subject,
    blocks: [
      { kind: "kicker", text: copy.issueKicker },
      { kind: "headline", text: subject },
      { kind: "text", text: lines.join("\n") },
    ],
    signature: copy.signature,
    reason: copy.listReason,
    preferences: { href: preferences, label: copy.preferencesLink },
  });

  return {
    subject,
    lines: [
      ...lines,
      "",
      copy.signature,
      "",
      `${copy.showFooter} ${preferences}`,
    ],
    html,
  };
}

/** Of een nieuwsbrief klaar is om te versturen. Geeft terug wat er ontbreekt. */
export function missing(issue: IssueText): string | null {
  if (!issue.subject_nl.trim()) return "Er staat nog geen onderwerp.";
  if (!issue.body_nl.trim()) return "Er staat nog geen tekst.";
  const en = [issue.subject_en.trim(), issue.body_en.trim()].filter(
    Boolean,
  ).length;
  if (en === 1)
    return "Vul in het Engels onderwerp én tekst in, of laat ze allebei leeg.";
  return null;
}

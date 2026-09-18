/**
 * De regels van een mail omzetten naar HTML.
 *
 * Apart van lib/mail.ts en zonder `server-only`, zodat lib/mail-html.test.ts het
 * kan narekenen. Dat is hier geen formaliteit: in deze mails staat invoer van
 * bezoekers — de naam en het bericht uit het boekingsformulier — en die gaat
 * ongezien de HTML in.
 *
 * Zo sober mogelijk: geen tabellen, geen afbeeldingen, geen eigen lettertypen.
 * Een bevestigingsmail die eruitziet als een nieuwsbrief belandt eerder in de
 * spam, en de inhoud is vier zinnen. Wel altijd naast de platte tekst, want een
 * mail met alleen HTML scoort slechter bij spamfilters dan een mail met beide.
 */
export function toHtml(lines: string[]): string {
  const body = lines
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 12px">${linkify(escapeHtml(line))}</p>`
        : "",
    )
    .join("");

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:#14181C">${body}</div>`;
}

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Een kaal adres klikbaar maken.
 *
 * Draait ná het escapen, op tekst die dus al veilig is — daarom kan de uitkomst
 * geen aanhalingsteken bevatten dat uit het `href`-attribuut breekt. De expressie
 * stopt bij witruimte en bij `&`, zodat een geëscapete `&amp;` niet half in de
 * link belandt.
 */
export const linkify = (escaped: string) =>
  escaped.replace(
    /https?:\/\/[^\s<&]+/g,
    (url) => `<a href="${url}" style="color:#C8322C">${url}</a>`,
  );

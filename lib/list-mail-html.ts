/**
 * De opmaak van mails aan de nieuwsbrieflijst: in de stijl van de site.
 *
 * Donker, met het wordmark bovenaan, de letters van de site (Oswald voor koppen,
 * Inter voor tekst, JetBrains Mono voor labels), en bij een show dezelfde rode
 * balk als de volgende-show-balk op de homepage. Radius 0 en geen schaduwen,
 * net als op de site.
 *
 * Alleen voor mail aan de lijst (lib/list-mail.ts). De bevestigingsmails na een
 * boeking of aanmelding blijven sober (lib/mail-html.ts): dat zijn antwoorden op
 * iets wat iemand net deed, en een kaal bericht komt daar het zekerst aan.
 *
 * Mail is geen browser, en dat bepaalt hoe dit geschreven is:
 *
 * - Tabellen voor de indeling en stijlen inline op elk element. Outlook op
 *   Windows kent geen flex of grid, en Gmail gooit een deel van `<style>` weg.
 * - Kleuren ook als `bgcolor`, voor mailprogramma's die inline stijlen negeren.
 * - De letters komen van Google Fonts. Apple Mail en iOS laden die; Gmail en
 *   Outlook niet, en vallen dan terug op de letters erachter in het rijtje — de
 *   indeling blijft dan hetzelfde, alleen de letter verschilt.
 * - `color-scheme: dark`, zodat mailprogramma's met een donkere stand de mail
 *   niet nog eens omkeren naar licht.
 * - Alle tekst gaat door escapeHtml. In een nieuwsbrief staat wat de band zelf
 *   typte, en dat hoort nooit als HTML de mail in te gaan.
 *
 * Zonder `server-only` en met relatieve imports, zodat
 * lib/list-mail-html.test.ts het kan narekenen.
 */
import { escapeHtml } from "./mail-html.ts";

/** De kleuren uit styles/tokens.css. Mail kent geen CSS-variabelen. */
const C = {
  base: "#0d0f12",
  surface: "#1c2126",
  inset: "#090b0d",
  text: "#ede5d4",
  muted: "#9ba3ab",
  onAccent: "#f7f2e8",
  accent: "#b33a28",
  alt: "#2aa5b5",
  line: "#333b42",
};

const DISPLAY = "Oswald, 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
const BODY =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'JetBrains Mono', Menlo, Consolas, 'Courier New', monospace";

export type MailBlock =
  /** Het kleine label boven de kop: "Nieuwe show", "Nieuws". */
  | { kind: "kicker"; text: string }
  | { kind: "headline"; text: string }
  /** De rode showbalk, zoals de volgende-show-balk op de homepage. */
  | {
      kind: "show";
      day: string;
      meta: string;
      name: string;
      venue: string;
      note?: string;
      tickets?: { href: string; label: string };
    }
  /** Vrije tekst: een lege regel is een nieuwe alinea, adressen worden links. */
  | { kind: "text"; text: string }
  | { kind: "link"; href: string; label: string };

export type ListMailLayout = {
  lang: "nl" | "en";
  /** Het adres van de site, zonder schuine streep aan het eind. */
  site: string;
  title: string;
  /** De regel die een mailprogramma naast het onderwerp laat zien. */
  preheader: string;
  blocks: MailBlock[];
  signature: string;
  reason: string;
  preferences: { href: string; label: string };
};

/** Alleen http(s) als link. Wat de band typt, kan geen javascript:-link worden. */
const safeHref = (href: string) => (/^https?:\/\//i.test(href) ? href : "#");

const link = (href: string, label: string, style = "") =>
  `<a href="${escapeHtml(safeHref(href))}" style="color:${C.alt};text-decoration:underline;${style}">${label}</a>`;

/** Kale adressen in al geëscapete tekst klikbaar maken, in de linkkleur. */
const linkify = (escaped: string) =>
  escaped.replace(/https?:\/\/[^\s<&]+/g, (url) =>
    link(url, url, "word-break:break-all;"),
  );

function paragraphs(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;font-family:${BODY};font-size:16px;line-height:26px;color:${C.text};">${block
          .split("\n")
          .map((line) => linkify(escapeHtml(line)))
          .join("<br>")}</p>`,
    )
    .join("");
}

function block(item: MailBlock): string {
  switch (item.kind) {
    case "kicker":
      return `<p style="margin:0 0 12px;font-family:${MONO};font-size:12px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:${C.alt};">${escapeHtml(item.text)}</p>`;

    case "headline":
      return `<h1 style="margin:0 0 24px;font-family:${DISPLAY};font-size:34px;line-height:38px;font-weight:700;letter-spacing:-0.5px;text-transform:uppercase;color:${C.text};">${escapeHtml(item.text)}</h1>`;

    case "show": {
      const tickets = item.tickets
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td bgcolor="${C.inset}" style="background:${C.inset};">
            <a href="${escapeHtml(safeHref(item.tickets.href))}" style="display:inline-block;padding:14px 32px;font-family:${DISPLAY};font-size:16px;line-height:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.text};text-decoration:none;">${escapeHtml(item.tickets.label)}</a>
          </td></tr></table>`
        : "";
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr>
        <td bgcolor="${C.accent}" class="px" style="background:${C.accent};padding:28px 32px;color:${C.onAccent};">
          <p class="day" style="margin:0;font-family:${DISPLAY};font-size:64px;line-height:60px;font-weight:700;color:${C.onAccent};">${escapeHtml(item.day)}</p>
          <p style="margin:8px 0 0;font-family:${MONO};font-size:12px;line-height:16px;letter-spacing:2px;color:${C.onAccent};">${escapeHtml(item.meta)}</p>
          <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(13,15,18,0.35);font-family:${DISPLAY};font-size:28px;line-height:32px;font-weight:700;text-transform:uppercase;color:${C.onAccent};">${escapeHtml(item.name)}</p>
          <p style="margin:6px 0 0;font-family:${MONO};font-size:12px;line-height:18px;letter-spacing:2px;text-transform:uppercase;color:${C.onAccent};">${escapeHtml(item.venue)}</p>
          ${item.note ? `<p style="margin:10px 0 0;font-family:${BODY};font-size:15px;line-height:22px;color:${C.onAccent};">${escapeHtml(item.note)}</p>` : ""}
          ${tickets}
        </td>
      </tr></table>`;
    }

    case "text":
      return paragraphs(item.text);

    case "link":
      return `<p style="margin:0 0 8px;font-family:${MONO};font-size:12px;line-height:18px;letter-spacing:2px;text-transform:uppercase;">${link(item.href, `${escapeHtml(item.label)} &rarr;`, "text-decoration:none;")}</p>`;
  }
}

export function listMailHtml(layout: ListMailLayout): string {
  const logo = `${layout.site}/assets/staticline-wordmark-flat.png`;
  const body = layout.blocks.map(block).join("");

  return `<!doctype html>
<html lang="${layout.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(layout.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Inter:wght@400;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 0; background: ${C.base}; }
  @media (max-width: 620px) {
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .day { font-size: 48px !important; line-height: 46px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.base};" bgcolor="${C.base}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(layout.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.base}" style="background:${C.base};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
    <tr><td class="px" bgcolor="${C.inset}" style="background:${C.inset};padding:20px 32px;border-bottom:1px solid ${C.line};">
      <a href="${escapeHtml(layout.site)}" style="text-decoration:none;"><img src="${escapeHtml(logo)}" width="88" alt="Static Line" style="display:block;width:88px;height:auto;border:0;"></a>
    </td></tr>
    <tr><td class="px" bgcolor="${C.base}" style="background:${C.base};padding:36px 32px 24px;">
      ${body}
    </td></tr>
    <tr><td class="px" bgcolor="${C.base}" style="background:${C.base};padding:0 32px 32px;">
      <p style="margin:0;padding-top:20px;border-top:1px solid ${C.line};font-family:${MONO};font-size:11px;line-height:16px;letter-spacing:1px;color:${C.muted};">${escapeHtml(layout.signature)}</p>
      <p style="margin:12px 0 0;font-family:${BODY};font-size:13px;line-height:20px;color:${C.muted};">${escapeHtml(layout.reason)} ${link(layout.preferences.href, escapeHtml(layout.preferences.label))}</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

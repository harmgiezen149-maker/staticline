import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Nederlandse teksten naar het Engels vertalen.
 *
 * De site is tweetalig, maar de bandbio, de tekst per lid en de regel onder een
 * show komen uit de Band App en staan daar één keer, in het Nederlands. Die met
 * de hand overtypen in een tweede taal is werk dat niemand bijhoudt; na twee
 * maanden staat er een Engelse tekst die niet meer klopt.
 *
 * Daarom vertaalt Claude ze, en kun je het resultaat daarna aanpassen. De
 * vertaling is een voorstel, geen eindproduct — vandaar dat elk veld in het
 * beheerscherm gewoon te bewerken blijft.
 *
 * Zonder ANTHROPIC_API_KEY doet dit niets en meldt het dat netjes. Dezelfde
 * afspraak als bij de mail en de captcha: een ontbrekende sleutel legt niets
 * plat, hij laat een functie weg.
 */

/**
 * Het model.
 *
 * Opus 5. Dit is kort werk — een paar alinea's per keer — dus de rekening valt
 * in het niet: ruwweg twee cent voor het in één keer vertalen van de hele band.
 * Een kleiner model zou daar een halve cent van maken en dat is de moeite van een
 * slechtere vertaling van je eigen bandbio niet waard.
 */
const MODEL = "claude-opus-5";

/** Ruim voor een bandbio met de ledenteksten erbij, hoeveel leden het er ook zijn. */
const MAX_TOKENS = 8000;

const SYSTEM = `Je vertaalt teksten van een Nederlandse rockband naar het Engels voor hun website.

Regels:
- Behoud de toon. Dit is een rauwe coverband, geen persbericht. Droog en kort mag droog en kort blijven.
- Vertaal geen eigennamen: bandnaam, namen van leden, zaalnamen, plaatsnamen en songtitels blijven staan.
- Behoud lege regels tussen alinea's precies zoals ze staan.
- Nederlandse muziekterminologie gaat naar wat een Engelstalige muzikant zegt: "leadzang" wordt "lead vocals", "ritmegitaar" wordt "rhythm guitar", "bas" wordt "bass".
- Verzin niets bij en laat niets weg.
- Geef alleen de vertaling terug, zonder inleiding of toelichting.`;

export function translateConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export type TranslateResult =
  | { ok: true; translations: string[] }
  | { ok: false; error: "not-configured" | "failed" | "shape" };

/**
 * Een reeks teksten in één aanroep vertalen.
 *
 * In één keer en niet per stuk: het scheelt aanroepen, en belangrijker, het model
 * ziet de bandbio en de ledenteksten naast elkaar. Dat maakt de toon over de hele
 * pagina consistent in plaats van per veld anders.
 *
 * De volgorde in en uit is dezelfde. Dat wordt gecontroleerd — komt er een lijst
 * van een andere lengte terug, dan wordt er niets opgeslagen. Vertalingen die
 * één positie zijn opgeschoven zijn erger dan geen vertaling.
 */
export async function translate(texts: string[]): Promise<TranslateResult> {
  if (!translateConfigured()) return { ok: false, error: "not-configured" };

  const items = texts.map((text) => text.trim());
  if (items.length === 0) return { ok: true, translations: [] };

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      // Structured outputs, zodat er een lijst terugkomt en geen tekst waar een
      // lijst in zit die hier weer uit geparst moet worden.
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              translations: {
                type: "array",
                items: { type: "string" },
                description:
                  "De Engelse vertalingen, in dezelfde volgorde als de invoer.",
              },
            },
            required: ["translations"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: `Vertaal deze ${items.length} teksten naar het Engels.\n\n${JSON.stringify(items, null, 2)}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      console.error("[vertalen] geweigerd:", response.stop_details);
      return { ok: false, error: "failed" };
    }

    const text = response.content.find((block) => block.type === "text")?.text ?? "";
    const parsed = JSON.parse(text) as { translations?: unknown };

    if (
      !Array.isArray(parsed.translations) ||
      parsed.translations.length !== items.length ||
      parsed.translations.some((value) => typeof value !== "string")
    ) {
      console.error("[vertalen] onverwachte vorm terug");
      return { ok: false, error: "shape" };
    }

    return { ok: true, translations: parsed.translations as string[] };
  } catch (error) {
    // Nooit gooien. De aanroeper krijgt een uitkomst, net als bij lib/mail.ts.
    console.error("[vertalen] mislukt:", error);
    return { ok: false, error: "failed" };
  }
}

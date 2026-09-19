import "server-only";

import type { Flag } from "./check";
import type { TextType } from "./config";
import type { ParsedRequest } from "./request";
import { buildSources } from "./sources";
import { type RewriteResult, write } from "./write";

/**
 * Een gecontroleerd verzoek uitvoeren.
 *
 * Twee aanroepers: de server action van /beheer/tov en de route /api/tov voor
 * de Band App. Die verschillen alleen in hoe ze iemand herkennen — een sessie
 * tegenover een gedeelde sleutel. Wat daarna gebeurt is hetzelfde, en dat hoort
 * dus op één plek te staan; anders krijgt de band in het ene scherm wel een
 * waarschuwing over een leeg feitenblad en in het andere niet.
 */
export async function runTov(
  value: ParsedRequest,
  type: TextType,
): Promise<RewriteResult> {
  if (value.mode === "rewrite") {
    return write({
      mode: "rewrite",
      input: value.input,
      type,
      context: value.context,
    });
  }

  const { sheet, subjectFound } = await buildSources({
    type,
    keys: value.keys,
    subjectId: value.subjectId,
    notes: value.notes,
  });

  const extraFlags: Flag[] = [];

  // Zonder bron is er niets om tegen na te rekenen. De tekst komt er wel, want
  // soms wil je gewoon een zin in de juiste toon — maar dan staat erbij dat er
  // niets gecontroleerd is. Stil doen alsof de controle gedraaid heeft is
  // erger dan geen controle.
  if (sheet.empty) {
    extraFlags.push({
      type: "no_source",
      message:
        "Er is geen bron aangevinkt en er staan geen aantekeningen. Alles in deze tekst komt uit het model en is nergens aan nagerekend.",
    });
  }

  if (!subjectFound) {
    extraFlags.push({
      type: "no_source",
      message:
        "Het gekozen onderwerp staat niet meer in de Band App. De tekst is zonder dat onderwerp geschreven.",
    });
  }

  return write({
    mode: "brief",
    brief: value.brief,
    factsheet: sheet.text,
    long: value.long,
    type,
    context: value.context,
    extraFlags,
  });
}

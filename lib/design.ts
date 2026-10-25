/**
 * Welk ontwerp de publieke site draagt.
 *
 * "klassiek" is het ontwerp uit design/v2. "microduck" is een tweede laag
 * eroverheen, op verzoek en naar de productpagina van Pollen Robotics' Microduck
 * (het voorstel staat als ontwerp op claude.ai): koppen in twee tonen met een
 * label erboven, knoppen met een harde plaat, een schuine looptekst met de
 * volgende show, showkaarten met een statussticker en een stippenraster.
 *
 * Beide ontwerpen delen alle inhoud, routes en beweging; het nieuwe zet alleen
 * andere markup op een handvol plekken en een eigen stylesheet
 * (styles/microduck.css), allemaal onder `html[data-ontwerp="microduck"]`.
 * Schakelen gaat in /beheer/ontwerp, zonder nieuwe uitrol.
 *
 * Zonder server-only: het beheerscherm leest de keuzes in de browser.
 */

export const DESIGNS = ["klassiek", "microduck"] as const;
export type Design = (typeof DESIGNS)[number];

/** De sleutel in `site_content`. */
export const DESIGN_KEY = "ontwerp";

export const DEFAULT_DESIGN: Design = "klassiek";

export function parseDesign(value: unknown): Design {
  return DESIGNS.includes(value as Design) ? (value as Design) : DEFAULT_DESIGN;
}

/**
 * Een kop in twee tonen: alles behalve het laatste woord, en het laatste woord
 * apart (dat wordt rood). Eén woord blijft één regel. Zo hoeft er geen tweede
 * tekst per kop te bestaan, en werkt het voor elke kop uit /beheer/inhoud.
 */
export function splitHeading(text: string): [string, string] {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return ["", text.trim()];
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}

import "server-only";

import { neon } from "@neondatabase/serverless";

/**
 * De eigen database van de website.
 *
 * Neon over HTTP in plaats van een gewone Postgres-verbinding: op Vercel start
 * elke aanroep in een eigen omgeving, en een klassieke verbindingspool loopt daar
 * vol met verbindingen die niemand meer gebruikt. De HTTP-driver heeft dat
 * probleem niet en is meteen koud beschikbaar.
 *
 * Geeft `null` als er geen DATABASE_URL is. Dat is geen fout maar een toestand:
 * de site werkt zonder database — aanvragen gaan dan alleen door naar de Band
 * App. Elke aanroeper hoort die `null` op te vangen in plaats van erop te
 * vertrouwen dat hij er is.
 *
 * Aanmaken: in Vercel bij dit project onder Storage een Neon-database koppelen.
 * Vercel zet DATABASE_URL dan zelf. Daarna eenmalig `npm run db:setup` om de twee
 * tabellen te maken.
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

/** Of er een database is. Voor een logregel, niet voor een foutmelding. */
export const hasDb = () => Boolean(process.env.DATABASE_URL);

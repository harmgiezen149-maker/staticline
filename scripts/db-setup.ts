// De tabellen van de website aanmaken. Idempotent: zo vaak draaien als je wilt.
//
//   DATABASE_URL="postgresql://…" npm run db:setup
//
// Of, als de variabele al in .env.local staat:
//
//   npm run db:setup
//
// Het opknippen zit in lib/sql.ts, met tests. Dat stond hier eerst als
// `schema.split(";")`, en dat knipte middenin de commentaarregels die zelf een
// puntkomma bevatten — waardoor deze opdracht stilletjes niets aanmaakte.
import { readFileSync } from "node:fs";

import { neon } from "@neondatabase/serverless";

import { splitStatements } from "../lib/sql.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "Geen DATABASE_URL. Koppel in Vercel onder Storage een Neon-database aan dit\n" +
      "project, of zet de waarde in .env.local.",
  );
  process.exit(1);
}

const sql = neon(url);
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const statements = splitStatements(schema);

console.log(`${statements.length} opdrachten uit db/schema.sql\n`);

for (const statement of statements) {
  const label = statement.split("\n")[0].trim().slice(0, 64);
  try {
    await sql.query(statement);
    console.log(`  ok   ${label}`);
  } catch (error) {
    // Hardop stoppen, niet doorgaan. Stil doorlopen na een mislukte opdracht is
    // precies hoe dit bestand ooit "klaar" meldde terwijl er geen enkele tabel
    // stond.
    console.error(`  MIS  ${label}`);
    console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

console.log("\nKlaar. De tabellen staan er.");

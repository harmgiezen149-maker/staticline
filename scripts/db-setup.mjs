// De twee tabellen van de website aanmaken. Idempotent: zo vaak draaien als je
// wilt.
//
//   DATABASE_URL="postgresql://…" node scripts/db-setup.mjs
//
// Of, als de variabele al in .env.local staat:
//
//   npm run db:setup
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

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

// De driver stuurt één opdracht per aanroep, dus het bestand wordt op puntkomma
// gesplitst. Werkt hier omdat er geen functies of triggers in staan; komen die er
// ooit, dan moet dit slimmer.
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.split("\n").every((line) => line.trim().startsWith("--")));

for (const statement of statements) {
  const first = statement.split("\n").find((l) => !l.trim().startsWith("--")) ?? "";
  process.stdout.write(`… ${first.trim().slice(0, 60)}\n`);
  await sql.query(statement);
}

console.log("\nKlaar. De tabellen staan er.");

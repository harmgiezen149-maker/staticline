import assert from "node:assert/strict";
import { test } from "node:test";

import { splitStatements } from "./sql.ts";

test("een puntkomma in commentaar knipt niet", () => {
  const sql = `
-- Twee tabellen die zelden veranderen; dit bestand is idempotent.
CREATE TABLE a (id int);
`;

  assert.deepEqual(splitStatements(sql), ["CREATE TABLE a (id int)"]);
});

test("commentaar verdwijnt uit de opdracht", () => {
  const statements = splitStatements(`
CREATE TABLE a (
  -- de sleutel
  id int
);
`);

  assert.equal(statements.length, 1);
  assert.ok(!statements[0].includes("de sleutel"));
  assert.ok(statements[0].includes("id int"));
});

test("een blok dat alleen commentaar is, levert niets op", () => {
  assert.deepEqual(splitStatements("-- alleen uitleg\n-- en nog een regel\n"), []);
});

test("een puntkomma in een tekst tussen aanhalingstekens knipt niet", () => {
  assert.deepEqual(
    splitStatements("INSERT INTO a VALUES ('een; twee');"),
    ["INSERT INTO a VALUES ('een; twee')"],
  );
});

test("een aanhalingsteken ín een tekst sluit die tekst niet af", () => {
  assert.deepEqual(
    splitStatements("INSERT INTO a VALUES ('het''s; goed');"),
    ["INSERT INTO a VALUES ('het''s; goed')"],
  );
});

test("meerdere opdrachten achter elkaar", () => {
  assert.deepEqual(splitStatements("CREATE TABLE a (id int); CREATE TABLE b (id int);"), [
    "CREATE TABLE a (id int)",
    "CREATE TABLE b (id int)",
  ]);
});

test("een laatste opdracht zonder puntkomma telt ook mee", () => {
  assert.deepEqual(splitStatements("CREATE TABLE a (id int)"), [
    "CREATE TABLE a (id int)",
  ]);
});

test("een min die geen commentaar is, blijft staan", () => {
  assert.deepEqual(splitStatements("SELECT 3 - 1;"), ["SELECT 3 - 1"]);
});

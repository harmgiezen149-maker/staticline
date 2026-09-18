import assert from "node:assert/strict";
import { test } from "node:test";

import { MIN_SECRET_LENGTH, seal, unseal } from "./seal.ts";

const SECRET = "x".repeat(MIN_SECRET_LENGTH);
const OTHER = "y".repeat(MIN_SECRET_LENGTH);
const hour = () => Date.now() + 60 * 60 * 1000;

test("een koekje komt eruit zoals het erin ging", () => {
  const token = seal({ email: "harm@example.nl", exp: hour() }, SECRET);
  const opened = unseal(token, SECRET);

  assert.equal(opened?.email, "harm@example.nl");
});

test("een andere sleutel opent het koekje niet", () => {
  const token = seal({ email: "harm@example.nl", exp: hour() }, SECRET);

  assert.equal(unseal(token, OTHER), null);
});

test("een aangepaste inhoud wordt geweigerd", () => {
  const token = seal({ email: "vedran@example.nl", exp: hour() }, SECRET);
  const [, signature] = token.split(".");

  // Hetzelfde koekje, maar met een ander adres erin en de oude handtekening.
  const forged = Buffer.from(
    JSON.stringify({ email: "inbreker@example.nl", exp: hour() }),
  ).toString("base64url");

  assert.equal(unseal(`${forged}.${signature}`, SECRET), null);
});

test("een aangepaste handtekening wordt geweigerd", () => {
  const token = seal({ email: "harm@example.nl", exp: hour() }, SECRET);
  const [payload, signature] = token.split(".");
  const flipped = signature.startsWith("A")
    ? `B${signature.slice(1)}`
    : `A${signature.slice(1)}`;

  assert.equal(unseal(`${payload}.${flipped}`, SECRET), null);
});

test("een verlopen koekje wordt geweigerd", () => {
  const token = seal({ email: "harm@example.nl", exp: Date.now() - 1000 }, SECRET);

  assert.equal(unseal(token, SECRET), null);
});

test("een te korte sleutel opent nooit iets", () => {
  const token = seal({ email: "harm@example.nl", exp: hour() }, "kort");

  assert.equal(unseal(token, "kort"), null);
});

test("rommel levert null op in plaats van een uitzondering", () => {
  for (const value of ["", ".", "..", "geen-punt", ".alleen-handtekening", "a.b"]) {
    assert.equal(unseal(value, SECRET), null, `faalde op ${JSON.stringify(value)}`);
  }
});

test("een koekje zonder adres wordt geweigerd", () => {
  const token = seal({ email: "", exp: hour() } as never, SECRET);

  assert.equal(unseal(token, SECRET), null);
});

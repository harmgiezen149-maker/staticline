import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { parseList, portalConfigured, roleFor } from "./access.ts";

const SECRET = "x".repeat(32);

afterEach(() => {
  delete process.env.PORTAL_ADMINS;
  delete process.env.PORTAL_MEMBERS;
  delete process.env.PORTAL_SECRET;
});

test("een lijst mag komma's, spaties en puntkomma's door elkaar gebruiken", () => {
  assert.deepEqual(
    parseList("Harm@Example.nl, vedran@example.nl;niels@example.nl  quinten@example.nl"),
    [
      "harm@example.nl",
      "vedran@example.nl",
      "niels@example.nl",
      "quinten@example.nl",
    ],
  );
});

test("wat geen adres is, valt eruit", () => {
  assert.deepEqual(parseList("harm@example.nl, , onzin, -"), ["harm@example.nl"]);
});

test("een leeg of ontbrekend veld geeft een lege lijst", () => {
  assert.deepEqual(parseList(undefined), []);
  assert.deepEqual(parseList(""), []);
});

test("hoofdletters en spaties in het ingevulde adres maken niet uit", () => {
  process.env.PORTAL_ADMINS = "harm@example.nl";

  assert.equal(roleFor("  HARM@Example.NL "), "admin");
});

test("beheerder wint van lid als een adres in beide lijsten staat", () => {
  process.env.PORTAL_ADMINS = "harm@example.nl";
  process.env.PORTAL_MEMBERS = "harm@example.nl";

  assert.equal(roleFor("harm@example.nl"), "admin");
});

test("een onbekend adres heeft geen rol", () => {
  process.env.PORTAL_ADMINS = "harm@example.nl";

  assert.equal(roleFor("iemand@anders.nl"), null);
});

test("zonder lijsten heeft niemand een rol", () => {
  assert.equal(roleFor("harm@example.nl"), null);
});

test("het portaal is pas ingesteld met een sleutel én een beheerder", () => {
  assert.equal(portalConfigured(), false);

  process.env.PORTAL_SECRET = SECRET;
  assert.equal(portalConfigured(), false, "sleutel zonder beheerder is niet genoeg");

  process.env.PORTAL_ADMINS = "harm@example.nl";
  assert.equal(portalConfigured(), true);

  process.env.PORTAL_SECRET = "te-kort";
  assert.equal(portalConfigured(), false, "een korte sleutel telt niet");
});

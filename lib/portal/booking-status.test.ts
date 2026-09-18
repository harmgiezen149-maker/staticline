import assert from "node:assert/strict";
import { test } from "node:test";

import { STATUSES, STATUS_LABELS, isStatus } from "./booking-status.ts";

/**
 * `isStatus` bewaakt wat er uit een formulier de database in gaat. Dat is invoer
 * van buiten, ook al komt het van een eigen scherm — een server action is een
 * adres dat iedereen kan aanroepen.
 */
test("de vier bekende statussen komen erdoor", () => {
  for (const status of STATUSES) assert.equal(isStatus(status), true, status);
});

test("alles wat er niet bij hoort, komt er niet door", () => {
  for (const value of ["", "nieuw", "NEW", "handled", null, undefined, 1, {}, []]) {
    assert.equal(isStatus(value), false, JSON.stringify(value) ?? String(value));
  }
});

test("elke status heeft een label", () => {
  for (const status of STATUSES) {
    assert.ok(STATUS_LABELS[status], `geen label voor ${status}`);
  }
});

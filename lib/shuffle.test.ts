import assert from "node:assert/strict";
import { test } from "node:test";

import { shuffledOrder } from "./shuffle.ts";

test("elke positie komt precies één keer voor", () => {
  for (let n = 0; n < 12; n++) {
    assert.deepEqual([...shuffledOrder(n)].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i));
  }
});

test("de volgorde wisselt echt", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) seen.add(shuffledOrder(4).join(","));
  // 24 mogelijke volgordes; na 200 keer schudden horen we de meeste gezien te hebben.
  assert.ok(seen.size > 15, `maar ${seen.size} volgordes gezien`);
});

test("iedereen staat even vaak vooraan", () => {
  const first = [0, 0, 0, 0];
  for (let i = 0; i < 8000; i++) first[shuffledOrder(4)[0]]++;
  for (const count of first) assert.ok(count > 1700 && count < 2300, `vooraan: ${first.join("/")}`);
});

test("met een vaste toevalsbron is de uitkomst vast", () => {
  assert.deepEqual(shuffledOrder(3, () => 0), [1, 2, 0]);
  assert.deepEqual(shuffledOrder(3, () => 0.999), [0, 1, 2]);
});

test("niets of onzin geeft een lege lijst", () => {
  assert.deepEqual(shuffledOrder(0), []);
  assert.deepEqual(shuffledOrder(-3), []);
});

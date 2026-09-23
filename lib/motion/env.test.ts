import assert from "node:assert/strict";
import { test } from "node:test";

import { toMs } from "./env.ts";

test("een duur in milliseconden blijft wat hij is", () => {
  assert.equal(toMs("640ms"), 640);
  assert.equal(toMs(" 40ms "), 40);
});

test("een duur in seconden wordt omgerekend", () => {
  // Zo schrijft de CSS-minifier het in de gebouwde site: 2200ms wordt 2.2s en
  // 750ms wordt .75s. Werd hier eerst als 2,2 en 0,75 ms gelezen, waardoor de
  // loader in productie niet te zien was.
  assert.equal(toMs("2.2s"), 2200);
  assert.equal(toMs(".75s"), 750);
  assert.equal(toMs("0s"), 0);
});

test("een lege of onleesbare waarde is nul, geen NaN", () => {
  assert.equal(toMs(""), 0);
  assert.equal(toMs("linear"), 0);
});

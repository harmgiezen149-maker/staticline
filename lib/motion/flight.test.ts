import assert from "node:assert/strict";
import { test } from "node:test";

import { flightFrame, flightProgress, smooth } from "./flight.ts";

// Desktop, ongeveer: het grote wordmark 720 breed op 184 van de bovenkant van
// de pagina, de plek in de kop 76×44 op (24, 12).
const DOC_TOP = 184;
const hero = (scrollY: number) => ({ left: 48, top: DOC_TOP - scrollY, width: 720, height: 417 });
const slot = { left: 24, top: 12, width: 76, height: 44 };
// Onderkant hero (184 + 417) min onderkant plek (56).
const END = DOC_TOP + 417 - 56;

test("bovenaan staat het wordmark precies op zijn eigen plek", () => {
  const f = flightFrame(0, hero(0), slot);
  assert.deepEqual(f, { progress: 0, x: 48, y: DOC_TOP, scale: 1, dock: 0 });
});

test("aan het eind van de vlucht ligt hij precies op de plek in de kop", () => {
  const f = flightFrame(END, hero(END), slot);
  assert.equal(f.progress, 1);
  assert.equal(f.x, slot.left);
  assert.equal(f.y, slot.top);
  assert.equal(f.scale, slot.width / 720);
  assert.equal(f.dock, 1);
});

test("verder scrollen verandert niets meer", () => {
  assert.deepEqual(flightFrame(END + 900, hero(END + 900), slot), flightFrame(END, hero(END), slot));
});

test("de voortgang hangt niet af van waar de hero op dat moment staat", () => {
  // De plek van de hero schuift mee met de pagina; het eindpunt van de vlucht
  // is een vaste scrollpositie.
  for (const y of [0, 100, 300, END]) {
    assert.equal(flightProgress(y, hero(y), slot), Math.min(1, y / END));
  }
});

test("hij schiet onderweg nooit boven de kop uit", () => {
  for (let y = 0; y <= END; y += 5) {
    assert.ok(flightFrame(y, hero(y), slot).y >= slot.top, `y ${y}`);
  }
});

test("hij beweegt alleen omhoog en wordt alleen kleiner", () => {
  let last = flightFrame(0, hero(0), slot);
  for (let y = 5; y <= END; y += 5) {
    const f = flightFrame(y, hero(y), slot);
    assert.ok(f.y <= last.y + 1e-9 && f.scale <= last.scale + 1e-9, `y ${y}`);
    last = f;
  }
});

test("het vlakke wordmark neemt het pas in het laatste stuk over", () => {
  assert.equal(flightFrame(END / 2, hero(END / 2), slot).dock, 0);
  const late = flightFrame(END * 0.97, hero(END * 0.97), slot).dock;
  assert.ok(late > 0 && late < 1, `dock ${late}`);
});

test("de S begint en eindigt rustig", () => {
  assert.equal(smooth(0), 0);
  assert.equal(smooth(1), 1);
  assert.equal(smooth(0.5), 0.5);
  assert.ok(smooth(0.1) < 0.1);
  assert.ok(smooth(0.9) > 0.9);
});

test("staat de hero al boven de kop, dan is de vlucht meteen klaar", () => {
  assert.equal(flightProgress(0, { left: 0, top: -500, width: 720, height: 417 }, slot), 1);
});

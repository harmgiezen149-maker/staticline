import assert from "node:assert/strict";
import { test } from "node:test";

import { changedStatuses } from "./booking-status.ts";

const RIJ = { id: 7, band_app_id: 42, status: "new" };

test("een andere stand in de Band App wordt overgenomen", () => {
  assert.deepEqual(changedStatuses([RIJ], { 42: "booked" }), [
    { id: 7, status: "booked" },
  ]);
});

test("dezelfde stand levert niets op", () => {
  assert.deepEqual(changedStatuses([RIJ], { 42: "new" }), []);
});

test("een aanvraag die daar weggegooid is, blijft hier staan", () => {
  // Het id komt niet terug uit de Band App. Deze site is het archief; die stand
  // hoort niet stil te verdwijnen of terug te springen naar iets anders.
  assert.deepEqual(changedStatuses([RIJ], {}), []);
});

test("een onbekende stand wordt niet overgenomen", () => {
  // Zou een nieuwere Band App er een bij krijgen, dan komt die hier niet binnen:
  // het scherm heeft er geen label voor.
  assert.deepEqual(changedStatuses([RIJ], { 42: "archived" }), []);
});

test("alleen de rijen die afwijken komen terug", () => {
  const rijen = [
    { id: 1, band_app_id: 10, status: "new" },
    { id: 2, band_app_id: 20, status: "seen" },
    { id: 3, band_app_id: 30, status: "booked" },
  ];

  assert.deepEqual(changedStatuses(rijen, { 10: "new", 20: "declined", 30: "booked" }), [
    { id: 2, status: "declined" },
  ]);
});

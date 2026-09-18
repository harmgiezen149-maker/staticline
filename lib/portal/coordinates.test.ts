import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isShortLink,
  parseCoordinates,
  roundCoordinate,
} from "./coordinates.ts";

test("een Google-plaatslink: de plaats wint van het middelpunt", () => {
  // `@` is waar de kaart staat, `!3d`/`!4d` is de plaats zelf. Die twee
  // verschillen zodra iemand de kaart versleept voor hij kopieert.
  const url =
    "https://www.google.com/maps/place/Loburg/@52.0000,5.0000,17z/data=!4m6!3m5!1s0x0!8m2!3d51.9692!4d5.6654";

  assert.deepEqual(parseCoordinates(url), { lat: 51.9692, lng: 5.6654 });
});

test("een Google-link met alleen een middelpunt", () => {
  assert.deepEqual(
    parseCoordinates("https://www.google.com/maps/@51.9692,5.6654,15z"),
    { lat: 51.9692, lng: 5.6654 },
  );
});

test("een zoeklink met q=", () => {
  assert.deepEqual(parseCoordinates("https://maps.google.com/?q=51.9692,5.6654"), {
    lat: 51.9692,
    lng: 5.6654,
  });
});

test("een zoeklink waarin de komma is gecodeerd", () => {
  assert.deepEqual(
    parseCoordinates("https://www.google.com/maps?q=51.9692%2C5.6654"),
    { lat: 51.9692, lng: 5.6654 },
  );
});

test("OpenStreetMap", () => {
  assert.deepEqual(
    parseCoordinates("https://www.openstreetmap.org/#map=17/51.9692/5.6654"),
    { lat: 51.9692, lng: 5.6654 },
  );
});

test("twee kale getallen", () => {
  assert.deepEqual(parseCoordinates("51.9692, 5.6654"), {
    lat: 51.9692,
    lng: 5.6654,
  });
  assert.deepEqual(parseCoordinates("-33.8688,151.2093"), {
    lat: -33.8688,
    lng: 151.2093,
  });
});

test("losse getallen in een adres worden niet opgepikt", () => {
  assert.equal(parseCoordinates("Kerkstraat 12, 6711 AB Ede"), null);
});

test("buiten bereik levert niets op", () => {
  assert.equal(parseCoordinates("91.0, 5.0"), null);
  assert.equal(parseCoordinates("51.0, 181.0"), null);
});

test("rommel levert null op", () => {
  for (const value of ["", "   ", "geen link", "https://voorbeeld.nl"]) {
    assert.equal(parseCoordinates(value), null, JSON.stringify(value));
  }
});

test("een verkorte link wordt als zodanig herkend", () => {
  assert.equal(isShortLink("https://maps.app.goo.gl/AbCdEf123"), true);
  assert.equal(isShortLink("https://goo.gl/maps/AbCdEf123"), true);
  assert.equal(isShortLink("https://www.google.com/maps/@51.9,5.6,15z"), false);
});

test("een verkorte link bevat geen coördinaten", () => {
  assert.equal(parseCoordinates("https://maps.app.goo.gl/AbCdEf123"), null);
});

test("afronden op vijf decimalen", () => {
  assert.equal(roundCoordinate(51.969212345), 51.96921);
  assert.equal(roundCoordinate(5.6654), 5.6654);
});

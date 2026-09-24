import assert from "node:assert/strict";
import { test } from "node:test";

import { en } from "../content/en.ts";
import { nl } from "../content/nl.ts";
import { announcementMail, showName } from "./announce-mail.ts";
import type { Show } from "./shows.ts";

const show: Show = {
  id: 14,
  date: "2026-11-10T20:00:00.000Z",
  time: "20:00",
  title: "LoBandNight",
  venue: "Loburg",
  city: "Wageningen",
  status: "tickets",
  ticketUrl: "https://www.loburg.com/events/lobandnight-8/",
  note: "1 avond, 3 bands",
  lat: null,
  lng: null,
};

const mail = (s: Show, locale: "nl" | "en" = "nl") =>
  announcementMail({
    show: s,
    copy: (locale === "nl" ? nl : en).mail,
    locale,
    site: "https://www.staticline.nl",
    unsubscribeUrl: "https://www.staticline.nl/nieuwsbrief/afmelden?token=abc",
  });

test("alles wat bij de show hoort staat erin", () => {
  const { subject, lines } = mail(show);
  const text = lines.join("\n");
  assert.equal(subject, "Nieuwe show: LoBandNight — Static Line");
  assert.match(
    text,
    /LOBANDNIGHT\nLoburg, Wageningen\n10 november 2026 · 20:00\n1 avond, 3 bands/,
  );
  assert.match(
    text,
    /Tickets: https:\/\/www\.loburg\.com\/events\/lobandnight-8\//,
  );
  assert.match(text, /Alle shows: https:\/\/www\.staticline\.nl\/agenda/);
});

test("onderaan staat altijd de afmeldlink", () => {
  const { lines } = mail(show);
  assert.match(
    lines.at(-1) ?? "",
    /Afmelden, of ook ander nieuws ontvangen: https:\/\/www\.staticline\.nl\/nieuwsbrief\/afmelden\?token=abc$/,
  );
});

test("zonder naam van de avond is de zaal de kop, zonder ticketlink geen ticketregel", () => {
  const bare: Show = {
    ...show,
    title: null,
    ticketUrl: null,
    note: "",
    time: null,
  };
  const { subject, lines } = mail(bare);
  const text = lines.join("\n");
  assert.equal(subject, "Nieuwe show: Loburg, Wageningen — Static Line");
  assert.match(text, /LOBURG, WAGENINGEN\n10 november 2026\n\n/);
  assert.doesNotMatch(text, /Tickets:/);
});

test("in het Engels: Engelse tekst, Engelse datum en de Engelse agenda", () => {
  const { subject, lines } = mail(show, "en");
  const text = lines.join("\n");
  assert.equal(subject, "New show: LoBandNight — Static Line");
  assert.match(text, /10 November 2026 · 20:00/);
  assert.match(text, /All shows: https:\/\/www\.staticline\.nl\/en\/agenda/);
});

test("de naam van de show", () => {
  assert.equal(showName(show), "LoBandNight");
  assert.equal(showName({ ...show, title: null }), "Loburg, Wageningen");
  assert.equal(showName({ ...show, title: null, city: "" }), "Loburg");
});

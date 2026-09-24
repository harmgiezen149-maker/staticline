import assert from "node:assert/strict";
import { test } from "node:test";

import { nl } from "../content/nl.ts";
import { announcementMail } from "./announce-mail.ts";
import { issueMail } from "./issue-mail.ts";
import { listMailHtml } from "./list-mail-html.ts";
import type { Show } from "./shows.ts";

const SITE = "https://www.staticline.nl";

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

const showHtml = () =>
  announcementMail({
    show,
    copy: nl.mail,
    locale: "nl",
    site: SITE,
    unsubscribeUrl: `${SITE}/nieuwsbrief/afmelden?token=abc`,
  }).html;

test("de showmail heeft het wordmark, de rode balk, de ticketknop en de afmeldlink", () => {
  const html = showHtml();
  assert.match(
    html,
    /src="https:\/\/www\.staticline\.nl\/assets\/staticline-wordmark-flat\.png"/,
  );
  assert.match(html, /bgcolor="#b33a28"/);
  assert.match(html, />10\.11</);
  assert.match(html, />2026 · 20:00</);
  assert.match(html, />LoBandNight</);
  assert.match(html, />Loburg, Wageningen</);
  assert.match(
    html,
    /href="https:\/\/www\.loburg\.com\/events\/lobandnight-8\/"[^>]*>Tickets</,
  );
  assert.match(html, /href="https:\/\/www\.staticline\.nl\/agenda"/);
  assert.match(
    html,
    /href="https:\/\/www\.staticline\.nl\/nieuwsbrief\/afmelden\?token=abc"[^>]*>Afmelden of instellingen aanpassen</,
  );
});

test("zonder ticketlink geen knop", () => {
  const html = announcementMail({
    show: { ...show, ticketUrl: null },
    copy: nl.mail,
    locale: "nl",
    site: SITE,
    unsubscribeUrl: "u",
  }).html;
  assert.doesNotMatch(html, />Tickets</);
});

test("wat de band typt, gaat nooit als HTML de mail in", () => {
  const { html } = issueMail({
    issue: {
      subject_nl: "<b>Nieuws</b>",
      body_nl:
        "Hoi,\n\n<script>alert(1)</script>\nKijk op https://www.staticline.nl/fotos",
      subject_en: "",
      body_en: "",
    },
    locale: "nl",
    copy: nl.mail,
    preferences: "p",
    site: SITE,
  });
  assert.doesNotMatch(html, /<script>|<b>Nieuws/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<a href="https:\/\/www\.staticline\.nl\/fotos"/);
  // De voorvertoning slaat de aanhef over.
  assert.match(
    html,
    /mso-hide:all;">&lt;script&gt;alert\(1\)&lt;\/script&gt;</,
  );
});

test("een link wordt alleen een link als hij met http(s) begint", () => {
  const html = listMailHtml({
    lang: "nl",
    site: SITE,
    title: "t",
    preheader: "p",
    blocks: [{ kind: "link", href: "javascript:alert(1)", label: "klik" }],
    signature: "s",
    reason: "r",
    preferences: { href: "https://x", label: "l" },
  });
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /href="#"/);
});

test("de huisstijl: geen afgeronde hoeken en geen schaduwen", () => {
  const html = showHtml();
  assert.doesNotMatch(html, /border-radius|box-shadow|text-shadow/);
  assert.match(html, /color-scheme" content="dark"/);
});

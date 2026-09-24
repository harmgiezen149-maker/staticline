import assert from "node:assert/strict";
import { test } from "node:test";

import { en } from "../content/en.ts";
import { nl } from "../content/nl.ts";
import { issueMail, issueText, missing } from "./issue-mail.ts";

const issue = {
  subject_nl: "Nieuwe foto's online",
  body_nl:
    "\n\nHoi,\n\nDe foto's van de repetitie staan erop:\nhttps://www.staticline.nl/fotos\n\n\n",
  subject_en: "",
  body_en: "",
};

test("de tekst gaat erin zoals hij geschreven is, met ondertekening en voet eronder", () => {
  const { subject, lines } = issueMail({
    issue,
    locale: "nl",
    copy: nl.mail,
    preferences: "https://x/afmelden?token=t",
  });
  assert.equal(subject, "Nieuwe foto's online");
  assert.deepEqual(lines.slice(0, 4), [
    "Hoi,",
    "",
    "De foto's van de repetitie staan erop:",
    "https://www.staticline.nl/fotos",
  ]);
  assert.equal(lines[4], "");
  assert.equal(lines[5], nl.mail.signature);
  assert.match(
    lines.at(-1) ?? "",
    /Afmelden, of ook ander nieuws ontvangen: https:\/\/x\/afmelden\?token=t$/,
  );
});

test("zonder Engelse versie krijgt een Engelstalige abonnee de Nederlandse tekst, met Engelse voet", () => {
  const { subject, lines } = issueMail({
    issue,
    locale: "en",
    copy: en.mail,
    preferences: "p",
  });
  assert.equal(subject, "Nieuwe foto's online");
  assert.match(lines.at(-1) ?? "", /^You're getting this/);
});

test("met Engelse versie krijgt een Engelstalige abonnee die", () => {
  const both = {
    ...issue,
    subject_en: "New photos online",
    body_en: "Hi,\n\nNew photos.",
  };
  assert.equal(issueText(both, "en").subject, "New photos online");
  assert.equal(issueText(both, "nl").subject, "Nieuwe foto's online");
});

test("half vertaald telt als niet vertaald, en wordt bij versturen tegengehouden", () => {
  const half = { ...issue, subject_en: "New photos online" };
  assert.equal(issueText(half, "en").subject, "Nieuwe foto's online");
  assert.match(missing(half) ?? "", /allebei/);
});

test("zonder onderwerp of tekst is hij niet klaar", () => {
  assert.match(missing({ ...issue, subject_nl: " " }) ?? "", /onderwerp/);
  assert.match(missing({ ...issue, body_nl: "\n" }) ?? "", /tekst/);
  assert.equal(missing(issue), null);
});

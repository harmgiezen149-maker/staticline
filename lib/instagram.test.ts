import assert from "node:assert/strict";
import { test } from "node:test";

import { fingerprint, handleFrom, parsePosts, pickToken, readStored, shortCaption } from "./instagram.ts";

const photo = {
  id: "1",
  caption: "Repetitie gisteren\n#staticline #ede",
  media_type: "IMAGE",
  media_url: "https://scontent.cdninstagram.com/a.jpg",
  permalink: "https://www.instagram.com/p/AAA/",
};

test("een foto wordt een tegel, met de eerste regel als alt", () => {
  assert.deepEqual(parsePosts({ data: [photo] }), [
    {
      id: "1",
      href: "https://www.instagram.com/p/AAA/",
      image: "https://scontent.cdninstagram.com/a.jpg",
      alt: "Repetitie gisteren",
      isVideo: false,
    },
  ]);
});

test("bij een video het stilstaande voorbeeld", () => {
  const [post] = parsePosts({
    data: [{ ...photo, media_type: "VIDEO", media_url: "https://x.cdninstagram.com/v.mp4", thumbnail_url: "https://x.cdninstagram.com/t.jpg" }],
  });
  assert.equal(post.image, "https://x.cdninstagram.com/t.jpg");
  assert.equal(post.isVideo, true);
});

test("een carrousel toont zijn eerste beeld", () => {
  const [post] = parsePosts({ data: [{ ...photo, media_type: "CAROUSEL_ALBUM" }] });
  assert.equal(post.image, photo.media_url);
});

test("zonder beeld over https of zonder link naar instagram.com: weg", () => {
  assert.equal(parsePosts({ data: [{ ...photo, media_url: "http://x/a.jpg" }] }).length, 0);
  assert.equal(parsePosts({ data: [{ ...photo, media_type: "VIDEO" }] }).length, 0);
  assert.equal(parsePosts({ data: [{ ...photo, permalink: "https://evil.example/p/AAA/" }] }).length, 0);
  assert.equal(parsePosts({ data: [{ ...photo, permalink: "javascript:alert(1)" }] }).length, 0);
});

test("hooguit zes, en een vreemd antwoord geeft niets", () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ ...photo, id: String(i) }));
  assert.equal(parsePosts({ data: many }).length, 6);
  assert.deepEqual(parsePosts({ error: { message: "x" } }), []);
  assert.deepEqual(parsePosts(null), []);
});

test("lange bijschriften worden op een woordgrens ingekort", () => {
  const long = "Wat een avond ".repeat(20);
  const short = shortCaption(long, 40);
  assert.ok(short.length <= 41);
  assert.ok(short.endsWith("…"));
  assert.ok(!short.includes("  "));
  assert.equal(shortCaption(undefined), "");
  assert.equal(shortCaption("\n\n  Hoi  \nrest"), "Hoi");
});

test("de naam uit de profiellink", () => {
  assert.equal(handleFrom("https://www.instagram.com/staticline.band/"), "@staticline.band");
  assert.equal(handleFrom("https://instagram.com/staticline?igsh=abc"), "@staticline");
  assert.equal(handleFrom("https://www.instagram.com/p/AAA/extra"), null);
  assert.equal(handleFrom(undefined), null);
});

test("welke sleutel geldt", () => {
  const env = "IGAA-eerste";
  const refreshed = { token: "IGAA-vernieuwd", from: fingerprint(env) };
  // Vernieuwd uit de sleutel die nu in Vercel staat: de vernieuwde.
  assert.equal(pickToken(env, refreshed), "IGAA-vernieuwd");
  // In Vercel vervangen: de nieuwe uit Vercel.
  assert.equal(pickToken("IGAA-nieuw", refreshed), "IGAA-nieuw");
  // Uit Vercel gehaald: de bewaarde blijft geldig.
  assert.equal(pickToken("", refreshed), "IGAA-vernieuwd");
  // Nog nooit vernieuwd.
  assert.equal(pickToken(env, null), env);
  assert.equal(pickToken(undefined, null), null);
});

test("wat er in de database staat", () => {
  assert.deepEqual(readStored(JSON.stringify({ token: "a", from: "b" })), { token: "a", from: "b" });
  assert.equal(readStored("geen json"), null);
  assert.equal(readStored(JSON.stringify({ from: "b" })), null);
  assert.equal(readStored(undefined), null);
});

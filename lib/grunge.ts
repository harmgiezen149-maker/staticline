/**
 * Rekenwerk voor /grunge, zonder React, zodat het te testen is.
 */

/** Tekst met *sterretjes* als stukken, cursief of niet. */
export function richParts(text: string): { text: string; italic: boolean }[] {
  return text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) =>
      part.length > 2 && part.startsWith("*") && part.endsWith("*")
        ? { text: part.slice(1, -1), italic: true }
        : { text: part, italic: false },
    );
}

/** Een artiestnaam om te vergelijken: kleine letters, zonder "The" vooraan. */
const norm = (name: string) =>
  name
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * De nummers uit de eigen setlist van bands die op de pagina staan
 * ("Uit onze set"). Een nummer van "Nirvana" of "Nirvana feat. …" telt; een
 * band met dezelfde letters erin ("Live" in "Live Wire") niet: de naam moet
 * gelijk zijn of gevolgd worden door een scheidingsteken.
 */
export function songsFromPage(
  setlist: { title: string; artist: string }[],
  artists: readonly string[],
  max = 8,
): { title: string; artist: string }[] {
  const names = artists.map(norm);
  const seen = new Set<string>();
  const out: { title: string; artist: string }[] = [];
  for (const song of setlist) {
    const artist = norm(song.artist || "");
    if (!artist || !song.title) continue;
    const hit = names.some((name) => artist === name || /^[,&+/(]|^(feat|ft|met|and|x)\b/.test(artist.slice(name.length).trim()) && artist.startsWith(`${name} `));
    const key = `${artist}|${song.title.toLowerCase()}`;
    if (!hit || seen.has(key)) continue;
    seen.add(key);
    out.push(song);
    if (out.length >= max) break;
  }
  return out;
}

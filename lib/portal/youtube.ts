/**
 * Het YouTube-id uit wat iemand plakt.
 *
 * Mensen plakken het volledige adres, een korte youtu.be-link, of alleen het id.
 * Alle drie horen te werken: eisen dat er precies één vorm ingevuld wordt, is een
 * regel die niemand onthoudt, en dan staat er een halve URL in de database en
 * blijft de videopagina leeg zonder dat duidelijk is waarom.
 *
 * Een id is elf tekens uit letters, cijfers, streepje en liggend streepje. Die
 * controle staat er niet voor de vorm: deze waarde komt in het adres van een
 * embed op een publieke pagina.
 */

const ID = /^[\w-]{11}$/;

export function youtubeId(value: string): string | null {
  const input = value.trim();
  if (ID.test(input)) return input;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return ID.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    // /watch?v=…, maar ook /embed/… en /shorts/…
    const id = url.searchParams.get("v") ?? url.pathname.split("/").pop() ?? "";
    return ID.test(id) ? id : null;
  }

  return null;
}

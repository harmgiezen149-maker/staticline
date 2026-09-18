import { NextResponse, type NextRequest } from "next/server";

/**
 * Taalroutering.
 *
 * Alle pagina's staan één keer in `app/[lang]/`. De bezoeker ziet daar niets van:
 * Nederlands staat op `/`, `/agenda`, `/boeken`, en Engels op `/en`, `/en/agenda`.
 * Deze proxy schrijft het ene naar het andere om.
 *
 * Waarom omschrijven en niet doorverwijzen: het adres in de balk blijft dan
 * hetzelfde als wat er op de sticker staat. Een QR-code die eerst een redirect
 * maakt, kost een extra rondje op een slechte verbinding in een parkeerterrein —
 * precies het geval waar docs/02-architecture.md op stuurt.
 *
 * Er wordt hier bewust niet naar de taalvoorkeur van de browser gekeken. Een
 * Nederlandse band met een Nederlands publiek hoort op de Nederlandse versie uit
 * te komen, ook als iemands telefoon op Engels staat. De taalwissel in de kop is
 * de manier om iets anders te kiezen, en die keuze staat in het adres — dus is
 * hij deelbaar en vindbaar voor zoekmachines.
 *
 * In Next.js 16 heet dit bestand `proxy.ts`; tot versie 15 heette hetzelfde
 * mechanisme middleware.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // `/nl` en `/nl/...` bestaan niet als adres: Nederlands woont op de wortel.
  // Zonder deze regel zou elke pagina op twee adressen te bereiken zijn, en dat
  // is precies wat zoekmachines als dubbele inhoud aanrekenen.
  if (pathname === "/nl" || pathname.startsWith("/nl/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url);
  }

  // Engels matcht de `[lang]`-map al op zijn eigen adres.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return NextResponse.next();
  }

  // Al het overige is Nederlands en wordt naar `/nl/...` geschreven.
  const url = request.nextUrl.clone();
  url.pathname = `/nl${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  /**
   * Alles behalve de interne paden van Next, de API-routes en bestanden met een
   * extensie in de naam. Zonder die laatste uitzondering zou `/assets/grain.png`
   * naar `/nl/assets/grain.png` geschreven worden en dus verdwijnen.
   */
  matcher: [
    "/((?!_next/|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|assets/|.*\\.[^/]+$).*)",
  ],
};

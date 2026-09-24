import { NextResponse } from "next/server";

import { isLocale, localePath } from "@/lib/i18n";
import { setNews, unsubscribe } from "@/lib/newsletter";

/**
 * Afmelden, of ander nieuws aan- en uitzetten.
 *
 * Afmelden kan op twee manieren:
 *
 * 1. De knop "afmelden" in het mailprogramma zelf (Gmail, Apple Mail). Die stuurt
 *    een POST met `List-Unsubscribe=One-Click` naar het adres uit de kop
 *    List-Unsubscribe (RFC 8058). Het antwoord leest niemand; een 200 is genoeg.
 * 2. Het formulier op /nieuwsbrief/afmelden, achter de link onderaan de mail.
 *    Dat krijgt een doorverwijzing terug naar dezelfde pagina, met de uitkomst.
 *    Op die pagina staan ook de knoppen voor ander nieuws; die sturen `action`
 *    mee ("news-on" of "news-off").
 *
 * Alleen POST en nooit GET. Mailscanners van bedrijven openen elke link in een
 * mail om te kijken of hij veilig is; als openen al afmeldde, stond de halve
 * lijst er na één ronde af zonder dat iemand iets gedaan had.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? undefined;
  const form = await request.formData().catch(() => null);

  const key = token ?? String(form?.get("token") ?? "");

  if (form?.get("List-Unsubscribe") === "One-Click") {
    const result = await unsubscribe(key);
    return new NextResponse(null, { status: result === "error" ? 500 : 200 });
  }

  const action = String(form?.get("action") ?? "unsubscribe");
  const result =
    action === "news-on" || action === "news-off"
      ? await setNews(key, action === "news-on")
      : await unsubscribe(key);
  // Bij een gelukte nieuwsinstelling zegt de uitkomst wélke; afmelden is "ok".
  const outcome = result === "ok" && action !== "unsubscribe" ? action : result;

  const raw = String(
    form?.get("locale") ?? url.searchParams.get("locale") ?? "nl",
  );
  const locale = isLocale(raw) ? raw : "nl";
  const back = new URL(localePath(locale, "/nieuwsbrief/afmelden"), url.origin);
  back.searchParams.set("uitkomst", outcome);
  // Na een nieuwsinstelling staat de sleutel er weer bij, zodat je op dezelfde
  // pagina nog kunt afmelden of terugschakelen. Na afmelden niet: die bestaat
  // niet meer.
  if (outcome === "news-on" || outcome === "news-off")
    back.searchParams.set("token", key);
  return NextResponse.redirect(back, 303);
}

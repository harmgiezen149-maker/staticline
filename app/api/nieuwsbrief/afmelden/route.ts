import { NextResponse } from "next/server";

import { isLocale, localePath } from "@/lib/i18n";
import { unsubscribe } from "@/lib/newsletter";

/**
 * Afmelden, op twee manieren.
 *
 * 1. De knop "afmelden" in het mailprogramma zelf (Gmail, Apple Mail). Die stuurt
 *    een POST met `List-Unsubscribe=One-Click` naar het adres uit de kop
 *    List-Unsubscribe (RFC 8058). Het antwoord leest niemand; een 200 is genoeg.
 * 2. Het formulier op /nieuwsbrief/afmelden, achter de link onderaan de mail.
 *    Dat krijgt een doorverwijzing terug naar dezelfde pagina, met de uitkomst.
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

  const result = await unsubscribe(token ?? String(form?.get("token") ?? ""));

  if (form?.get("List-Unsubscribe") === "One-Click") {
    return new NextResponse(null, { status: result === "error" ? 500 : 200 });
  }

  const raw = String(
    form?.get("locale") ?? url.searchParams.get("locale") ?? "nl",
  );
  const locale = isLocale(raw) ? raw : "nl";
  const back = new URL(localePath(locale, "/nieuwsbrief/afmelden"), url.origin);
  back.searchParams.set("uitkomst", result);
  return NextResponse.redirect(back, 303);
}

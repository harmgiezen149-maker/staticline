import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/portal/session";

/**
 * De sleutelafgifte voor het uploaden van een foto.
 *
 * De browser stuurt het bestand niet hierlangs maar rechtstreeks naar de opslag
 * van Vercel. Dat is niet alleen sneller: een serverloze functie op Vercel neemt
 * hooguit 4,5 MB aan verzoek aan, en een fatsoenlijke bandfoto zit daar zo
 * overheen. Deze route geeft alleen een kortlopende sleutel af waarmee de
 * browser dat zelf mag doen.
 *
 * De rechtencontrole staat daarom in `onBeforeGenerateToken`. Dat is het moment
 * waarop het verzoek nog van de ingelogde beheerder komt en het koekje dus
 * meekomt.
 *
 * `onUploadCompleted` gebruiken we niet. Dat is een aanroep die Vercel zelf doet
 * nadat het uploaden klaar is, zónder koekje, en hij komt lokaal helemaal niet
 * binnen. De rij in de database wordt daarom door de browser aangemeld, via een
 * server action die opnieuw op beheerdersrechten controleert.
 */

/** Wat een browser mag tonen zonder dat er iets uitgevoerd wordt. */
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Tien megabyte. Ruim voor een persfoto, krap genoeg om misbruik te beperken. */
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "onleesbaar" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await getSession();
        if (!session || session.role !== "admin") {
          // Deze fout komt als 400 terug bij de browser; de tekst is voor de
          // beheerder die zich afvraagt waarom het niet lukt.
          throw new Error("Alleen een ingelogde beheerder kan foto's uploaden.");
        }

        return {
          allowedContentTypes: ALLOWED,
          maximumSizeInBytes: MAX_BYTES,
          // Twee foto's die toevallig "band.jpg" heten mogen elkaar niet
          // overschrijven.
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[beheer] upload geweigerd:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "upload mislukt" },
      { status: 400 },
    );
  }
}

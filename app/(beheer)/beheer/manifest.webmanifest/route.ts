import { NextResponse } from "next/server";

/**
 * Het manifest van de beheer-app.
 *
 * Waarom hier en niet als `app/manifest.ts`: dat is de conventie van Next, maar
 * die zet het bestand op `/manifest.webmanifest` — één manifest voor het hele
 * domein. Dit domein draagt drie applicaties: de Nederlandse site, de Engelse
 * site en het beheer. Alleen de laatste hoort installeerbaar te zijn; een
 * bezoeker die de agenda leest, hoeft geen app op zijn beginscherm. Een eigen
 * adres onder /beheer houdt dat uit elkaar en laat de publieke kant vrij om er
 * later alsnog een eigen manifest bij te krijgen.
 *
 * `scope` bepaalt wat er binnen het appvenster blijft. Buiten /beheer — een
 * link naar de publieke site of naar de Band App — opent de browser, en dat is
 * precies goed: dat zijn andere applicaties.
 */

// Uit styles/tokens.css. Het startscherm van de geïnstalleerde app en de balk
// eromheen krijgen dezelfde kleur als de pagina, zodat er niets verspringt.
const BG = "#0d0f12";

const icon = (name: string, sizes: string, purpose?: "maskable") => ({
  src: `/beheer/${name}`,
  sizes,
  type: "image/png",
  ...(purpose ? { purpose } : {}),
});

export function GET() {
  return NextResponse.json(
    {
      id: "/beheer",
      name: "Static Line beheer",
      short_name: "SL Beheer",
      description: "Boekingen, nieuwsbrief, pagina-inhoud en teksten van Static Line.",
      start_url: "/beheer",
      scope: "/beheer",
      lang: "nl",
      display: "standalone",
      background_color: BG,
      theme_color: BG,
      icons: [
        icon("icon-192.png", "192x192"),
        icon("icon-512.png", "512x512"),
        icon("icon-192-maskable.png", "192x192", "maskable"),
        icon("icon-512-maskable.png", "512x512", "maskable"),
      ],
      // Ingedrukt houden op het icoon opent deze rechtstreeks. De drie schermen
      // waar iets te dóén valt; de rest is opzoekwerk.
      shortcuts: [
        { name: "Boekingen", url: "/beheer/boekingen" },
        { name: "Tone of voice", url: "/beheer/tov" },
        { name: "Band App", url: "/beheer/bandapp" },
      ],
    },
    {
      headers: {
        "content-type": "application/manifest+json",
        // Een manifest verandert zelden, maar als het verandert wil je niet dat
        // een geïnstalleerde app een dag op het oude blijft staan.
        "cache-control": "public, max-age=0, must-revalidate",
      },
    },
  );
}

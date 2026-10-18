import { ScreenLoop } from "@/components/screen/ScreenLoop";
import { pickFormat } from "@/lib/screen";
import { loadScreen } from "@/lib/screen-store";
import { getWordmark } from "@/lib/site-content";

/**
 * /scherm — zie app/(scherm)/layout.tsx en components/screen/ScreenLoop.tsx.
 *
 * `?formaat=9:16` (of 16:9, 4:3, 1:1, auto) zet het formaat voor dit ene scherm,
 * los van de instelling in /beheer/scherm. `?voorbeeld=1` is voor het
 * voorbeeld in het beheer: dan geen volledig-schermknop en geen wake lock.
 */
export default async function Page({ searchParams }: PageProps<"/scherm">) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const [config, wordmark] = await Promise.all([loadScreen(), getWordmark()]);

  return (
    <ScreenLoop
      initial={config}
      wordmark={{ src: wordmark.src, width: wordmark.width, height: wordmark.height }}
      format={one(params.formaat) ? pickFormat(one(params.formaat), config) : null}
      preview={one(params.voorbeeld) === "1"}
    />
  );
}

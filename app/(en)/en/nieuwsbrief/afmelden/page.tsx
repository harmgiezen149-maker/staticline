import type { Metadata } from "next";

import { UnsubscribePage } from "@/components/pages/UnsubscribePage";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...pageMetadata(
    "en",
    "/nieuwsbrief/afmelden",
    getCopy("en").unsubscribe.title,
  ),
  // Alleen het eindpunt van een link uit een mail, met een sleutel erin.
  robots: { index: false, follow: false },
};

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string | string[];
    uitkomst?: string | string[];
  }>;
}) {
  const { token, uitkomst } = await searchParams;
  return (
    <UnsubscribePage
      locale="en"
      token={first(token)}
      outcome={first(uitkomst)}
    />
  );
}

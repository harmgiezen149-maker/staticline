import type { Metadata } from "next";

import { ConfirmPage } from "@/components/pages/ConfirmPage";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...pageMetadata("nl", "/nieuwsbrief/bevestigen", getCopy("nl").confirm.title),
  // Deze pagina bestaat alleen als eindpunt van een link uit een mail. Er valt
  // niets te vinden, en een sleutel in de zoekresultaten is niet de bedoeling.
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <ConfirmPage
      locale="nl"
      token={Array.isArray(token) ? token[0] : token}
    />
  );
}

import type { Metadata } from "next";

import { AgendaPage } from "@/components/pages/AgendaPage";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata(
  "en",
  "/agenda",
  getCopy("en").agenda.title,
);

export default function Page() {
  return <AgendaPage locale="en" />;
}

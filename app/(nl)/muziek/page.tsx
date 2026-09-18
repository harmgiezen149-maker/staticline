import type { Metadata } from "next";

import { MusicPage } from "@/components/pages/MusicPage";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata(
  "nl",
  "/muziek",
  getCopy("nl").music.title,
);

export default function Page() {
  return <MusicPage locale="nl" />;
}

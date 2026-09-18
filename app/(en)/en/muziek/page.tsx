import type { Metadata } from "next";

import { MusicPage } from "@/components/pages/MusicPage";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata(
  "en",
  "/muziek",
  getCopy("en").music.title,
);

export default function Page() {
  return <MusicPage locale="en" />;
}

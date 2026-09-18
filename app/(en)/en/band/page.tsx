import type { Metadata } from "next";

import { BandPage } from "@/components/pages/BandPage";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata(
  "en",
  "/band",
  getCopy("en").band.title,
);

export default function Page() {
  return <BandPage locale="en" />;
}

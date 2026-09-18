import type { Metadata } from "next";

import { GalleryPage } from "@/components/pages/GalleryPage";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata(
  "en",
  "/fotos",
  getCopy("en").gallery.title,
);

export default function Page() {
  return <GalleryPage locale="en" />;
}

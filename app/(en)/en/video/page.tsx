import type { Metadata } from "next";

import { VideoPage } from "@/components/pages/VideoPage";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata(
  "en",
  "/video",
  getCopy("en").video.title,
);

export default function Page() {
  return <VideoPage locale="en" />;
}

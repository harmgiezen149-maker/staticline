import type { Metadata } from "next";

import { GrungePage } from "@/components/pages/GrungePage";
import { getGrunge } from "@/content/grunge";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...pageMetadata("en", "/grunge", getGrunge("en").meta.title),
  description: getGrunge("en").meta.description,
};

export default function Page() {
  return <GrungePage locale="en" />;
}

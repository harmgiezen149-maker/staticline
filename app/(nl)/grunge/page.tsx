import type { Metadata } from "next";

import { GrungePage } from "@/components/pages/GrungePage";
import { getGrunge } from "@/content/grunge";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...pageMetadata("nl", "/grunge", getGrunge("nl").meta.title),
  description: getGrunge("nl").meta.description,
};

export default function Page() {
  return <GrungePage locale="nl" />;
}

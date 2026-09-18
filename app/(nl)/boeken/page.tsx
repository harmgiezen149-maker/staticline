import type { Metadata } from "next";

import { BookingPage } from "@/components/pages/BookingPage";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata(
  "nl",
  "/boeken",
  getCopy("nl").booking.title,
);

export default function Page() {
  return <BookingPage locale="nl" />;
}

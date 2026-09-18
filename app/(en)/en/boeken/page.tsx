import type { Metadata } from "next";

import { BookingPage } from "@/components/pages/BookingPage";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata(
  "en",
  "/boeken",
  getCopy("en").booking.title,
);

export default function Page() {
  return <BookingPage locale="en" />;
}

import type { Metadata } from "next";

import { getCopy } from "@/content";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

/** De Engelse kant van de site. Zie app/(nl)/layout.tsx voor de opzet. */
const copy = getCopy("en");

export const metadata: Metadata = {
  title: { default: copy.meta.title, template: `%s — ${copy.meta.title}` },
  description: copy.meta.description,
};

export default function EnLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="bg-base text-primary">{children}</body>
    </html>
  );
}

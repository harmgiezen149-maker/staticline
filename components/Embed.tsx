"use client";

import { useState } from "react";

import type { Copy } from "@/content";

/**
 * Een embed van Spotify of YouTube die pas laadt na een klik.
 *
 * Waarom niet gewoon de iframe neerzetten: allebei die diensten zetten cookies en
 * halen honderden kilobytes binnen zodra de pagina laadt, ook bij iemand die
 * alleen even de agenda kwam bekijken. Dat is slecht voor de laadtijd op 4G — het
 * geval waar docs/02-architecture.md op stuurt — en het zou een cookiebanner
 * nodig maken die de site nu niet heeft.
 *
 * Met een klik erbij laadt er niets tot de bezoeker het zelf wil. Dat is ook wat
 * docs/02 voorstelt voor de introfilm.
 *
 * GEËXTRAPOLEERD: de knop volgt de ghost-knop uit de hero.
 */
export function Embed({
  src,
  title,
  service,
  height,
  copy,
}: {
  src: string;
  title: string;
  service: "Spotify" | "YouTube";
  height: number;
  copy: Copy["embed"];
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        src={src}
        title={title}
        height={height}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        className="w-full border border-line"
      />
    );
  }

  return (
    <div
      className="flex flex-col items-start justify-center gap-3 border border-line bg-inset p-6"
      style={{ minHeight: height }}
    >
      <p className="font-display text-18 font-semibold tracking-tight4 uppercase">
        {title}
      </p>
      <p className="max-w-[420px] font-mono text-11 leading-[18px] tracking-wide10 text-faint">
        {copy.note.replace("{service}", service)}
      </p>
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className="min-h-11 border border-line-strong px-6 py-3 font-display text-15 font-bold tracking-wide12 text-primary uppercase transition-colors duration-[120ms] hover:border-primary"
      >
        {copy.load.replace("{service}", service)}
      </button>
    </div>
  );
}

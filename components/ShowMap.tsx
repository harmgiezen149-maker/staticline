"use client";

import { useEffect, useRef } from "react";

import type { Show } from "@/lib/shows";

/**
 * De kaart op de agendapagina.
 *
 * GEËXTRAPOLEERD, niet ontworpen. Leaflet met tegels van OpenStreetMap: gratis,
 * geen sleutel, geen betaalgegevens en geen gebruikslimiet. Google Maps zou voor
 * een kaartje met een handvol spelden een account met creditcard vragen.
 *
 * De tegels zijn van CARTO's donkere stijl, want een lichte kaart op een
 * dark-only site is een wit vlak midden op de pagina. De spelden zijn geen
 * plaatjes maar `divIcon`s met de accentkleur eruit, zodat er geen afbeelding bij
 * komt en de kleur uit de tokens blijft komen.
 *
 * Leaflet wordt pas ingeladen als deze component gemonteerd wordt, en de
 * agendapagina toont hem alleen als er ook echt coördinaten zijn — geen kaart is
 * beter dan een lege wereldbol.
 */
export function ShowMap({ shows }: { shows: Show[] }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = container.current;
    if (!node) return;

    // Met een pijl naar een lokale variabele, zodat de opruimfunctie hetzelfde
    // object opruimt dat hier gemaakt is.
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      // De stylesheet van Leaflet hoort bij de kaart en niet bij de rest van de
      // site; hem hier laden houdt hem uit de CSS van elke andere pagina.
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;

      const points = shows.filter(
        (show): show is Show & { lat: number; lng: number } =>
          show.lat !== null && show.lng !== null,
      );
      if (points.length === 0) return;

      map = L.map(node, {
        // Scrollen over de kaart hoort de pagina te scrollen, niet in te zoomen.
        // Op een telefoon is dat het verschil tussen langs de kaart komen en
        // erin vast komen te zitten.
        scrollWheelZoom: false,
        attributionControl: true,
      });

      /**
       * De tegels.
       *
       * Hier stond `basemaps.cartocdn.com/dark_all`. Dat was jarenlang gratis,
       * maar CARTO vraagt er inmiddels een sleutel voor en drukt zonder die
       * sleutel "API KEY REQUIRED" dwars over elke tegel — op de publieke
       * agendapagina. Een kaart met een watermerk erover is erger dan geen kaart.
       *
       * Nu de gewone tegels van OpenStreetMap, die geen sleutel vragen. Die zijn
       * licht, en dit ontwerp kent geen lichte vlakken; ze worden daarom in de
       * browser donker gemaakt met een filter op de tegellaag (zie
       * `.kaart-donker` in globals.css). Het filter zit op de laag en niet op de
       * kaart, zodat de speld zijn accentkleur houdt.
       *
       * Geen sleutel in een omgevingsvariabele: de kaart is een extraatje naast
       * de lijst erboven, en een extraatje hoort niet stuk te gaan omdat iemand
       * vergeten is iets in te vullen.
       */
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: "kaart-donker",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: '<span style="display:block;width:14px;height:14px;background:var(--accent);border:2px solid var(--text-primary)"></span>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const markers = points.map((show) =>
        L.marker([show.lat, show.lng], {
          icon,
          title: [show.venue, show.city].filter(Boolean).join(", "),
        }).addTo(map!),
      );

      map.fitBounds(L.latLngBounds(markers.map((m) => m.getLatLng())), {
        padding: [40, 40],
        maxZoom: 13,
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [shows]);

  return (
    <div
      ref={container}
      className="h-[320px] w-full border border-line bg-inset sm:h-[420px]"
      // De kaart is een extraatje naast de lijst erboven, die dezelfde gegevens
      // bevat en wél te lezen is met een schermlezer.
      role="presentation"
    />
  );
}

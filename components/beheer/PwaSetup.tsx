"use client";

import { useEffect } from "react";

/**
 * Registreert de service worker van het beheer.
 *
 * `scope: "/beheer"` en niet de standaardwaarde. Het bestand staat in
 * public/beheer/, dus standaard zou hij alleen over `/beheer/…` gaan en niet
 * over `/beheer` zelf — het adres waar de geïnstalleerde app op opstart. De kop
 * `Service-Worker-Allowed` in next.config.ts staat deze ruimere scope toe.
 *
 * Staat in de layout van het besloten deel en nergens anders. De publieke site
 * heeft geen service worker en hoort er geen te krijgen: daar valt niets te
 * installeren en niets offline te bewaren.
 */
export function PwaSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/beheer/sw.js", { scope: "/beheer" }).catch(() => {
      // Mislukt hij, dan is er niets stuk: het beheer werkt gewoon in de
      // browser. Alleen installeren zit er dan niet in.
    });
  }, []);

  return null;
}

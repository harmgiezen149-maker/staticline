// De service worker van de beheer-app.
//
// Bewust bijna leeg, en dat is een besluit en geen luiheid.
//
// Wat er hier te zien valt — boekingen, abonnees, pagina-inhoud, het logboek —
// komt allemaal uit de database. Zonder bereik valt er niets zinnigs te tonen,
// dus er is niets te winnen met het bewaren van pagina's. En er is wel iets te
// verliezen: deze pagina's staan achter een inlog, en een bewaarde pagina blijft
// op het toestel staan ook nadat iemand uitgelogd is. Een boekingsaanvraag met
// een naam, adres en telefoonnummer in de cache van een telefoon is geen prijs
// die dit waard is.
//
// Daarom slaat deze service worker nooit een antwoord van de server op. Hij doet
// twee dingen:
//
//   1. Hij bestaat, met een fetch-afhandelaar erin. Dat is wat een browser wil
//      zien voordat hij de app aanbiedt om te installeren — de eigenlijke reden
//      dat dit bestand er is.
//   2. Hij toont een eigen pagina als het netwerk wegvalt, in plaats van de
//      dinosaurus van de browser. Die pagina staat hieronder in de cache en is
//      het enige wat erin komt; er staat niets persoonlijks op.
//
// De Band App doet dit uitgebreider (zie public/sw.js daar: die bewaart de
// setlist zodat je hem in een kelder zonder bereik kunt lezen). Dat is daar de
// moeite waard en hier niet.
const CACHE = "sl-beheer-v1";
const OFFLINE = "/beheer/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Alleen het opvragen van een pagina. Formulieren, server actions en /api gaan
// hier ongemoeid langs: die hebben een netwerk nodig en een halve afhandeling
// zou erger zijn dan een foutmelding.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.mode !== "navigate") return;

  event.respondWith(
    // Netwerk eerst, altijd. De cache komt alleen in beeld als er geen netwerk
    // is — nooit als het er wel is en het antwoord toevallig traag is.
    fetch(request).catch(async () => (await caches.match(OFFLINE)) || Response.error())
  );
});

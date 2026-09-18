// Een opgenomen antwoord van /api/public van de Band App, om de site lokaal te
// kunnen bekijken zonder die app te draaien. Geen productiecode: start hem met
//   node scripts/band-app-fixture.mjs
// en zet BAND_APP_URL=http://127.0.0.1:4010 in .env.local.
import { createServer } from "node:http";

const body = {
  band: { name: "Static Line", bio: "", logoUrl: "" },
  members: [
    { id: 1, name: "Harm Giezen", role: "Bassist", instrument: "Bas", bio: "", photoUrl: null },
    { id: 4, name: "Vedran", role: "Leadzang", instrument: "", bio: "Hoi, ik ben vedran. Ik fiets graag.", photoUrl: null },
    { id: 5, name: "Niels Verdel", role: "Drummer", instrument: "Drums", bio: "", photoUrl: null },
    { id: 6, name: "Quinten van Dreven", role: "Ritmegitarist", instrument: "Gitaar", bio: "", photoUrl: null },
  ],
  gigs: [
    { id: 14, mon: "Nov", day: "10", time: "20:00", title: "Loburg, Wageningen", date: "2026-11-10T20:00:00.000Z" },
  ],
  setlistSections: [],
  setlist: [],
  pastGigs: [],
  updatedAt: new Date().toISOString(),
};

createServer((req, res) => {
  if (!req.url.startsWith("/api/public")) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": "application/json", "cache-control": "public, max-age=60" });
  res.end(JSON.stringify(body));
}).listen(4010, "127.0.0.1", () => console.log("fixture op http://127.0.0.1:4010/api/public"));

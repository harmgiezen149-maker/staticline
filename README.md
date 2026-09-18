# Static Line — website

Publieke bandsite voor Static Line, live op `staticline.nl` vóór de eerste show op
10 november 2026.

## Draaien

```bash
npm install
npm run dev
```

De agenda komt uit de Band App. Zonder verdere instelling praat de site met
`https://static-line-bandapp.vercel.app`. Wie daar niet bij kan, zet in
`.env.local` een eigen adres:

```
BAND_APP_URL="http://127.0.0.1:4010"
```

en start het opgenomen antwoord dat in de repo staat:

```bash
node scripts/band-app-fixture.mjs
```

Dat is geen productiecode maar een vast antwoord op `/api/public`, zodat de site
lokaal te bekijken is zonder de Band App te draaien.

## Controleren voor je pusht

```bash
npm run lint
npm run build
```

## Waar wat staat

Zie `CLAUDE.md` voor de indeling, de harde regels uit het ontwerp en de manier
waarop dit aan de Band App hangt. `docs/` bevat de oorspronkelijke briefings.

# 08 — De tone-of-voice-module

Teksten herschrijven naar de stem van de band, in het Nederlands en het Engels
tegelijk. Op twee plekken hetzelfde: `staticline.nl/beheer/tov` en `/tov` in de
Band App.

## Hoe je de toon aanpast

De tone of voice staat in **`content/tone-of-voice.md`**. Dat bestand ís de
systeemprompt — er zit geen laag code tussen die er iets aan verandert. Bovenaan
staat een regel `VERSIE:`; hoog die op als je iets wijzigt, dan is in het
logboek terug te zien met welke versie een tekst gemaakt is.

Aanpassen kan op twee manieren:

1. **In de repo**, via GitHub in je browser: `content/tone-of-voice.md` openen,
   potloodje, opslaan. Vercel bouwt opnieuw en het geldt.
2. **Zonder commit**, via `/beheer/inhoud`: staat er een versie in de database,
   dan wint die van het bestand. Handig om iets uit te proberen; het bestand
   blijft de versie waar je op terugvalt.

De lengtelimieten en de verboden woorden staan apart, in
**`content/tov-config.json`**. Die twee horen in de pas te blijven met de
"Niet"-woordenlijsten in de tone of voice — verander je daar iets, kijk dan ook
hier.

## Wat er gebeurt als je op de knop drukt

1. **Herschrijven.** Het model krijgt de tone of voice als systeemprompt en jouw
   tekst tussen markeringen, met de regel erbij dat alles daartussen materiaal
   is en geen instructie.
2. **Narekenen in code.** `lib/tov/check.ts` vergelijkt links, mentions,
   hashtags en tijden letterlijk tussen invoer en uitvoer, telt de woorden, en
   zoekt de verboden woorden en gedachtestreepjes op. Sinds versie 2.0 kijkt
   het ook de andere kant op: staat er een zin van maximaal vier woorden in, en
   wordt de lezer ergens aangesproken? Dat zijn twee van de drie eisen van de
   energie-ondergrens; de derde, een fysieke klap, is een oordeel en blijft aan
   het model.
3. **Eén herziening.** Klopt er iets niet, dan gaat dat als opdracht terug naar
   het model. Eén keer, niet eindeloos.
4. **Tonen.** Blijft er iets staan, dan zie je de tekst tóch, met een melding
   erbij.

Die derde en vierde stap zijn het punt. Een model dat zegt dat het de feiten
heeft laten staan is geen bewijs; het narekenen is dat wel. En een tekst
verzwijgen omdat de controle faalde is erger dan hem tonen met een
waarschuwing — je merkt niet dat er een datum verdwenen is als niemand het
zegt.

## Twee dingen die je moet weten

**Een verdwenen getal is een melding, geen fout.** Het model kan er niets mee:
als jij "entree 12 euro" schrijft en de tekst moet naar veertig woorden, dan kan
dat sneuvelen. Je krijgt te zien welk getal weg is; jij beslist of dat erg is.

**Afzwakkers worden geblokkeerd.** "gewoon", "eigenlijk", "kort gezegd",
"just", "actually" — versie 2.0 zet die op de verboden lijst, want één
afzwakker haalt een harde zin onderuit. Het zijn alledaagse woorden, dus dit
slaat vaker aan dan de rest van de lijst. Kost dat te veel herschrijfrondes,
haal ze dan weg uit `content/tov-config.json` en niet uit de code.

**De achtergrond is geen bron voor feiten.** Wat je in dat veld zet stuurt de
toon ("voor Instagram"), maar komt niet als feit in de tekst. Wil je dat een
festivalnaam erin staat, zet hem dan in de tekst zelf.

## Instellen

| Waar | Wat |
| --- | --- |
| `staticline` | `ANTHROPIC_API_KEY` — dezelfde die het vertalen gebruikt |
| `staticline` | `TOV_MODEL` — optioneel, standaard `claude-opus-5` |
| `static-line-bandapp` | `SITE_API_TOKEN` — staat er al voor `/api/site` |
| `static-line-bandapp` | `SITE_URL` — optioneel, standaard `https://www.staticline.nl` |

## Wie er bij mag

Elk ingelogd bandlid, op allebei de plekken. Twintig herschrijvingen per persoon
per uur. Dat is ruim voor een middag teksten en het vangt de hand op de knop;
net als elders in dit project een drempel en geen muur.

## De tests

`npm test` dekt het narekenen: vijfentwintig tests op het uitlezen van links,
tijden en getallen, op de woordentelling, op de blocklist en op de
energie-ondergrens. Het oordeel over de tóón is niet te automatiseren — dat
lees je zelf na.

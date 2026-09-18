# 07 — Instellen

Wat er in Vercel gezet moet worden, en waar de waarden vandaan komen.

Alles hieronder is optioneel in de zin dat de site het zonder doet. Waar iets
ontbreekt logt hij een waarschuwing en gaat hij door — een boeking hoort nooit te
stranden omdat een sleutel ontbreekt. Maar zonder deze vier mist de site
respectievelijk een captcha, de rider, een archief van aanvragen en een
bevestigingsmail.

Zetten doe je in Vercel: **Project `staticline` → Settings → Environment
Variables**. Zet ze voor Production én Preview, tenzij anders vermeld.

---

## 1. Database — `DATABASE_URL`

Waarvoor: boekingsaanvragen en nieuwsbriefabonnees bewaren. Zonder database wordt
een aanvraag alleen doorgestuurd naar de Band App; er blijft dan niets achter om
later in terug te zoeken.

1. In Vercel bij dit project: **Storage → Create Database → Neon (Postgres)**.
   Kies een regio in Europa (`eu-central-1` of `eu-west-2`) — dat scheelt
   latentie en houdt de gegevens binnen de EU.
2. Koppel hem aan het project `staticline`. Vercel zet `DATABASE_URL` dan zelf.
3. Maak de twee tabellen aan. Dat hoeft één keer:

   ```bash
   # lokaal, met de waarde uit Vercel in .env.local
   npm run db:setup
   ```

   Het script is idempotent, dus opnieuw draaien kan geen kwaad. Wat het aanmaakt
   staat in `db/schema.sql`: `booking_submissions` en `newsletter_subscribers`.

**Let op:** dit is een eigen database, niet die van de Band App. Die laatste
draait bij elke deploy `prisma db push` tegen zijn eigen schema en zou tabellen
die daar niet in staan als drift zien. Zie `CLAUDE.md`.

Kosten: de gratis laag van Neon is ruim voldoende voor een paar honderd
aanvragen per jaar.

---

## 2. Captcha — `NEXT_PUBLIC_TURNSTILE_SITE_KEY` en `TURNSTILE_SECRET_KEY`

Waarvoor: het boekingsformulier afschermen tegen bots. Zonder deze sleutels blijft
alleen de honeypot over, plus vijf aanvragen per uur per afzender.

> **Voeg `staticline.nl` niet als site toe bij Cloudflare.** Dat proces vraagt je
> de nameservers bij mijn.host om te zetten, en daarmee verhuist je hele DNS: de
> MX naar mijn.host, het SPF-record, de DKIM van je mailprovider, de
> Resend-records en de Vercel-records moeten dan allemaal opnieuw, met een venster
> waarin de mail stilligt.
>
> Turnstile werkt zonder dat je domein bij Cloudflare staat. Het is een losse
> dienst op accountniveau, náást "Websites" en niet erin.

1. Maak een gratis account op [dash.cloudflare.com](https://dash.cloudflare.com).
   Een creditcard is niet nodig. Word je gevraagd een site toe te voegen of je
   nameservers te wijzigen: overslaan.
2. Ga naar **Turnstile**, of rechtstreeks via
   [deze link](https://dash.cloudflare.com/?to=/:account/turnstile), die het
   onboardingproces omzeilt.
3. **Add widget**, met:

   | Veld | Waarde |
   | --- | --- |
   | Widget name | `staticline.nl — boekingsformulier` |
   | Hostnames | `staticline.nl` |
   | Widget Mode | **Managed** |

   Subdomeinen vallen er automatisch onder, dus `www.staticline.nl` werkt mee.
   Klaagt Turnstile toch over de hostnaam, voeg die dan alsnog los toe.
   **Pre-clearance** laat je uit: dat is voor sites die achter Cloudflare draaien,
   en deze draait op Vercel.

4. Je krijgt twee sleutels:

   | Cloudflare noemt het | Zet in Vercel als |
   | --- | --- |
   | Site Key | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
   | Secret Key | `TURNSTILE_SECRET_KEY` |

**Zet deze twee alleen voor Production**, anders dan de overige variabelen. Een
previewdeploy krijgt van Vercel elke keer een willekeurige hostnaam, die je niet
vooraf bij Turnstile kunt aanmelden — de captcha zou daar dus altijd falen.
Ontbreken de sleutels op Preview, dan slaat `lib/turnstile.ts` de controle over
met een waarschuwing in het log en blijven de honeypot en de snelheidsbegrenzer
staan.

De site key mag publiek — die staat in de HTML, vandaar het voorvoegsel
`NEXT_PUBLIC_`. De secret key is geheim en hoort alleen in Vercel.

Turnstile zet geen cookies waarvoor een toestemmingsbanner nodig is. Dat was de
reden om het boven reCAPTCHA te kiezen.

### Testen zonder op echte bezoekers te wachten

Cloudflare publiceert sleutels die altijd hetzelfde doen:

| Doel | Site Key | Secret Key |
| --- | --- | --- |
| Altijd goedkeuren | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Altijd weigeren | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` |

Met de tweede rij hoort het formulier "de controle is niet gelukt" te tonen, en
hoor je het daarna nog een keer te kunnen proberen zonder de pagina te herladen —
zie de reset in `components/BookingForm.tsx` voor waarom dat laatste een test
waard is.

---

## 3. Rider — `BAND_APP_RIDER_URL`

Waarvoor: de knop "Rider bekijken" op de boekingspagina. Die wijst naar de
riderpagina van de Band App, met de bezetting, de plattegrond, de inputlijst en de
tekst van de band, en een afdrukknop waarmee een zaal er een pdf van maakt.
Altijd de actuele versie, in plaats van een bijlage die iemand ooit gemaild heeft.

1. Log in op de Band App als beheerder.
2. Ga naar het riderscherm. Onderaan staat een deelbare link.
3. Zet die hele link in Vercel als `BAND_APP_RIDER_URL`. Hij ziet er zo uit:

   ```
   https://static-line-bandapp.vercel.app/rider/<sleutel>
   ```

**Let op:** wie deze link heeft, kan de rider lezen. Hij komt met deze variabele
op een openbare pagina te staan, dus dat is een bewuste keuze. Wil je hem liever
op aanvraag houden, laat de variabele dan leeg — de pagina zegt dan netjes dat de
rider op aanvraag is.

Vernieuw je de sleutel in de Band App, dan moet deze variabele mee.

---

## 4. Mail — `RESEND_API_KEY`

Waarvoor: de bevestigingsmail aan wie een boeking indient, en de bevestigingsmail
voor de nieuwsbrief. Zonder mail ziet een aanvrager alleen de bevestiging op het
scherm, en blijven nieuwsbriefaanmeldingen voorgoed onbevestigd staan — die tellen
dan dus niet mee.

Het is Resend geworden. Gratis tot 3.000 mails per maand en 100 per dag; deze site
zit daar ruim onder.

### 4.1 Account en domein

1. Maak een account op [resend.com](https://resend.com). Een creditcard is niet
   nodig.
2. **Domains → Add Domain** → `staticline.nl`.
3. Kies bij Region **EU (Ireland)**. Dat houdt de mailgegevens binnen de EU en
   scheelt latentie. Dit is niet achteraf te wijzigen zonder het domein opnieuw
   toe te voegen.

### 4.2 De DNS-records bij mijn.host

Resend toont drie records: één TXT en twee CNAME's. **Geen MX.** Zet ze bij de
registrar, náást wat er al staat.

| Type | Naam | Waarde |
| --- | --- | --- |
| `TXT` | `resend._domainkey` | `p=MIGfMA0GCSqG…` — de lange sleutel |
| `CNAME` | `rsend` | `rsend-euw1.forge.rmta.net` |
| `CNAME` | `send` | `send.forge.rmta.net` |

Neem de waarden over uit het scherm van Resend, niet uit deze tabel: de
DKIM-sleutel is per domein anders, en de regio zit verwerkt in `rsend-euw1`.

Gebruik voor de DKIM-sleutel de kopieerknop. Overtypen gaat een keer mis en een
sleutel met één teken verschil staat er wel maar werkt niet — verificatie blijft
dan rood zonder te zeggen waarom.

**Een CNAME mag als enige record op een naam staan.** Dat is geen eigenaardigheid
van mijn.host maar hoe DNS werkt. Staat er nog iets anders op `send` of `rsend` —
bijvoorbeeld een TXT uit een eerdere poging — haal dat er dan eerst af, anders
weigert PowerDNS de CNAME met een melding die iets heel anders lijkt te zeggen.

De punt aan het eind van een CNAME-waarde zet mijn.host er zelf bij.

**Je bestaande mail blijft ongemoeid, en dat is geen toeval.** Resend verstuurt
onder `send.staticline.nl`, niet onder `staticline.nl` zelf. Daardoor:

- Er komt **geen** `MX` bij. Die van jou op de apex blijft de enige, dus
  `boeking@staticline.nl` blijft binnenkomen bij mijn.host.
- Het `SPF`-record van je domein hoeft **niet** aangepast te worden. SPF kijkt naar
  het envelopadres, en dat is `send.staticline.nl` — waar via de CNAME het
  SPF-record van Resend zelf achter hangt.
- Het DKIM-record krijgt een eigen selector, `resend._domainkey`, die niet botst
  met die van mijn.host.

Raak dus je bestaande `MX`-records, je `SPF` en je `_dmarc` niet aan.

Laat "Enable Receiving" in Resend uit staan. Inkomende mail loopt via mijn.host;
Resend hoeft alleen te versturen.

Klik daarna in Resend op **Verify**. Meestal binnen een paar minuten groen; de TTL
bij mijn.host is een kwartier.

> Resend draaide vroeger op Amazon SES, met een `MX` naar
> `feedback-smtp.<regio>.amazonses.com` en een los SPF-record op `send`. Die opzet
> staat nog in veel handleidingen, deze inbegrepen tot september 2026. Kom je hem
> tegen: het scherm in je eigen Resend-account is leidend, niet de handleiding.

### 4.3 De sleutel

1. **API Keys → Create API Key**, met permissie **Sending access** en beperkt tot
   het domein `staticline.nl`. Geen full access: deze sleutel hoeft alleen te
   versturen.
2. Je ziet hem één keer. Zet hem meteen in Vercel als `RESEND_API_KEY`.

### 4.4 In Vercel

| Variabele | Waarde |
| --- | --- |
| `RESEND_API_KEY` | de sleutel uit 4.3 |
| `SITE_URL` | `https://www.staticline.nl` |

`SITE_URL` staat los van Resend maar hoort erbij: de bevestigingslink in de
nieuwsbriefmail moet een volledig adres zijn. Zonder deze variabele valt de code
terug op `https://www.staticline.nl`, dus in productie klopt het ook zonder — maar
op een previewdeploy wijst de link dan naar productie.

Twee variabelen zijn optioneel en hebben een verstandige standaard:

| Variabele | Standaard | Waarvoor |
| --- | --- | --- |
| `MAIL_FROM` | `Static Line <boeking@staticline.nl>` | de afzender |
| `MAIL_REPLY_TO` | `boeking@staticline.nl` | waar een antwoord heen gaat |

Het adres in `MAIL_FROM` moet op het geverifieerde domein staan. Een antwoord op
een bevestigingsmail komt via `MAIL_REPLY_TO` gewoon in je mailbox bij mijn.host
terecht.

### 4.5 Controleren

1. Vul op `/boeken` het formulier in met je eigen adres. Je hoort binnen een minuut
   een bevestiging te krijgen.
2. Open die mail en bekijk de details (in Gmail: **Originele tekst weergeven**).
   Er hoort `SPF: PASS`, `DKIM: PASS` en `DMARC: PASS` te staan.
3. Lukt het niet, kijk dan in Resend onder **Logs**. Daar staat per mail wat er
   gebeurd is. De code logt het antwoord van Resend ook in de Vercel-logs, met
   `[mail]` ervoor.

Staat de mail in de spam terwijl alle drie op PASS staan? Dan ligt het aan
reputatie, niet aan instellingen — dat trekt vanzelf bij zodra er wat volume is.

---

## 5. Besloten deel — `PORTAL_SECRET`, `PORTAL_ADMINS`, `PORTAL_MEMBERS`

Het beheerscherm op `/beheer`. Zonder deze drie waarden komt daar niemand
binnen, en dat is met opzet: de captcha en de mail mogen overgeslagen worden
zodra hun sleutel ontbreekt, want een boeking hoort nooit te stranden. Een
inlogcontrole werkt andersom. Ontbreekt de sleutel, dan gaat de deur op slot en
niet open.

### 5.1 De ondertekensleutel

`PORTAL_SECRET` ondertekent het sessiekoekje. Wie deze waarde heeft, kan zelf een
geldig koekje maken en is binnen — behandel hem als een wachtwoord.

Minimaal 32 tekens. Maak er een die niemand hoeft te onthouden:

```
openssl rand -base64 48
```

Geen `openssl` bij de hand? In een terminal met Node:

```
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Verander je deze waarde, dan is iedereen meteen uitgelogd. Dat is ook het middel
als er ooit iemand per direct uit moet: er is geen sessietabel om een rij uit te
verwijderen.

### 5.2 Wie er in mag

Twee kommalijsten met e-mailadressen. Geen gebruikerstabel — vier adressen
beheer je sneller hier dan in een scherm dat daarvoor gebouwd moet worden, en er
zijn geen wachtwoorden die kunnen lekken.

| Variabele | Wie | Wat ze mogen |
| --- | --- | --- |
| `PORTAL_ADMINS` | Harm | Alles |
| `PORTAL_MEMBERS` | De andere drie leden | Meekijken, later eigen taken afvinken |

```
PORTAL_ADMINS=harm@voorbeeld.nl
PORTAL_MEMBERS=vedran@voorbeeld.nl, niels@voorbeeld.nl, quinten@voorbeeld.nl
```

Hoofdletters en extra spaties maken niet uit. Staat een adres per ongeluk in
beide lijsten, dan wint beheerder.

Iemand rechten afnemen is het adres uit de lijst halen. Dat werkt meteen, ook
bij iemand die al ingelogd is: de rol wordt bij elke paginaweergave opnieuw in
deze lijsten opgezocht en niet uit het koekje gelezen.

### 5.3 In Vercel

Bij het project onder **Settings → Environment Variables**, alle drie voor
Production, Preview en Development. Daarna opnieuw deployen — omgevingsvariabelen
worden ingebakken bij de build.

### 5.4 De tabellen

Het besloten deel gebruikt twee nieuwe tabellen en vier extra kolommen op
`booking_submissions`. Die staan in `db/schema.sql`, dat idempotent is: elke
opdracht maakt alleen aan wat er nog niet is, en er staat geen enkele opdracht in
die iets verwijdert. Zo vaak draaien als je wilt dus.

Er zijn drie manieren, en na de eerste keer is de eerste de makkelijkste:

**In het beheerscherm.** Log in en ga naar **Database**. Dat scherm laat zien
welke tabellen er staan en welke ontbreken, en werkt ze met één knop bij. Alleen
voor een beheerder. Dit is de manier voor elke volgende wijziging.

**Met de opdrachtregel**, als je de repo lokaal hebt staan en `DATABASE_URL` in
`.env.local`:

```
npm run db:setup
```

**In de SQL-editor van Neon**, als je geen van beide hebt. Ga in Vercel naar
Storage, open je Neon-database, kies daar **SQL Editor** en plak de inhoud van
`db/schema.sql`. Dit is de manier voor de állereerste keer: het beheerscherm
heeft de tabel `portal_login_tokens` nodig om je te laten inloggen, en die
bestaat op dat moment nog niet.

Controleren of het gelukt is:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

### 5.5 Inloggen

Ga naar `staticline.nl/beheer`, vul je adres in, klik de link in de mail. De link
is een kwartier geldig en werkt één keer.

Dat "één keer" merk je als je de mail twee keer opent: sommige mailprogramma's
openen links vooraf om ze te controleren, en dan is de link op tegen de tijd dat
jij klikt. Vraag in dat geval gewoon een nieuwe aan.

Komt er geen mail, loop dan na:

1. Staat `RESEND_API_KEY` er? Zonder mail geen inloglink. Zie hoofdstuk 4.
2. Staat je adres precies zo in `PORTAL_ADMINS` of `PORTAL_MEMBERS`?
3. Is er een `DATABASE_URL`? De sleutel wordt in de database bewaard.

Het scherm zegt bij een onbekend adres hetzelfde als bij een bekend adres: "als
dit adres toegang heeft". Dat is met opzet — anders kan iemand met dat formulier
uitvragen wie er in de band zit. De keerzijde is dat een typefout in je eigen
adres er ook uitziet als succes.

---

## 6. Foto's — `BLOB_READ_WRITE_TOKEN`

De foto's op de homepage en de fotopagina worden geüpload via
`/beheer/inhoud`. Ze komen in Vercel Blob te staan, niet in de repo.

In Vercel bij dit project onder **Storage → Create → Blob**. Vercel zet
`BLOB_READ_WRITE_TOKEN` daarna zelf bij de omgevingsvariabelen; je hoeft hem niet
over te typen. Daarna opnieuw deployen.

Toegestaan zijn JPEG, PNG, WebP en AVIF, tot 10 MB per bestand. Dat staat in
`app/api/beheer/upload/route.ts`.

Het uploaden gaat rechtstreeks van de browser naar de opslag; deze site geeft er
alleen een kortlopende sleutel voor af, die alleen aan een ingelogde beheerder
wordt afgegeven. Dat is geen overdaad: een serverloze functie op Vercel neemt
hooguit 4,5 MB aan verzoek aan, en een fatsoenlijke bandfoto zit daar overheen.

Een foto verwijderen haalt ook het bestand uit de opslag. Alleen de regel
weghalen zou een bestand achterlaten dat niemand meer kan vinden maar dat wel
blijft meetellen voor je opslag.

---

## 7. Band App bijwerken — `SITE_API_TOKEN`

Met deze sleutel kan `/beheer/bandapp` de bandgegevens en de agenda in de Band
App aanpassen. Zonder blijft dat scherm leesbaar maar zegt het dat de koppeling
nog niet ingesteld is.

### 7.1 Waarom dit nodig is

De Band App kent alleen zijn eigen sessiekoekje, en dat staat op zijn eigen
domein. Een browser op `staticline.nl` heeft dat niet en kan het ook niet
krijgen. Daarom is er in die app een aparte route bijgekomen, `/api/site`, met
een gedeelde sleutel in de Authorization-kop — dezelfde opzet als de cron-route
die daar al stond.

### 7.2 Een sleutel maken

```
openssl rand -base64 48
```

### 7.3 Op twee plekken zetten

**Dezelfde waarde**, bij allebei de projecten in Vercel:

| Project | Waarvoor |
| --- | --- |
| `staticline` | om de aanroep te ondertekenen |
| `static-line-bandapp` | om hem te herkennen |

Loopt dit uit de pas, dan weigert de Band App elke aanroep en zegt het
beheerscherm dat de sleutel is afgewezen.

Daarna allebei opnieuw deployen.

### 7.4 Wat de website daar mag

Alleen de bandgegevens (naam, bio, logo) en de shows. Bewust niet:

- **Repetities.** Die zijn intern; de website ziet ze niet en kan ze niet
  aanmaken, wijzigen of verwijderen.
- **De interne velden van een show** — `sub`, `address`, `loadIn` en `fee`. Daar
  staan adressen en afspraken in die niet op een website thuishoren.
- **Setlists, riders, podiumplannen en contacten.** Die worden in de app zelf
  bijgehouden, vaak op een telefoon tijdens een repetitie. Een tweede scherm
  ervoor levert niets op.

Wie wat wijzigde komt in het logboek op `/beheer` te staan, niet in de Band App.
Daar zit geen inlog voor deze aanroepen, hier wel.

---

## 8. Vertalen — `ANTHROPIC_API_KEY`

De bandbio en de tekst per lid komen uit de Band App, die één taal kent. Met deze
sleutel vertaalt `/beheer/vertalingen` ze naar het Engels; zonder de sleutel kun
je ze daar nog steeds met de hand invullen.

Een sleutel maak je aan op `console.anthropic.com` onder API Keys. Zet hem in
Vercel bij het `staticline`-project en deploy opnieuw.

### Wat het kost

Zo goed als niets. Het gaat om een bandbio en vier ledenteksten, en alleen wat
ontbreekt of verouderd is wordt opnieuw vertaald. De hele band in één keer zit in
de orde van twee cent.

### Twee plekken

| Waar | Wat |
| --- | --- |
| **Vertalingen** | De bandbio en de teksten per lid, die uit de Band App komen |
| **Inhoud → Engels bijwerken** | De hero-ondertitels en de voettekst, die de site zelf bezit |

Die twee gedragen zich bij een verouderde vertaling met opzet verschillend. Bij de
Band App-teksten valt de site terug op het Nederlands: die staan in een andere
applicatie, je ziet ze niet naast elkaar en je zou het verschil nooit opmerken.
Bij de siteteksten staan beide talen onder elkaar op hetzelfde scherm, dus daar
blijft het Engels staan en krijg je alleen een melding. Stil van taal wisselen op
een gepubliceerde pagina is erger dan een waarschuwing die je ziet.

De knop bij de siteteksten werkt op wat er **opgeslagen** staat. Sla je
wijzigingen dus eerst op, anders vertaalt hij de vorige versie.

### Hoe het werkt

Bij elke vertaling wordt een hash van de Nederlandse brontekst bewaard. Pas je
die tekst later in de Band App aan, dan staat de vertaling hier als **verouderd**
en toont de site zolang het Nederlands. Liever een Nederlandse zin op een Engelse
pagina dan een Engelse zin die iets anders beweert dan het origineel.

Wat al actueel is, wordt niet opnieuw vertaald. Anders zou een handmatige
correctie bij de volgende ronde weer verdwijnen.

De vertaling is een voorstel. Elk veld blijft te bewerken, en wat je daar zelf
neerzet blijft staan.

---

## Niet nodig

`BAND_APP_URL` heeft een standaardwaarde in de code
(`https://static-line-bandapp.vercel.app`) en hoeft alleen gezet te worden als de
Band App ooit verhuist — bijvoorbeeld naar `app.staticline.nl`.

---

## Het domein

Dit is gedaan. `staticline.nl` en `www.staticline.nl` hangen allebei aan het
project; de apex stuurt met een 308 door naar `www`, dat het canonieke adres is.

Wat er onderweg misging is het noteren waard, want het kan terugkomen bij
`app.staticline.nl`: de apex had naast het A-record van Vercel ook nog het
oorspronkelijke A-record van de registrar én een AAAA-record. Browsers geven IPv6
voorrang, dus vrijwel iedereen kwam op de verkeerde server uit terwijl `www` het
gewoon deed. Zet bij een nieuw subdomein dus altijd álle records die de registrar
er standaard neerzet weg, niet alleen het record met hetzelfde type.

Let ook op de wildcard `*`: die wijst nog naar de registrar en vult elk subdomein
in waar niets expliciets voor staat.

DNS blijft bij de registrar, niet bij Vercel — dan staan de mailrecords op één
plek. Zo staat het ook in `docs/02-architecture.md`. SSL regelt Vercel zelf.

Vergeet niet het domein toe te voegen bij Turnstile (stap 2) en bij Resend
(stap 4).

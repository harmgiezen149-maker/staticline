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

1. Ga naar [dash.cloudflare.com](https://dash.cloudflare.com/?to=/:account/turnstile).
   Een gratis account volstaat; een creditcard is niet nodig.
2. **Add site**, met:
   - Domein: `staticline.nl` — en zolang dat er nog niet is ook
     `staticline-harmgiezen149-makers-projects.vercel.app`
   - Widget mode: **Managed**
3. Je krijgt twee sleutels:

   | Cloudflare noemt het | Zet in Vercel als |
   | --- | --- |
   | Site Key | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
   | Secret Key | `TURNSTILE_SECRET_KEY` |

De site key mag publiek — die staat in de HTML, vandaar het voorvoegsel
`NEXT_PUBLIC_`. De secret key is geheim en hoort alleen in Vercel.

Turnstile zet geen cookies waarvoor een toestemmingsbanner nodig is. Dat was de
reden om het boven reCAPTCHA te kiezen.

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

## 4. Mail

Waarvoor: de bevestigingsmail aan iemand die een boeking indient, en de
bevestigingsmail voor de nieuwsbrief. Zonder mail ziet een aanvrager alleen de
bevestiging op het scherm, en blijven nieuwsbriefaanmeldingen onbevestigd staan.

Dit is nog niet gebouwd — er is eerst een keuze te maken:

- **Resend** of **Postmark**, zoals `docs/02-architecture.md` voorstelt. Eigen
  domein instellen met SPF en DKIM, anders belandt de post in de spam.
- **Gmail SMTP**, zoals de Band App het al doet (`SMTP_USER` / `SMTP_PASS` met een
  app-wachtwoord). Minder werk, want het draait al ergens.

De code kijkt nu naar `SMTP_USER` en `RESEND_API_KEY` om te bepalen of er mail is;
welke van de twee het wordt, bepaalt wat er gebouwd wordt.

---

## Niet nodig

`BAND_APP_URL` heeft een standaardwaarde in de code
(`https://static-line-bandapp.vercel.app`) en hoeft alleen gezet te worden als de
Band App ooit verhuist — bijvoorbeeld naar `app.staticline.nl`.

---

## Het domein

`staticline.nl` hangt nog nergens aan. Zodra je zover bent:

1. Vercel: **Project `staticline` → Settings → Domains → Add** → `staticline.nl`.
2. Vercel toont een A-record voor de apex en een CNAME voor `www`. Zet die bij de
   registrar waar het domein staat.
3. **Laat DNS bij de registrar staan**, niet bij Vercel — dan blijven de
   mailrecords op één plek. Zo staat het ook in `docs/02-architecture.md`.
4. SSL regelt Vercel zelf.

Vergeet daarna niet het domein toe te voegen bij Turnstile (stap 2).

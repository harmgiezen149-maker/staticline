-- Wat de website zelf bezit.
--
-- Bewust maar twee tabellen, en bewust niet in de database van de Band App: die
-- draait bij elke deploy `prisma db push` tegen zijn eigen schema, en tabellen
-- die daar niet in staan laten die build omvallen. Zie CLAUDE.md.
--
-- Geen migratieframework. Twee tabellen die zelden veranderen hebben geen
-- gereedschap nodig dat zelf onderhoud vraagt; dit bestand is idempotent en mag
-- zo vaak gedraaid worden als je wilt:
--
--   npm run db:setup
--
-- Verandert er later iets, dan komt er een ALTER onderaan bij. Ook additief,
-- om dezelfde reden als bij de Band App: er kan al data in zitten.

-- Boekingsaanvragen en algemene vragen.
--
-- Ook opgeslagen, en niet alleen doorgestuurd: e-mail en pushmeldingen raken
-- kwijt. Dit is het archief waar je later nog in kunt zoeken.
CREATE TABLE IF NOT EXISTS booking_submissions (
  id           bigserial PRIMARY KEY,
  -- "booking" of "question"
  kind         text        NOT NULL,
  name         text        NOT NULL,
  email        text        NOT NULL,
  phone        text        NOT NULL DEFAULT '',
  -- De elf velden uit docs/01-scope.md. Tekst, want "ergens in mei" is een
  -- bruikbaar antwoord dat een datumveld zou weggooien — dezelfde afweging die
  -- de Band App bij BookingRequest.wanted maakt.
  wanted_date  text        NOT NULL DEFAULT '',
  location     text        NOT NULL DEFAULT '',
  wanted_time  text        NOT NULL DEFAULT '',
  duration     text        NOT NULL DEFAULT '',
  event_type   text        NOT NULL DEFAULT '',
  budget       text        NOT NULL DEFAULT '',
  room_size    text        NOT NULL DEFAULT '',
  -- "yes" | "no" | "unknown", bij pa ook "rent"
  parking      text        NOT NULL DEFAULT 'unknown',
  backstage    text        NOT NULL DEFAULT 'unknown',
  pa           text        NOT NULL DEFAULT 'unknown',
  message      text        NOT NULL DEFAULT '',
  -- Of de band hem al opgepakt heeft. De Band App houdt zijn eigen status bij;
  -- deze is voor het beheerscherm op de website.
  handled      boolean     NOT NULL DEFAULT false,
  -- Of het doorsturen naar de Band App gelukt is. Bij false is de aanvraag hier
  -- wel binnen maar heeft de band geen melding gekregen.
  forwarded    boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_submissions_created_idx
  ON booking_submissions (created_at DESC);

-- Nieuwsbriefabonnees, met dubbele opt-in.
--
-- `confirmed_at` leeg betekent: aangemeld maar nog niet bevestigd, dus nog niet
-- aanschrijven. Zonder die stap kan iemand anders jouw adres invullen.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id           bigserial PRIMARY KEY,
  email        text        NOT NULL UNIQUE,
  -- "nl" of "en" — in welke taal iemand zich aanmeldde.
  locale       text        NOT NULL DEFAULT 'nl',
  -- Eenmalige sleutel uit de bevestigingsmail, en later uit de afmeldlink.
  token        text        NOT NULL,
  confirmed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Het besloten deel (/beheer)
-- ---------------------------------------------------------------------------

-- Eenmalige inloglinks.
--
-- Geen wachtwoorden: vier bandleden die een paar keer per maand inloggen hebben
-- meer last van een vergeten wachtwoord dan van een mailtje. Wie mag inloggen
-- staat in PORTAL_ADMINS en PORTAL_MEMBERS, niet in een tabel — vier adressen
-- beheer je sneller in Vercel dan in een scherm dat daarvoor gebouwd moet worden.
--
-- Bewaard wordt de SHA-256 van de sleutel, niet de sleutel zelf. Lekt deze tabel,
-- dan kan niemand er alsnog mee inloggen.
CREATE TABLE IF NOT EXISTS portal_login_tokens (
  id         bigserial PRIMARY KEY,
  email      text        NOT NULL,
  token_hash text        NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  -- Ingevuld zodra de link gebruikt is. Een tweede klik werkt dan niet meer:
  -- mailprogramma's die links vooraf openen zouden je anders uitloggen zodra je
  -- de mail opent.
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_login_tokens_expires_idx
  ON portal_login_tokens (expires_at);

-- Wie wat wanneer gewijzigd heeft.
--
-- docs/04-band-app-integration.md noemt dit expliciet niet-optioneel, en dat is
-- terecht. Twee van de drie leden stemden ervoor dat alleen de Band App mag
-- schrijven; dat is overruled door de beheerder. Die afweging is alleen te
-- verdedigen als zichtbaar is wie iets veranderd heeft.
CREATE TABLE IF NOT EXISTS portal_audit_log (
  id         bigserial PRIMARY KEY,
  -- Het e-mailadres van wie de wijziging deed.
  actor      text        NOT NULL,
  -- Wat er gebeurde, als vaste sleutel: "booking.status", "media.add", …
  action     text        NOT NULL,
  -- Waar het over ging, meestal een id.
  subject    text        NOT NULL DEFAULT '',
  -- Vrije toelichting, bedoeld om gelezen te worden.
  detail     text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_audit_log_created_idx
  ON portal_audit_log (created_at DESC);

-- Het beheerscherm heeft meer nodig dan `handled`: een aanvraag die je gezien
-- hebt is iets anders dan een aanvraag die geboekt is. `handled` blijft staan —
-- er kan al data in zitten, en dit bestand is net zo additief als het schema van
-- de Band App.
ALTER TABLE booking_submissions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
ALTER TABLE booking_submissions
  ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '';
ALTER TABLE booking_submissions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE booking_submissions
  ADD COLUMN IF NOT EXISTS updated_by text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS booking_submissions_status_idx
  ON booking_submissions (status);

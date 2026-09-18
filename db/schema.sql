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

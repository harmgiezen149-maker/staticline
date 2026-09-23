"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Script from "next/script";

import type { Copy } from "@/content";
import type { BookingKind } from "@/lib/booking";
import type { Locale } from "@/lib/i18n";
import { motionOn, ms, tok } from "@/lib/motion/env";

/**
 * Het boekingsformulier.
 *
 * GEËXTRAPOLEERD, niet ontworpen — maar wel het blok waar de site om draait, dus
 * er is meer aandacht naar de indeling gegaan dan naar de rest.
 *
 * Twee dingen komen rechtstreeks uit docs/01-scope.md:
 *
 * - Eén formulier met bovenaan een keuze tussen Boeking en Algemene vraag. Dat is
 *   het compromis tussen het ene bandlid dat één simpel formulier wilde en het
 *   andere dat een serieus boekingsformulier wilde. Wie een vraag heeft, ziet
 *   vier velden; wie wil boeken, ziet de elf.
 * - "Elf velden in één kolom zal mensen afschrikken. Groepeer ze." Vandaar vier
 *   groepen met een kop erboven, en twee kolommen waar dat past.
 *
 * Alleen naam en e-mail zijn verplicht. De rest helpt, maar iemand die vraagt of
 * de band op een zaterdag in mei kan, hoort niet eerst een formulier af te
 * werken.
 */
type Props = {
  copy: Copy["booking"];
  /** Bepaalt in welke taal de bevestigingsmail teruggaat. */
  locale: Locale;
  siteKey?: string;
};

type State = "idle" | "sending" | "ok" | "error";

/**
 * Het script van Cloudflare hangt zichzelf aan `window`. Alleen `reset` wordt
 * hier gebruikt, dus alleen die staat hier — een volledige typedefinitie voor
 * een script van derden loopt vanzelf achter op de werkelijkheid.
 */
declare global {
  interface Window {
    turnstile?: { reset: (widget?: string) => void };
  }
}

export function BookingForm({ copy, locale, siteKey }: Props) {
  const [kind, setKind] = useState<BookingKind>("booking");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  // Na een geslaagde verzending springt de focus naar de bevestiging, anders
  // merkt iemand met een schermlezer niet dat er iets gebeurd is.
  const okRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state === "ok") okRef.current?.focus();
  }, [state]);

  /**
   * Het wisselen tussen Boeking en Algemene vraag, in de beweging van v2.
   *
   * `kind` is wat er gekozen is, `shown` wat er in beeld staat. Die twee lopen
   * even uit elkaar zolang de wissel speelt:
   *
   * - **Naar de vraag**: de drie boekingsblokken knippen weg, van onder naar
   *   boven, en pas dan verdwijnen ze uit het formulier.
   * - **Naar de boeking**: de blokken komen erbij en wipen van links in, na
   *   elkaar.
   *
   * Wat eronder staat (het bericht, de verzendknop) verspringt daarbij niet
   * maar schuift naar zijn nieuwe plek: de positie van vóór de wissel wordt
   * gemeten en de verschuiving teruggespeeld als transform (FLIP). Alleen
   * transform, opacity en clip-path, zoals MOTION.md voorschrijft.
   *
   * Zonder beweging (minder beweging, of de motion-laag draait niet) is het een
   * gewone wissel. Wat in de boekingsvelden getypt was, verdwijnt bij het
   * wisselen naar de vraag, net als voorheen: een vraag hoort geen datum en
   * budget mee te sturen die de bezoeker niet meer ziet.
   */
  const [shown, setShown] = useState<BookingKind>("booking");
  const extraRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const tailFrom = useRef<number | null>(null);
  const entering = useRef(false);

  useEffect(() => {
    if (kind === shown) return;
    let cancelled = false;
    const groups = [...(extraRef.current?.children ?? [])] as HTMLElement[];

    (async () => {
      if (kind === "question" && motionOn() && groups.length > 0) {
        await Promise.all(
          groups
            .slice()
            .reverse()
            .map(
              (group, i) =>
                group.animate(
                  [
                    { opacity: 1, clipPath: "inset(0 0 0 0)" },
                    { opacity: 0, clipPath: "inset(0 0 0 100%)" },
                  ],
                  {
                    duration: ms("--dur-base"),
                    delay: i * ms("--stagger-band"),
                    easing: tok("--ease-cut"),
                    fill: "forwards",
                  },
                ).finished,
            ),
        ).catch(() => {});
        if (cancelled) return;
      }
      if (motionOn() && tailRef.current) {
        tailFrom.current = tailRef.current.getBoundingClientRect().top;
      }
      entering.current = kind === "booking";
      setShown(kind);
    })();

    return () => {
      cancelled = true;
      // Halverwege teruggekozen: de blokken die al aan het wegknippen waren,
      // staan er meteen weer.
      groups.forEach((group) =>
        group.getAnimations().forEach((a) => a.cancel()),
      );
    };
  }, [kind, shown]);

  // Na de wissel, vóór de browser tekent: de nieuwe plek meten en de sprong
  // als beweging terugspelen.
  useLayoutEffect(() => {
    const tail = tailRef.current;
    if (tail && tailFrom.current !== null) {
      const delta = tailFrom.current - tail.getBoundingClientRect().top;
      tailFrom.current = null;
      if (Math.abs(delta) > 1) {
        tail.animate(
          [
            { transform: `translate3d(0, ${delta}px, 0)` },
            { transform: "translate3d(0, 0, 0)" },
          ],
          { duration: ms("--dur-slow"), easing: tok("--ease-signal") },
        );
      }
    }

    if (entering.current && extraRef.current) {
      entering.current = false;
      [...extraRef.current.children].forEach((group, i) => {
        (group as HTMLElement).animate(
          [
            { opacity: 0, clipPath: "inset(0 100% 0 0)" },
            { opacity: 1, clipPath: "inset(0 0 0 0)" },
          ],
          {
            duration: ms("--dur-slow"),
            delay: 120 + i * ms("--stagger-photo"),
            easing: tok("--ease-signal"),
            fill: "backwards",
          },
        );
      });
    }
  }, [shown]);

  /**
   * Een mislukte poging afsluiten.
   *
   * De reset is het punt. Een Turnstile-token is eenmalig: laat je hem na een
   * fout staan, dan stuurt de volgende poging een al verbruikt token mee en
   * wijst Cloudflare die af. De bezoeker ziet dan "de controle is niet gelukt"
   * en komt er niet meer uit, ook niet als hij de echte fout corrigeert — alleen
   * herladen helpt nog. Precies op het formulier waar de site om draait.
   */
  function fail(message: string) {
    setState("error");
    setError(message);
    window.turnstile?.reset();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const res = await fetch("/api/boeken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, kind, locale }),
      });

      if (res.ok) {
        setState("ok");
        return;
      }

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      fail(
        payload.error === "no-name"
          ? copy.errorName
          : payload.error === "no-email"
            ? copy.errorEmail
            : payload.error === "captcha"
              ? copy.errorCaptcha
              : copy.errorGeneric,
      );
    } catch {
      fail(copy.errorGeneric);
    }
  }

  if (state === "ok") {
    return (
      <div className="flex flex-col gap-2 border border-accent-alt bg-accent-quiet p-6">
        <p
          ref={okRef}
          tabIndex={-1}
          className="font-display text-22 font-semibold tracking-tight4 uppercase"
        >
          {copy.ok}
        </p>
        <p className="text-14 leading-[22px] text-muted">{copy.okNote}</p>
      </div>
    );
  }

  const isBooking = shown === "booking";

  return (
    <>
      {siteKey && (
        // afterInteractive en niet lazyOnload: lazyOnload wacht op het
        // load-event, en wie het korte vragenformulier van vier velden snel
        // invult kan dan verzenden voordat er een token is.
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      )}

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex max-w-[720px] flex-col gap-10"
        noValidate
      >
        {/* De keuze bovenaan. Twee radio's als segmentknoppen: het is een keuze
            tussen twee dingen, dus het hoort een radiogroep te zijn en geen
            tabblad — dan werkt hij ook met een toetsenbord zoals verwacht. */}
        <fieldset className="flex flex-col gap-3">
          <legend className="font-mono text-11 tracking-wide22 text-faint uppercase">
            {copy.kindLabel}
          </legend>
          {/* De rode vulling is één laag die naar de gekozen optie schuift, in
              plaats van twee knoppen die van kleur wisselen. Zie `.kind-switch`
              in styles/motion.css. */}
          <div
            className="kind-switch relative grid grid-cols-1 gap-2 sm:grid-cols-2"
            data-kind={kind}
          >
            <span className="kind-switch__fill" aria-hidden="true" />
            {(
              [
                ["booking", copy.kindBooking],
                ["question", copy.kindQuestion],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`relative z-1 flex min-h-11 cursor-pointer items-center justify-center border px-6 py-3 font-display text-15 font-bold tracking-wide12 uppercase transition-colors duration-[160ms] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--focus-ring) ${
                  kind === value
                    ? "border-accent text-on-accent"
                    : "border-line-strong text-muted hover:border-primary hover:text-primary"
                }`}
              >
                <input
                  type="radio"
                  name="kindChoice"
                  value={value}
                  checked={kind === value}
                  onChange={() => setKind(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <Group title={copy.groupContact}>
          <Field label={copy.fields.name} name="name" required copy={copy}>
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              className={inputClass}
            />
          </Field>
          <Field label={copy.fields.email} name="email" required copy={copy}>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </Field>
          <Field label={copy.fields.phone} name="phone" copy={copy}>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className={inputClass}
            />
          </Field>
        </Group>

        {isBooking && (
          <div ref={extraRef} className="flex flex-col gap-10">
            <Group title={copy.groupWhen}>
              <Field label={copy.fields.date} name="date" copy={copy}>
                <input
                  id="date"
                  name="date"
                  placeholder={copy.fields.datePlaceholder}
                  className={inputClass}
                />
              </Field>
              <Field label={copy.fields.time} name="time" copy={copy}>
                <input
                  id="time"
                  name="time"
                  placeholder={copy.fields.timePlaceholder}
                  className={inputClass}
                />
              </Field>
              <Field label={copy.fields.duration} name="duration" copy={copy}>
                <input
                  id="duration"
                  name="duration"
                  placeholder={copy.fields.durationPlaceholder}
                  className={inputClass}
                />
              </Field>
            </Group>

            <Group title={copy.groupPlace}>
              <Field label={copy.fields.location} name="location" copy={copy}>
                <input id="location" name="location" className={inputClass} />
              </Field>
              <Field label={copy.fields.eventType} name="eventType" copy={copy}>
                <input
                  id="eventType"
                  name="eventType"
                  placeholder={copy.fields.eventTypePlaceholder}
                  className={inputClass}
                />
              </Field>
              <Field label={copy.fields.roomSize} name="roomSize" copy={copy}>
                <input
                  id="roomSize"
                  name="roomSize"
                  placeholder={copy.fields.roomSizePlaceholder}
                  className={inputClass}
                />
              </Field>
              <Field label={copy.fields.budget} name="budget" copy={copy}>
                <input
                  id="budget"
                  name="budget"
                  placeholder={copy.fields.budgetPlaceholder}
                  className={inputClass}
                />
              </Field>
            </Group>

            <Group title={copy.groupTech}>
              <ChoiceField
                label={copy.fields.parking}
                name="parking"
                options={[
                  ["yes", copy.choice.yes],
                  ["no", copy.choice.no],
                  ["unknown", copy.choice.unknown],
                ]}
              />
              <ChoiceField
                label={copy.fields.backstage}
                name="backstage"
                options={[
                  ["yes", copy.choice.yes],
                  ["no", copy.choice.no],
                  ["unknown", copy.choice.unknown],
                ]}
              />
              <ChoiceField
                label={copy.fields.pa}
                name="pa"
                options={[
                  ["yes", copy.choice.yes],
                  ["rent", copy.choice.rent],
                  ["no", copy.choice.no],
                  ["unknown", copy.choice.unknown],
                ]}
              />
            </Group>
          </div>
        )}

        {/* Alles hieronder schuift mee bij een wissel, zie boven. */}
        <div ref={tailRef} className="flex flex-col gap-10">
          <Group title={copy.groupMessage} single>
            <Field label={copy.fields.message} name="message" copy={copy}>
              <textarea
                id="message"
                name="message"
                rows={6}
                placeholder={copy.fields.messagePlaceholder}
                className={`${inputClass} resize-y`}
              />
            </Field>
          </Group>

          {/* Honeypot: onzichtbaar voor mensen, onweerstaanbaar voor bots. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />

          {siteKey && (
            <div
              className="cf-turnstile"
              data-sitekey={siteKey}
              data-theme="dark"
              data-response-field-name="turnstileToken"
            />
          )}

          {state === "error" && (
            <p role="alert" className="text-14 leading-[22px] text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "sending"}
            className="min-h-12 self-start bg-accent px-7 py-4 font-display text-16 font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[160ms] enabled:hover:bg-accent-alt enabled:hover:text-inset disabled:opacity-60"
          >
            {state === "sending" ? copy.sending : copy.submit}
          </button>
        </div>
      </form>
    </>
  );
}

const inputClass =
  "min-h-11 w-full border border-line-strong bg-inset px-3 py-3 text-16 text-primary placeholder:text-faint";

/** Een groep velden met een kop erboven, twee kolommen waar dat past. */
function Group({
  title,
  children,
  single,
}: {
  title: string;
  children: React.ReactNode;
  single?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 w-full border-b border-line pb-2 font-display text-18 font-semibold tracking-tight4 uppercase">
        {title}
      </legend>
      <div
        className={
          single
            ? "flex flex-col gap-4"
            : "grid grid-cols-1 gap-4 sm:grid-cols-2"
        }
      >
        {children}
      </div>
    </fieldset>
  );
}

function Field({
  label,
  name,
  required,
  copy,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  copy: Copy["booking"];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={name}
        className="flex items-baseline gap-2 font-mono text-11 tracking-wide14 text-muted uppercase"
      >
        {label}
        <span className="text-faint normal-case">
          {required ? copy.required : copy.optional}
        </span>
      </label>
      {children}
    </div>
  );
}

/**
 * Een keuze uit drie of vier antwoorden.
 *
 * Radio's en geen keuzelijst: op een telefoon is een keuzelijst een schermvullend
 * paneel voor drie woorden, en hier moet je in één blik kunnen zien wat er staat.
 */
function ChoiceField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-11 tracking-wide14 text-muted uppercase">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([value, optionLabel]) => (
          <label
            key={value}
            className="flex min-h-11 cursor-pointer items-center border border-line-strong px-4 py-2 font-mono text-12 tracking-wide10 text-muted uppercase transition-colors duration-[120ms] has-checked:border-accent has-checked:bg-accent has-checked:text-on-accent hover:border-primary"
          >
            {/* Bewust niets voorgeselecteerd: drie vooraf ingevulde antwoorden
                zien eruit alsof de bezoeker ze gegeven heeft. Niets aankruisen
                betekent "onbekend" — zo leest lib/booking.ts het ook. */}
            <input type="radio" name={name} value={value} className="sr-only" />
            {optionLabel}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

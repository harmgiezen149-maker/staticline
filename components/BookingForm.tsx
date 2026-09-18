"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

import type { Copy } from "@/content";
import type { BookingKind } from "@/lib/booking";
import type { Locale } from "@/lib/i18n";

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
      setState("error");
      setError(
        payload.error === "no-name"
          ? copy.errorName
          : payload.error === "no-email"
            ? copy.errorEmail
            : payload.error === "captcha"
              ? copy.errorCaptcha
              : copy.errorGeneric,
      );
    } catch {
      setState("error");
      setError(copy.errorGeneric);
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

  const isBooking = kind === "booking";

  return (
    <>
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
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
          <div className="flex flex-col gap-2 sm:flex-row">
            {(
              [
                ["booking", copy.kindBooking],
                ["question", copy.kindQuestion],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex min-h-11 cursor-pointer items-center justify-center border px-6 py-3 font-display text-15 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] sm:flex-1 ${
                  kind === value
                    ? "border-accent bg-accent text-on-accent"
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
          <>
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
          </>
        )}

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
          className="min-h-12 self-start bg-accent px-7 py-4 font-display text-16 font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[120ms] hover:bg-accent-hover disabled:opacity-60"
        >
          {state === "sending" ? copy.sending : copy.submit}
        </button>
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
            <input
              type="radio"
              name={name}
              value={value}
              className="sr-only"
            />
            {optionLabel}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

"use client";

import { useState } from "react";

/**
 * Het inlogformulier van het besloten deel.
 *
 * Eén veld. Na verzenden verandert het scherm in een bevestiging, want je moet
 * nu naar je mail en niet naar dit scherm blijven kijken.
 *
 * De bevestiging zegt "als dit adres toegang heeft" en niet "verstuurd". Dat is
 * geen omzichtigheid maar nauwkeurigheid: de server geeft met opzet hetzelfde
 * antwoord op een adres dat niet mag inloggen, dus dit scherm wéét niet of er
 * iets verstuurd is. Het zou niet moeten beweren van wel.
 */
export function LoginForm() {
  const [state, setState] = useState<
    "idle" | "sending" | "sent" | "error" | "too-many"
  >("idle");
  const [email, setEmail] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    try {
      const res = await fetch("/api/beheer/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setState("sent");
      else if (res.status === 429) setState("too-many");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex flex-col gap-3 border border-line-strong p-6">
        <p className="font-display text-18 font-bold tracking-tight2 uppercase">
          Kijk in je mail
        </p>
        <p className="text-muted">
          Als <span className="text-primary">{email}</span> toegang heeft, staat
          er nu een inloglink klaar. Die is een kwartier geldig en werkt één keer.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="self-start font-mono text-12 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary"
        >
          Ander adres proberen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="font-mono text-11 text-faint uppercase">
          E-mailadres
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
        />
      </label>

      {state === "too-many" && (
        <p className="text-danger">
          Je hebt net al een paar links aangevraagd. Wacht een kwartier, of kijk
          of er al een in je mailbox staat.
        </p>
      )}

      {state === "error" && (
        <p className="text-danger">
          Er ging iets mis aan onze kant, dus er is niets verstuurd. Staan de
          tabellen er (<span className="font-mono text-12">npm run db:setup</span>
          ) en is <span className="font-mono text-12">RESEND_API_KEY</span>{" "}
          ingesteld? De logs van Vercel zeggen welke van de twee het is.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex items-center justify-center bg-accent px-6 py-3 font-display font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[120ms] hover:bg-accent-hover disabled:opacity-60"
      >
        {state === "sending" ? "Bezig…" : "Stuur me een link"}
      </button>
    </form>
  );
}

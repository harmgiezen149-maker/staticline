"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";

import { saveScreen } from "@/app/(beheer)/beheer/scherm/actions";
import {
  DEFAULT_NOISE_LEVEL,
  DEFAULT_OPACITY,
  LIMITS,
  NOW_LABEL,
  type ScreenConfig,
  type ScreenFormat,
  type ScreenPhoto,
  type ScreenSlide,
  transitionTiming,
} from "@/lib/screen";

/**
 * Het beheer van /scherm: de beelden, het tempo, het formaat, het logo en de
 * foto's. Alles wordt in één keer opgeslagen met de knop onderaan; tot die tijd
 * staat er "Niet opgeslagen". Het voorbeeld laat de opgeslagen versie zien.
 *
 * Foto's gaan net als in /beheer/inhoud rechtstreeks van de browser naar de
 * Blob-opslag (zie app/api/beheer/upload/route.ts). Een foto die hier wordt
 * geüpload, staat alleen bij het scherm en niet in de fotosectie van de site.
 */

type Props = {
  initial: ScreenConfig;
  /** De foto's die al op de site staan, om ook achter een tekst te zetten. */
  sitePhotos: ScreenPhoto[];
};

const FORMAT_LABEL: Record<ScreenFormat, string> = {
  auto: "Automatisch — vult elk scherm",
  "16:9": "Liggend 16:9 — beamer, tv, stream",
  "4:3": "Liggend 4:3 — oude tv, oudere beamer",
  "9:16": "Staand 9:16 — staande tv, Reels",
  "1:1": "Vierkant 1:1",
  eigen: "Eigen maat — zelf instellen",
};

/** Hoe lang de wissel bij deze snelheid duurt, in gewone woorden. */
function speedText(speed: number) {
  const t = transitionTiming(speed);
  const total = t.close + t.settle + t.collapse * 2 + t.gap + t.open;
  return total >= 1000 ? `samen ${String(Math.round(total / 100) / 10).replace(".", ",")} s` : `samen ${total} ms`;
}

const input =
  "border border-line bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong";
const small =
  "font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-primary disabled:opacity-40 disabled:no-underline";
const ghost =
  "inline-flex items-center justify-center border border-line-strong px-4 py-2 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary disabled:opacity-60";

/**
 * Hoe vaak dit beeld in beeld komt, in woorden: "3 van elke 6 beelden". Het
 * logo telt niet mee.
 */
function chance(slides: ScreenSlide[], slide: ScreenSlide) {
  const total = slides.reduce((sum, s) => sum + s.weight, 0);
  if (slides.length < 2 || total === 0) return "Het enige beeld: dat staat er steeds.";
  return `${slide.weight} van elke ${total} beelden.`;
}

let seq = 0;
const newId = () => `s${Date.now().toString(36)}${(seq++).toString(36)}`;

export function ScreenEditor({ initial, sitePhotos }: Props) {
  const [config, setConfig] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<ScreenFormat>("16:9");
  const [previewKey, setPreviewKey] = useState(0);

  const dirty = JSON.stringify(config) !== saved;
  const set = (patch: Partial<ScreenConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const setSlide = (id: string, patch: Partial<ScreenSlide>) =>
    setConfig((c) => ({ ...c, slides: c.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  // Alle foto's om uit te kiezen: eerst die van het scherm, dan die van de site.
  const choices = useMemo(() => {
    const seen = new Set<string>();
    return [...config.photos.map((p) => ({ ...p, from: "Scherm" })), ...sitePhotos.map((p) => ({ ...p, from: "Site" }))].filter(
      (p) => !seen.has(p.url) && seen.add(p.url),
    );
  }, [config.photos, sitePhotos]);

  function move(index: number, by: number) {
    setConfig((c) => {
      const slides = [...c.slides];
      const to = index + by;
      if (to < 0 || to >= slides.length) return c;
      [slides[index], slides[to]] = [slides[to], slides[index]];
      return { ...c, slides };
    });
  }

  function addSlide() {
    setConfig((c) => ({
      ...c,
      slides: [...c.slides, { id: newId(), label: "", title: "", photo: "", opacity: DEFAULT_OPACITY, noise: 0, weight: 1, source: "", cover: true }],
    }));
  }

  // Het beeld met het nummer dat nu gespeeld wordt. De hoes komt voller in
  // beeld dan een gewone foto, want daar draait dit beeld om.
  function addNowSlide() {
    setConfig((c) => ({
      ...c,
      slides: [...c.slides, { id: newId(), label: NOW_LABEL, title: "", photo: "", opacity: 60, noise: 0, weight: 2, source: "nu", cover: true }],
    }));
  }

  function save() {
    // Een beeld zonder tekst en zonder foto valt bij het opslaan weg; liever
    // dat zeggen dan het stilletjes laten verdwijnen.
    const empty = config.slides.filter((s) => !s.source && !s.title.trim() && !s.photo).length;
    if (empty && !window.confirm(`${empty === 1 ? "Eén beeld heeft" : `${empty} beelden hebben`} geen tekst en geen foto en ${empty === 1 ? "valt" : "vallen"} weg. Toch opslaan?`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await saveScreen(JSON.stringify(config));
      if (!result) return;
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok && result.config) {
        setConfig(result.config);
        setSaved(JSON.stringify(result.config));
        setPreviewKey((k) => k + 1);
      }
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <p className="text-muted">
          De startanimatie van de site als doorlopende lus, voor een beamer op het podium, een scherm bij de merch of
          als achtergrond van een stream. Open het adres op de laptop of tv, druk op <span className="font-mono">F</span>{" "}
          voor volledig scherm en laat het draaien. Het adres staat niet in het menu en niet in Google.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="/scherm" target="_blank" rel="noopener" className={ghost}>
            Open het scherm ↗
          </a>
          <span className="font-mono text-12 text-muted">
            staticline.nl/scherm · <a className="underline" href="/scherm?formaat=16:9" target="_blank" rel="noopener">?formaat=16:9</a>{" "}
            · <a className="underline" href="/scherm?formaat=9:16" target="_blank" rel="noopener">9:16</a> ·{" "}
            <a className="underline" href="/scherm?formaat=4:3" target="_blank" rel="noopener">4:3</a> ·{" "}
            <a className="underline" href="/scherm?formaat=1:1" target="_blank" rel="noopener">1:1</a>
          </span>
        </div>
      </section>

      {/* ── Voorbeeld ── */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-mono text-11 text-faint uppercase">Voorbeeld — de opgeslagen versie</h2>
          <div className="flex gap-2" role="group" aria-label="Formaat van het voorbeeld">
            {(["16:9", "4:3", "9:16", "1:1", "eigen"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={preview === f}
                onClick={() => setPreview(f)}
                className={`border px-3 py-1 font-mono text-12 uppercase transition-colors duration-[120ms] ${preview === f ? "border-primary text-primary" : "border-line text-muted hover:text-primary"}`}
              >
                {f === "eigen" ? "Eigen" : f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center border border-line bg-inset">
          <iframe
            key={`${preview}-${previewKey}`}
            src={`/scherm?voorbeeld=1&formaat=${preview}`}
            title="Voorbeeld van het scherm"
            className="block w-full"
            style={{
              // Eigen maat in een liggend scherm, zoals een lcd-paneel.
              aspectRatio: preview === "eigen" ? "16 / 9" : preview.replace(":", " / "),
              maxWidth: preview === "9:16" ? 320 : preview === "1:1" ? 480 : preview === "4:3" ? 640 : undefined,
            }}
          />
        </div>
      </section>

      {/* ── Instellingen ── */}
      <section className="flex flex-col gap-6">
        <h2 className="font-mono text-11 text-faint uppercase">Instellingen</h2>

        <Slider
          label="Hoe lang een beeld staat"
          min={LIMITS.seconds[0]}
          max={LIMITS.seconds[1]}
          value={config.seconds}
          unit="s"
          onChange={(v) => set({ seconds: v })}
        />

        {/* De ruisduur is elke wissel anders, ergens tussen deze twee. Schuift
            het minimum voorbij het maximum, dan schuift het maximum mee (en
            andersom), zodat ze nooit omgedraaid staan. */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-mono text-11 text-faint uppercase">Ruis bij elke wissel</legend>
          <Slider
            label="Minimaal"
            min={LIMITS.noiseSeconds[0]}
            max={LIMITS.noiseSeconds[1]}
            step={0.1}
            value={config.noiseMin}
            unit="s"
            onChange={(v) => set({ noiseMin: v, noiseMax: Math.max(v, config.noiseMax) })}
          />
          <Slider
            label="Maximaal"
            min={LIMITS.noiseSeconds[0]}
            max={LIMITS.noiseSeconds[1]}
            step={0.1}
            value={config.noiseMax}
            unit="s"
            onChange={(v) => set({ noiseMax: v, noiseMin: Math.min(v, config.noiseMin) })}
            hint={
              config.noiseMin === config.noiseMax
                ? "Nu staat de ruis elke keer even lang. Zet het maximum hoger, dan wordt het elke wissel een willekeurige duur daartussen."
                : "Elke wissel kiest het scherm een willekeurige duur hiertussen. Daarna klapt de ruis dicht tot de lijn en opent het beeld, in het tempo hieronder."
            }
          />
        </fieldset>

        {/* De zwarte overgang. Twee knoppen, zoals bij de volgorde. */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Zwarte overgang</span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Zwarte overgang">
            {([
              [true, "Aan"],
              [false, "Uit"],
            ] as const).map(([value, text]) => (
              <button
                key={text}
                type="button"
                aria-pressed={config.bands === value}
                onClick={() => set({ bands: value })}
                className={`min-h-12 border px-4 py-3 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] ${config.bands === value ? "border-accent-alt text-accent-alt" : "border-line text-muted hover:text-primary"}`}
              >
                {text}
              </button>
            ))}
          </div>
          <span className="text-muted">
            {config.bands
              ? "Bij elke wissel sluiten donkere banden over het beeld tot één lijn, en gaat het volgende beeld vanuit die lijn open."
              : "Een harde knip: het beeld springt meteen naar ruis en de ruis meteen naar het volgende beeld, zonder zwart ertussen. De snelheid hieronder telt dan niet."}
          </span>
        </div>

        <Slider
          label="Snelheid van de wissel"
          min={0}
          max={100}
          step={5}
          value={config.speed}
          unit="%"
          onChange={(v) => set({ speed: v })}
          hint={`Hoe snel de banden dichtklappen en het volgende beeld opengaat: ${speedText(config.speed)}. 0% is het rustige tempo van de startanimatie, 100% een korte flits. Voor een echte flits zet je de ruis hierboven ook kort, bijvoorbeeld 0,2 s.`}
        />

        {/* Tekst in de ruis. Twee knoppen, zoals bij de volgorde. */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Tekst in de ruis</span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tekst in de ruis">
            {([
              [true, "Aan"],
              [false, "Uit"],
            ] as const).map(([value, text]) => (
              <button
                key={text}
                type="button"
                aria-pressed={config.readout === value}
                onClick={() => set({ readout: value })}
                className={`min-h-12 border px-4 py-3 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] ${config.readout === value ? "border-accent-alt text-accent-alt" : "border-line text-muted hover:text-primary"}`}
              >
                {text}
              </button>
            ))}
          </div>
          <span className="text-muted">
            {config.readout
              ? "Tijdens de ruis staat onderin het label van het volgende beeld (of \"Signaal zoeken\" als dat er niet is), met de teller van 000 naar 100."
              : "Tijdens de ruis staat er geen tekst en geen teller: alleen ruis."}
          </span>
        </div>

        {/* Soort ruis. Twee knoppen, zoals bij de volgorde. */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Soort ruis</span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Soort ruis">
            {([
              ["kleur", "Kleur"],
              ["zwart-wit", "Zwart-wit"],
            ] as const).map(([value, text]) => (
              <button
                key={value}
                type="button"
                aria-pressed={config.noiseStyle === value}
                onClick={() => set({ noiseStyle: value })}
                className={`min-h-12 border px-4 py-3 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] ${config.noiseStyle === value ? "border-accent-alt text-accent-alt" : "border-line text-muted hover:text-primary"}`}
              >
                {text}
              </button>
            ))}
          </div>
          <span className="text-muted">
            {config.noiseStyle === "kleur"
              ? "De sneeuw van een oude beeldbuis zonder zender: korrels in blauw, cyaan, groen en wit, met golvende lichte banden erdoor."
              : "De grijze ruis van de startanimatie op de site."}
          </span>
        </div>

        <Slider
          label="Helderheid van de ruis"
          min={0}
          max={100}
          value={config.noiseLevel}
          unit="%"
          onChange={(v) => set({ noiseLevel: v })}
          hint={
            config.noiseStyle === "kleur"
              ? "Geldt voor de ruis bij de wissel én de ruis over de beelden. Rond 60% staat de kleurenruis zoals hij getekend is; daarboven wordt hij feller."
              : `Geldt voor de ruis bij de wissel én de ruis over de beelden. ${DEFAULT_NOISE_LEVEL}% is de ruis van de startanimatie op de site.`
          }
        />

        <Slider
          label="Glitches"
          min={0}
          max={100}
          step={5}
          value={config.glitch}
          unit="%"
          onChange={(v) => set({ glitch: v })}
          hint={
            config.glitch === 0
              ? "Uit: de beelden staan stil tussen de wissels."
              : "Korte storingen terwijl een beeld staat: het beeld verspringt, er schieten banden sneeuw doorheen en de tekst valt even uiteen in rood en blauw. Hoe hoger, hoe vaker en heftiger. Op 100% om de één à drie seconden."
          }
        />

        <Slider
          label="Onrustig beeld"
          min={0}
          max={100}
          step={5}
          value={config.unrest}
          unit="%"
          onChange={(v) => set({ unrest: v })}
          hint={
            config.unrest === 0
              ? "Uit: de foto's staan stil."
              : "De foto's als op een tv die net niet goed afgestemd is: ze trillen en flikkeren zacht, en af en toe rolt het beeld omhoog door, met de zwarte balk ertussen, of hapert het even. De tekst blijft staan. Hoe hoger, hoe onrustiger en hoe vaker."
          }
        />

        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Formaat</span>
          <select value={config.format} onChange={(e) => set({ format: e.target.value as ScreenFormat })} className={input}>
            {(Object.keys(FORMAT_LABEL) as ScreenFormat[]).map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABEL[f]}
              </option>
            ))}
          </select>
          <span className="text-muted">
            Een vaste verhouding krijgt zwarte randen op een scherm dat anders is. Per scherm afwijken kan met het adres,
            bijvoorbeeld <span className="font-mono">/scherm?formaat=9:16</span> voor de staande tv bij de merch.
          </span>
        </label>

        {/* Een knop en geen vinkje: op een telefoon drukte de lange tekst
            ernaast het vinkje plat tot een paar pixels, en dan raak je het niet.
            Altijd zichtbaar, ook buiten "eigen maat": de rand van het beeld is
            bij elk formaat handig om te zien waar het precies valt. */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Hulplijnen op het scherm</span>
          <button
            type="button"
            aria-pressed={config.custom.guides}
            onClick={() => set({ custom: { ...config.custom, guides: !config.custom.guides } })}
            className={`min-h-12 border px-4 py-3 text-left font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] ${config.custom.guides ? "border-accent-alt text-accent-alt" : "border-line-strong hover:border-primary"}`}
          >
            {config.custom.guides ? "Hulplijnen staan aan — tik om uit te zetten" : "Hulplijnen aanzetten"}
          </button>
          <span className="text-muted">
            Een lijn langs de rand van het beeld en een kruis door het midden
            {config.format === "eigen" ? ", met de maten erbij" : ""}. Te zien op het scherm zelf na Opslaan, en in het
            voorbeeld hierboven. Zet ze na het afstellen weer uit.
          </span>
        </div>

        {config.format === "eigen" && (
          <fieldset className="flex flex-col gap-3 border border-line p-4">
            <legend className="px-1 font-mono text-11 text-faint uppercase">Eigen maat</legend>
            <p className="text-muted">
              Voor een scherm achter het glas van een beeldbuistelevisie: maak het beeld zo groot als de opening, en
              schuif het tot het erin valt. Alles in procenten van het scherm. Open het scherm op het lcd-paneel, zet de
              hulplijnen hierboven aan en druk na elke aanpassing op Opslaan: binnen tien seconden past het scherm zich aan.
            </p>
            <Slider
              label="Breedte"
              min={LIMITS.size[0]}
              max={LIMITS.size[1]}
              step={0.5}
              value={config.custom.width}
              unit="%"
              onChange={(v) => set({ custom: { ...config.custom, width: v } })}
            />
            <Slider
              label="Hoogte"
              min={LIMITS.size[0]}
              max={LIMITS.size[1]}
              step={0.5}
              value={config.custom.height}
              unit="%"
              onChange={(v) => set({ custom: { ...config.custom, height: v } })}
            />
            <Slider
              label="Naar links of rechts"
              min={LIMITS.shift[0]}
              max={LIMITS.shift[1]}
              step={0.5}
              value={config.custom.x}
              unit="%"
              onChange={(v) => set({ custom: { ...config.custom, x: v } })}
              hint="Min is naar links, plus is naar rechts."
            />
            <Slider
              label="Omhoog of omlaag"
              min={LIMITS.shift[0]}
              max={LIMITS.shift[1]}
              step={0.5}
              value={config.custom.y}
              unit="%"
              onChange={(v) => set({ custom: { ...config.custom, y: v } })}
              hint="Min is omhoog, plus is omlaag."
            />
            <button
              type="button"
              className={`${small} self-start`}
              onClick={() => set({ custom: { ...config.custom, width: 100, height: 100, x: 0, y: 0 } })}
            >
              Terug naar het hele scherm
            </button>
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-mono text-11 text-faint uppercase">Logo tussendoor</legend>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.logo.on}
              onChange={(e) => set({ logo: { ...config.logo, on: e.target.checked } })}
              className="h-5 w-5 shrink-0 accent-[var(--accent-alt)]"
            />
            <span>Het wordmark komt als eigen beeld voorbij</span>
          </label>
          <label className={`flex items-center gap-3 ${config.logo.on ? "" : "opacity-40"}`}>
            <span>na elke</span>
            <input
              type="number"
              min={LIMITS.every[0]}
              max={LIMITS.every[1]}
              value={config.logo.every}
              disabled={!config.logo.on}
              onChange={(e) => set({ logo: { ...config.logo, every: Math.max(1, Number(e.target.value) || 1) } })}
              className={`${input} w-20 py-2`}
            />
            <span>{config.logo.every === 1 ? "beeld" : "beelden"}</span>
          </label>
          <div className={config.logo.on ? "" : "opacity-40"}>
            <Slider
              label="Ruis over het wordmark"
              min={0}
              max={100}
              step={5}
              value={config.logo.noise}
              unit="%"
              disabled={!config.logo.on}
              onChange={(v) => set({ logo: { ...config.logo, noise: v } })}
              hint="0% = geen ruis. Hoe hoger, hoe minder doorzichtig de ruislaag over het logo."
            />
          </div>
        </fieldset>
      </section>

      {/* ── Beelden ── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-11 text-faint uppercase">Beelden</h2>
          <p className="text-muted">
            Elk beeld is een tekst, een foto, of allebei: de tekst groot onderin, de foto erachter. Met de schuif zet je
            de foto zachter; rond de 15–25% blijft de tekst er goed leesbaar overheen.
          </p>
        </div>

        {/* Volgorde. Twee knoppen en geen vinkje, om dezelfde reden als bij de
            hulplijnen: op een telefoon moeten ze met een duim te raken zijn. */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Volgorde</span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Volgorde">
            {([
              [true, "Willekeurig"],
              [false, "Vaste volgorde"],
            ] as const).map(([value, text]) => (
              <button
                key={text}
                type="button"
                aria-pressed={config.shuffle === value}
                onClick={() => set({ shuffle: value })}
                className={`min-h-12 border px-4 py-3 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] ${config.shuffle === value ? "border-accent-alt text-accent-alt" : "border-line text-muted hover:text-primary"}`}
              >
                {text}
              </button>
            ))}
          </div>
          <span className="text-muted">
            {config.shuffle
              ? "De beelden komen in een steeds andere volgorde, nooit twee keer hetzelfde achter elkaar. Met \"Hoe vaak\" bij een beeld laat je het vaker voorbijkomen, bijvoorbeeld de bandinfo op 3×."
              : "De beelden komen in de volgorde van de lijst hieronder. \"Hoe vaak\" telt alleen bij willekeurig."}
          </span>
        </div>

        {config.slides.length === 0 && (
          <p className="border border-dashed border-line px-4 py-6 text-center text-muted">
            Nog geen beelden. {config.logo.on ? "Zolang staat alleen het logo op het scherm." : "Zolang staat het logo op het scherm."}
          </p>
        )}

        <ol className="flex flex-col gap-4">
          {config.slides.map((slide, i) => {
            const photo = choices.find((p) => p.url === slide.photo);
            const now = slide.source === "nu";
            // Bij een nu-speelt-beeld kan de hoes de foto zijn, ook zonder
            // gekozen foto: dan telt de zichtbaarheid ook.
            const hasPhoto = Boolean(slide.photo) || (now && slide.cover);
            return (
              <li key={slide.id} className={`flex flex-col gap-4 border p-4 ${now ? "border-accent-alt" : "border-line"}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-12 text-muted">
                    {String(i + 1).padStart(2, "0")}
                    {now && <span className="ml-3 text-accent-alt">Nu speelt · uit de Band App</span>}
                  </span>
                  <span className="flex items-center gap-4">
                    <button type="button" className={small} onClick={() => move(i, -1)} disabled={i === 0}>
                      ↑ Omhoog
                    </button>
                    <button type="button" className={small} onClick={() => move(i, 1)} disabled={i === config.slides.length - 1}>
                      ↓ Omlaag
                    </button>
                    <button
                      type="button"
                      className={`${small} hover:text-danger`}
                      onClick={() => set({ slides: config.slides.filter((s) => s.id !== slide.id) })}
                    >
                      Verwijderen
                    </button>
                  </span>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="font-mono text-11 text-faint uppercase">
                    Kleine regel erboven <span className="normal-case">— mag leeg</span>
                  </span>
                  <input
                    value={slide.label}
                    maxLength={LIMITS.label}
                    placeholder={now ? NOW_LABEL : "Live"}
                    onChange={(e) => setSlide(slide.id, { label: e.target.value })}
                    className={input}
                  />
                </label>

                {now ? (
                  <>
                    <p className="text-muted">
                      De titel en artiest komen uit de podiumweergave van de Band App: het nummer dat de bediener op dat
                      moment open heeft. Zolang daar niemand bedient, slaat het scherm dit beeld over.
                    </p>
                    {/* Hoes of eigen foto. Twee knoppen, zoals bij de volgorde. */}
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-11 text-faint uppercase">Hoes van het nummer</span>
                      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Hoes van het nummer">
                        {([
                          [true, "Tonen"],
                          [false, "Niet tonen"],
                        ] as const).map(([value, text]) => (
                          <button
                            key={text}
                            type="button"
                            aria-pressed={slide.cover === value}
                            onClick={() => setSlide(slide.id, { cover: value })}
                            className={`min-h-12 border px-4 py-3 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] ${slide.cover === value ? "border-accent-alt text-accent-alt" : "border-line text-muted hover:text-primary"}`}
                          >
                            {text}
                          </button>
                        ))}
                      </div>
                      <span className="text-muted">
                        {slide.cover
                          ? "De hoes uit Spotify, als het nummer die in de Band App heeft. Zonder hoes komt de foto hieronder."
                          : "Altijd de foto hieronder, of geen foto."}
                      </span>
                    </div>
                  </>
                ) : (
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-11 text-faint uppercase">
                    Tekst <span className="normal-case">— leeg = alleen de foto</span>
                  </span>
                  <textarea
                    value={slide.title}
                    maxLength={LIMITS.title}
                    rows={2}
                    placeholder="Static Line — live in Ede"
                    onChange={(e) => setSlide(slide.id, { title: e.target.value })}
                    className={input}
                  />
                </label>
                )}

                <div className="flex flex-wrap items-end gap-4">
                  <label className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-mono text-11 text-faint uppercase">{now && slide.cover ? "Foto als er geen hoes is" : "Foto erachter"}</span>
                    <select
                      value={slide.photo}
                      onChange={(e) => setSlide(slide.id, { photo: e.target.value })}
                      className={input}
                    >
                      <option value="">Geen foto</option>
                      {choices.map((p) => (
                        <option key={p.url} value={p.url}>
                          {p.from}: {p.alt || p.url.split("/").pop()}
                        </option>
                      ))}
                    </select>
                  </label>
                  {photo && (
                    <span className="relative h-16 w-28 shrink-0 overflow-hidden bg-inset">
                      <Image src={photo.url} alt="" fill sizes="112px" className="object-cover" style={{ opacity: slide.opacity / 100 }} />
                    </span>
                  )}
                </div>

                <label className={`flex flex-col gap-1 ${hasPhoto ? "" : "opacity-40"}`}>
                  <span className="font-mono text-11 text-faint uppercase">Zichtbaarheid van de foto</span>
                  <span className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={slide.opacity}
                      disabled={!hasPhoto}
                      onChange={(e) => setSlide(slide.id, { opacity: Number(e.target.value) })}
                      className="w-full accent-[var(--accent-alt)]"
                    />
                    <span className="w-12 shrink-0 text-right font-mono text-14">{slide.opacity}%</span>
                  </span>
                </label>

                <Slider
                  label="Ruis over het beeld"
                  min={0}
                  max={100}
                  step={5}
                  value={slide.noise}
                  unit="%"
                  onChange={(v) => setSlide(slide.id, { noise: v })}
                  hint="0% = geen ruis. Hoe hoger, hoe minder doorzichtig de ruislaag."
                />

                <div className={`flex flex-col gap-1 ${config.shuffle ? "" : "opacity-40"}`}>
                  <span className="font-mono text-11 text-faint uppercase">Hoe vaak</span>
                  <div className="grid grid-cols-5 gap-2" role="group" aria-label="Hoe vaak">
                    {Array.from({ length: LIMITS.weight[1] }, (_, k) => k + 1).map((w) => (
                      <button
                        key={w}
                        type="button"
                        aria-pressed={slide.weight === w}
                        disabled={!config.shuffle}
                        onClick={() => setSlide(slide.id, { weight: w })}
                        className={`min-h-11 border font-mono text-14 transition-colors duration-[120ms] ${slide.weight === w ? "border-accent-alt text-accent-alt" : "border-line text-muted enabled:hover:text-primary"}`}
                      >
                        {w}×
                      </button>
                    ))}
                  </div>
                  <span className="text-muted">
                    {chance(config.slides, slide)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {config.slides.length < LIMITS.slides && (
          <button
            type="button"
            onClick={addSlide}
            className="border border-dashed border-line-strong px-4 py-3 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary"
          >
            ＋ Beeld toevoegen
          </button>
        )}
        {config.slides.length < LIMITS.slides && !config.slides.some((s) => s.source === "nu") && (
          <button
            type="button"
            onClick={addNowSlide}
            className="border border-dashed border-accent-alt px-4 py-3 font-display text-14 font-bold tracking-wide12 text-accent-alt uppercase transition-colors duration-[120ms] hover:border-primary hover:text-primary"
          >
            ＋ Beeld “Nu speelt” toevoegen
          </button>
        )}
      </section>

      <PhotoUpload
        photos={config.photos}
        // Functioneel bijwerken en niet vanuit `config`: bij meerdere foto's
        // tegelijk komt dit een paar keer achter elkaar binnen, en dan zou elke
        // keer de vorige foto weer overschreven worden.
        onAdd={(added, asSlides) =>
          setConfig((c) => {
            const known = new Set(c.photos.map((p) => p.url));
            const fresh = added.filter((p) => !known.has(p.url));
            return {
              ...c,
              photos: [...c.photos, ...fresh].slice(0, LIMITS.photos),
              slides: asSlides
                ? [
                    ...c.slides,
                    ...fresh.map((p) => ({ id: newId(), label: "", title: "", photo: p.url, opacity: 100, noise: 0, weight: 1, source: "" as const, cover: true })),
                  ].slice(0, LIMITS.slides)
                : c.slides,
            };
          })
        }
        onRemove={(url) =>
          set({
            photos: config.photos.filter((p) => p.url !== url),
            slides: config.slides.map((s) => (s.photo === url ? { ...s, photo: "" } : s)),
          })
        }
      />

      {/* ── Opslaan ── */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 border-t border-line bg-base py-4">
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="inline-flex items-center justify-center bg-accent px-6 py-3 font-display font-bold tracking-wide12 text-on-accent uppercase transition-colors duration-[160ms] enabled:hover:bg-accent-alt enabled:hover:text-inset disabled:opacity-60"
        >
          {pending ? "Bezig…" : "Opslaan"}
        </button>
        {dirty && <span className="font-mono text-12 text-warning uppercase">Niet opgeslagen</span>}
        {/* Een fout blijft staan, ook al is er nog niets opgeslagen; een
            succesmelding alleen tot de volgende wijziging. */}
        {message && (!message.ok || !dirty) && (
          <span className={message.ok ? "text-muted" : "text-danger"}>{message.text}</span>
        )}
      </div>
    </div>
  );
}

/** Foto's alleen voor het scherm: uploaden en weer weghalen. */
/** Wat de uploadroute aanneemt; zie app/api/beheer/upload/route.ts. */
const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const UPLOAD_MAX = 10 * 1024 * 1024;
/** Zoveel tegelijk: sneller dan één voor één, zonder de verbinding dicht te trekken. */
const UPLOAD_PARALLEL = 3;

/**
 * Foto's alleen voor het scherm: uploaden, meerdere tegelijk, en weer weghalen.
 *
 * Elke foto gaat apart naar de Blob-opslag. Mislukt er één (te groot, verkeerd
 * soort bestand, verbinding weg), dan gaan de andere gewoon door en zegt het
 * scherm daarna welke niet gelukt zijn.
 */
function PhotoUpload({
  photos,
  onAdd,
  onRemove,
}: {
  photos: ScreenPhoto[];
  onAdd: (photos: ScreenPhoto[], asSlides: boolean) => void;
  onRemove: (url: string) => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" | "error"; message?: string }>({ kind: "idle" });
  const [asSlides, setAsSlides] = useState(false);
  const room = LIMITS.photos - photos.length;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const files = data.getAll("bestand").filter((f): f is File => f instanceof File && f.size > 0);
    const name = String(data.get("alt") ?? "").trim();
    if (files.length === 0) {
      setState({ kind: "error", message: "Kies eerst een of meer bestanden." });
      return;
    }
    if (files.length > room) {
      setState({ kind: "error", message: `Er passen nog ${room} foto's bij het scherm; je koos er ${files.length}.` });
      return;
    }

    const failed: string[] = [];
    const done: ScreenPhoto[] = [];
    let finished = 0;
    const progress = () => setState({ kind: "busy", message: `Bezig met uploaden… ${finished} van ${files.length}` });
    progress();

    // De naam: wat er is ingevuld, met een volgnummer als het er meer zijn; anders
    // de bestandsnaam zonder extensie.
    const nameFor = (file: File, i: number) =>
      name ? (files.length > 1 ? `${name} ${i + 1}` : name) : file.name.replace(/\.[^.]+$/, "");

    const one = async (file: File, i: number) => {
      if (!UPLOAD_TYPES.includes(file.type)) failed.push(`${file.name} (geen JPEG, PNG, WebP of AVIF)`);
      else if (file.size > UPLOAD_MAX) failed.push(`${file.name} (groter dan 10 MB)`);
      else {
        try {
          const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/beheer/upload" });
          done[i] = { url: blob.url, alt: nameFor(file, i) };
        } catch {
          failed.push(file.name);
        }
      }
      finished += 1;
      progress();
    };

    // Een paar tegelijk, in de volgorde waarin ze gekozen zijn.
    const queue = files.map((file, i) => () => one(file, i));
    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_PARALLEL, queue.length) }, async () => {
        while (queue.length) await queue.shift()!();
      }),
    );

    const added = done.filter(Boolean);
    if (added.length) onAdd(added, asSlides);
    form.current?.reset();

    const ok = `${added.length} ${added.length === 1 ? "foto" : "foto's"} toegevoegd${asSlides && added.length ? ", elk als eigen beeld" : ""}. Druk nog op Opslaan.`;
    setState(
      failed.length
        ? { kind: "error", message: `${added.length ? ok + " " : ""}Niet gelukt: ${failed.join(", ")}.` }
        : { kind: "done", message: ok },
    );
  }

  const busy = state.kind === "busy";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-11 text-faint uppercase">Foto&apos;s voor het scherm</h2>
        <p className="text-muted">
          Alleen voor het scherm; ze komen niet in de fotosectie van de site. De foto&apos;s die al op de site staan,
          kun je hierboven ook kiezen. Je kunt meerdere foto&apos;s tegelijk kiezen. JPEG, PNG, WebP of AVIF, tot 10 MB
          per foto. Na het uploaden nog op Opslaan drukken.
        </p>
      </div>

      {photos.length > 0 && (
        <ul className="flex flex-col">
          {photos.map((p) => (
            <li key={p.url} className="flex items-center justify-between gap-4 border-b border-line py-2">
              <span className="flex min-w-0 items-center gap-4">
                <Image src={p.url} alt="" width={64} height={64} className="h-16 w-16 shrink-0 object-cover" />
                <span className="truncate">{p.alt}</span>
              </span>
              <button type="button" className={`${small} hover:text-danger`} onClick={() => onRemove(p.url)}>
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
      )}

      <form ref={form} onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Bestanden</span>
          <input
            type="file"
            name="bestand"
            multiple
            accept={UPLOAD_TYPES.join(",")}
            disabled={busy}
            className="border border-line bg-inset px-4 py-3 text-primary file:mr-4 file:border-0 file:bg-inset file:font-mono file:text-12 file:text-muted file:uppercase"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">
            Naam <span className="normal-case">— mag leeg; bij meerdere foto&apos;s komt er een nummer achter</span>
          </span>
          <input type="text" name="alt" placeholder="Loburg, publiek van achteren" disabled={busy} className={input} />
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={asSlides}
            onChange={(e) => setAsSlides(e.target.checked)}
            disabled={busy}
            className="h-5 w-5 shrink-0 accent-[var(--accent-alt)]"
          />
          <span>Maak van elke foto meteen een eigen beeld, zonder tekst</span>
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy || room <= 0} className={ghost}>
            {busy ? "Bezig…" : "Foto's uploaden"}
          </button>
          {state.message && (
            <span role="status" className={state.kind === "error" ? "text-danger" : "text-muted"}>
              {state.message}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

/** Een schuif met de waarde ernaast, zoals elke schuif op dit scherm. */
function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  unit,
  hint,
  disabled = false,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-11 text-faint uppercase">{label}</span>
      <span className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-[var(--accent-alt)]"
        />
        <span className="w-14 shrink-0 text-right font-mono text-14">
          {Number.isInteger(value) ? value : value.toFixed(1).replace(".", ",")}
          {unit}
        </span>
      </span>
      {hint && <span className="text-muted">{hint}</span>}
    </label>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { reduced } from "@/lib/motion/env";

/**
 * De ledenkaarten als één schuivende rij, op de homepage en op /band.
 *
 * GEËXTRAPOLEERD. Het ontwerp tekent deze sectie niet, en een carrousel dus ook
 * niet. Hij is gemaakt van wat er al is: de ghost-knop, de lijn van de koppen en
 * de easing uit de tokens.
 *
 * Het schuiven zelf doet de browser, met scroll-snap. Daardoor werkt vegen op
 * een telefoon en een trackpad op een laptop zonder één regel code, staat een
 * kaart altijd recht na het loslaten, en schuift de rij vanzelf mee als je er
 * met Tab doorheen loopt. Dit component voegt alleen toe wat de browser niet
 * kan: de knoppen, het automatisch doorschuiven en de lijn eronder die laat zien
 * waar je bent. De kaarten zelf blijven servermarkup (children).
 *
 * Automatisch doorschuiven:
 * - staat stil zolang de muis erop staat of de focus erin zit;
 * - stopt voorgoed zodra iemand zelf schuift, veegt of een pijl indrukt — wie
 *   zelf kijkt, wil niet dat de rij onder zijn vinger wegloopt;
 * - loopt alleen als de rij in beeld is en het tabblad zichtbaar;
 * - staat uit bij minder beweging, en is altijd te pauzeren met de knop
 *   (WCAG 2.2.2: wat uit zichzelf beweegt, moet stil te zetten zijn);
 * - begint niet als je via een anker bij één kaart binnenkomt (de homepage
 *   linkt naar /band#lid-5): dan staat die kaart links in de rij en blijft hij
 *   daar, in plaats van na vijf seconden weg te schuiven.
 *
 * Zonder JavaScript is het een gewone horizontaal scrollende rij met een
 * zichtbare scrollbalk. Passen alle kaarten naast elkaar, dan verdwijnen de
 * knoppen en de lijn, en staat er niets te schuiven.
 */

/** Tijd tussen twee automatische stappen. */
const INTERVAL = 5000;

type Labels = {
  region: string;
  prev: string;
  next: string;
  pause: string;
  play: string;
};

type Props = {
  children: ReactNode;
  labels: Labels;
  /** Links naast de knoppen, onder de rij: op de homepage de link naar /band. */
  aside?: ReactNode;
};

export function BandCarousel({ children, labels, aside }: Props) {
  const trackRef = useRef<HTMLUListElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Wat het automatisch doorschuiven tegenhoudt, zonder opnieuw te renderen.
  const hold = useRef({ hover: false, focus: false, inView: false });

  /** De lijn onder de rij: breedte = wat je ziet, positie = waar je bent. */
  const paint = useCallback(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    const max = scrollWidth - clientWidth;
    const size = Math.min(1, clientWidth / scrollWidth);
    const at = max > 0 ? scrollLeft / max : 0;
    thumb.style.width = `${size * 100}%`;
    thumb.style.left = `${at * (1 - size) * 100}%`;
  }, []);

  /**
   * Eén kaart verder of terug, rond aan de uiteinden.
   *
   * Het doel is de volgende kaart die links in de rij kan staan, gemeten aan de
   * kaarten zelf en niet aan een vaste breedte: de breedte verschilt per
   * breekpunt, en zo blijft dit kloppen als die in de klassen verandert.
   */
  const step = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    const max = track.scrollWidth - track.clientWidth;
    const stops = [...track.children].map((card) =>
      Math.min(max, Math.max(0, (card as HTMLElement).offsetLeft - pad)),
    );
    const now = track.scrollLeft;

    let target: number;
    if (direction === 1) {
      target =
        now >= max - 2 ? 0 : (stops.find((stop) => stop > now + 2) ?? max);
    } else {
      target =
        now <= 2
          ? max
          : ([...stops].reverse().find((stop) => stop < now - 2) ?? 0);
    }
    track.scrollTo({ left: target, behavior: reduced() ? "auto" : "smooth" });
  }, []);

  // Meten: past alles, of valt er iets te schuiven?
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const more = track.scrollWidth > track.clientWidth + 1;
      setOverflow(more);
      paint();
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(track);
    track.addEventListener("scroll", paint, { passive: true });

    // Pas beginnen als de rij voor het eerst echt in beeld is, niet al tijdens
    // het laden. Daarna telt alleen nog of hij in beeld is.
    let started = false;
    const view = new IntersectionObserver(
      ([entry]) => {
        hold.current.inView = entry.isIntersecting;
        if (entry.isIntersecting && !started) {
          started = true;
          const target = targetCard(track);
          if (target) {
            // De browser zet de kaart verticaal in beeld; opzij schuiven doet
            // hij niet altijd, dus dat hier, en dan blijft de rij staan.
            const pad =
              parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
            track.scrollTo({ left: target.offsetLeft - pad, behavior: "auto" });
          } else if (!reduced()) setPlaying(true);
        }
      },
      { threshold: 0.5 },
    );
    view.observe(track);

    return () => {
      resize.disconnect();
      view.disconnect();
      track.removeEventListener("scroll", paint);
    };
  }, [paint]);

  // Het automatisch doorschuiven.
  useEffect(() => {
    if (!playing || !overflow) return;
    const timer = window.setInterval(() => {
      const { hover, focus, inView } = hold.current;
      if (hover || focus || !inView || document.hidden) return;
      step(1);
    }, INTERVAL);
    return () => window.clearInterval(timer);
  }, [playing, overflow, step]);

  /** Iemand schuift zelf: dan stopt het automatisch doorschuiven voorgoed. */
  const takeOver = () => setPlaying(false);

  return (
    <div
      role="region"
      aria-roledescription="carrousel"
      aria-label={labels.region}
      className="flex flex-col gap-3"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") hold.current.hover = true;
      }}
      onPointerLeave={() => {
        hold.current.hover = false;
      }}
      onFocus={() => {
        hold.current.focus = true;
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          hold.current.focus = false;
      }}
    >
      {/* De rij loopt door tot de rand van het scherm (de negatieve marge heft
          de sectiepadding op), zodat de volgende kaart in de marge al zichtbaar
          is. scroll-padding zet een kaart na het schuiven weer precies op de
          lijn van de kop erboven. */}
      <ul
        ref={trackRef}
        className="relative -mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 [scrollbar-width:none] no-js:[scrollbar-width:thin] sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:-mx-12 lg:scroll-px-12 lg:px-12"
        onPointerDown={takeOver}
        onWheel={(event) => {
          if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) takeOver();
        }}
        onKeyDown={takeOver}
      >
        {children}
      </ul>

      {/* Geen knoppen en geen lijn als er niets te schuiven valt. `invisible`
          en niet weglaten: dan springt de link ernaast niet als dat verandert. */}
      <div className="flex flex-col gap-3">
        <div
          className={`relative h-0.5 bg-line ${overflow ? "" : "invisible"}`}
          aria-hidden="true"
        >
          <span
            ref={thumbRef}
            className="absolute inset-y-0 left-0 w-full bg-primary"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>{aside}</div>

          <div className={`flex gap-2 ${overflow ? "" : "invisible"}`}>
            <ControlButton
              label={playing ? labels.pause : labels.play}
              onClick={() => setPlaying((on) => !on)}
            >
              {playing ? (
                <>
                  <rect x="4" y="3" width="3" height="10" />
                  <rect x="9" y="3" width="3" height="10" />
                </>
              ) : (
                <path d="M4 3 L13 8 L4 13 Z" />
              )}
            </ControlButton>
            <ControlButton
              label={labels.prev}
              onClick={() => {
                takeOver();
                step(-1);
              }}
            >
              <path
                d="M14 8 H3 M7 4 L3 8 L7 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              />
            </ControlButton>
            <ControlButton
              label={labels.next}
              onClick={() => {
                takeOver();
                step(1);
              }}
            >
              <path
                d="M2 8 H13 M9 4 L13 8 L9 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              />
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/** De kaart in deze rij waar het anker in de adresbalk naar wijst, als die er is. */
function targetCard(track: HTMLElement): HTMLElement | null {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return null;
  const el = document.getElementById(id);
  if (!el || !track.contains(el)) return null;
  // De kaart zelf, ook als het anker op iets erbinnen staat.
  return (
    ([...track.children] as HTMLElement[]).find((card) => card.contains(el)) ??
    null
  );
}

/** Een vierkante ghost-knop van 44 bij 44, met een icoon van 16. */
function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="btn btn--ghost flex h-11 w-11 cursor-pointer items-center justify-center"
    >
      <svg
        className="btn__label"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}

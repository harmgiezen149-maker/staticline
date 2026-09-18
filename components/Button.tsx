import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * De drie knopvarianten uit het ontwerp.
 *
 * `primary` is de accentvulling, `ghost` de omlijnde variant naast de primaire
 * knop in de hero, en `inset` de bijna-zwarte knop op de accentbalk. Meer zijn
 * het er niet — een vierde variant hoort eerst ontworpen te worden.
 *
 * Geen radius, geen schaduw, geen transform bij hover: alleen de kleurovergang
 * van 120ms die het hele ontwerp gebruikt.
 */
type Variant = "primary" | "ghost" | "inset";

/**
 * Let op: hier staat bewust géén `display`.
 *
 * Zou `inline-flex` in deze basis staan, dan zou een aanroeper die de knop op
 * mobiel wil verbergen met `hidden` twee display-utilities tegelijk meegeven. Wie
 * er dan wint, hangt af van de volgorde waarin Tailwind ze in de stylesheet zet
 * en niet van de volgorde in het class-attribuut — dat is precies zo'n regel die
 * het op één breekpunt wél doet en op het andere niet. De aanroeper zet de
 * display-waarde daarom zelf.
 */
const base =
  "items-center justify-center font-display font-bold tracking-wide12 uppercase transition-colors duration-[120ms]";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  ghost: "border border-line-strong text-primary hover:border-primary",
  inset: "bg-inset text-primary hover:bg-black",
};

type Props = ComponentProps<typeof Link> & {
  variant?: Variant;
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  return (
    <Link
      {...props}
      className={`${base} ${variants[variant]} ${className}`}
    />
  );
}

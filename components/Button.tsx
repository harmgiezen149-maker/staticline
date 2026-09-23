import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * De drie knopvarianten uit het ontwerp.
 *
 * `primary` is de accentvulling, `ghost` de omlijnde variant naast de primaire
 * knop in de hero, en `inset` de bijna-zwarte knop op de accentbalk. Meer zijn
 * het er niet — een vierde variant hoort eerst ontworpen te worden.
 *
 * Sinds v2 wipet de hovervulling van links in en maakt het label één korte
 * kanaalverschuiving. Dat staat in styles/motion.css onder `.btn`; hier staan
 * alleen de letter en de maat. Het label zit in een eigen `<span>`, omdat de
 * verschuiving een text-shadow op het label is en niet op de vulling.
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
 *
 * Om dezelfde reden staat er in `.btn` in styles/motion.css ook geen display:
 * dat bestand zit buiten de lagen van Tailwind en zou altijd winnen.
 */
const base = "btn items-center justify-center font-display font-bold tracking-wide12 uppercase";

const variants: Record<Variant, string> = {
  primary: "btn--primary",
  ghost: "btn--ghost",
  inset: "btn--inset",
};

type Props = ComponentProps<typeof Link> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className = "", children, ...props }: Props) {
  return (
    <Link {...props} className={`${base} ${variants[variant]} ${className}`}>
      <span className="btn__label">{children}</span>
    </Link>
  );
}

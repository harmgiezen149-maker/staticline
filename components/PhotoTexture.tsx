/**
 * Korrel en tint over een foto, zoals in de hero — maar zachter.
 *
 * De hero legt over zijn achtergrond een donker verloop en de levende korrel
 * (opacity 0,5). Hier dezelfde korrel op ruim de helft daarvan, en een egale
 * warmbruine tint in plaats van een verloop — op een zwart-witfoto een heel
 * lichte sepia: het enige verloop op de site is de
 * leesbaarheidsoverlay in de hero, en dat blijft zo. De foto's lezen er zo als
 * één familie met de hero, zonder dat ze grauw worden.
 *
 * Plaats dit ná het <Image> en vóór het bijschrift, in een ouder met
 * `position: relative` en `overflow: hidden`. Het bijschrift en de knoppen
 * liggen er dan vanzelf boven. De korrel beweegt alleen in beeld en staat stil
 * met minder beweging — zie `.korrel` in styles/motion.css.
 */
export function PhotoTexture() {
  return (
    <>
      <span className="foto-tint" aria-hidden="true" />
      <span className="korrel foto-korrel" aria-hidden="true" />
    </>
  );
}

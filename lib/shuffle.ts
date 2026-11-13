/**
 * Een willekeurige volgorde van 0 tot `count`, als lijst met posities.
 *
 * Voor de ledenkaarten: die komen uit de Band App altijd in dezelfde volgorde,
 * en dan staat steeds dezelfde persoon vooraan. Fisher–Yates, zodat elke
 * volgorde even vaak voorkomt. `random` is in te vullen voor de tests.
 */
export function shuffledOrder(count: number, random: () => number = Math.random): number[] {
  const order = Array.from({ length: Math.max(0, Math.floor(count)) }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

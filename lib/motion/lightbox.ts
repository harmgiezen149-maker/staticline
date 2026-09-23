import { decode } from "./decode";
import { motionOn, tok } from "./env";

/**
 * De lightbox: een foto vliegt van zijn plek in het raster naar het midden.
 *
 * Een gewone `<dialog>`, dus de browser regelt de focus, Escape en de laag
 * erachter. De vlucht is uniform geschaald — de foto wordt nooit breder of
 * smaller getrokken dan hij is — met een clip-path die de uitsnede uit het
 * raster loslaat. Sluiten is de omgekeerde vlucht, en de focus gaat terug naar
 * de foto waar je vandaan kwam.
 *
 * Zonder JavaScript doet de knop niets en staat de foto gewoon in het raster.
 */

type Rect = DOMRect;

function flip(from: Rect, to: Rect) {
  const scale = from.width / to.width;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const visibleHeight = Math.min(to.height, from.height / scale);
  const inset = Math.max(0, (to.height - visibleHeight) / 2);
  return {
    from: {
      transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`,
      clipPath: `inset(${inset}px 0 ${inset}px 0)`,
    },
    to: { transform: "translate3d(0,0,0) scale(1)", clipPath: "inset(0 0 0 0)" },
  };
}

export function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>(".lightbox");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const img = dialog.querySelector<HTMLImageElement>(".lightbox__img");
  const caption = dialog.querySelector<HTMLElement>(".lightbox__caption");
  const scan = dialog.querySelector<HTMLElement>(".lightbox__scan");
  const closeButton = dialog.querySelector<HTMLButtonElement>(".lightbox__close");
  if (!img || !caption) return;

  let origin: HTMLImageElement | null = null;
  let opener: HTMLElement | null = null;

  document.addEventListener("click", async (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>("[data-lightbox]");
    if (!button) return;
    const figure = button.closest(".photo");
    const source = figure?.querySelector<HTMLImageElement>(".photo__img");
    if (!figure || !source) return;

    origin = source;
    opener = button;
    img.style.visibility = "hidden";
    img.src = source.currentSrc || source.src;
    img.alt = source.alt;
    caption.textContent = figure.querySelector("figcaption")?.textContent ?? "";
    caption.classList.remove("is-decoded");
    dialog.showModal();
    // Achter een open dialoog hoort de pagina niet mee te scrollen.
    document.documentElement.style.overflow = "hidden";

    await img.decode().catch(() => {});
    img.style.visibility = "";

    if (!motionOn()) {
      dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
      caption.classList.add("is-decoded");
      return;
    }

    const path = flip(source.getBoundingClientRect(), img.getBoundingClientRect());
    img.animate([path.from, path.to], { duration: 560, easing: tok("--ease-band") });
    scan?.animate([{ opacity: 0 }, { opacity: 0.12 }, { opacity: 0 }], {
      duration: 420,
      easing: "linear",
    });
    setTimeout(() => decode(caption, { duration: 420 }), 260);
  });

  const close = async () => {
    if (motionOn() && origin?.isConnected) {
      const path = flip(origin.getBoundingClientRect(), img.getBoundingClientRect());
      await img
        .animate([path.to, path.from], { duration: 380, easing: tok("--ease-cut") })
        .finished.catch(() => {});
    }
    dialog.close();
  };

  // Escape: zelf afhandelen, zodat ook dan de vlucht terug speelt.
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  closeButton?.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    const target = event.target as Element;
    if (target === dialog || target.classList.contains("lightbox__stage")) close();
  });
  dialog.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
    opener?.focus({ preventScroll: true });
    opener = null;
  });
}

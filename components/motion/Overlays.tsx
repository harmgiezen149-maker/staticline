import type { Copy } from "@/content/types";

/**
 * De lagen die de motion-laag bedient, als gewone markup.
 *
 * Ze staan in de root layout en niet in lib/motion aangemaakt: React beheert de
 * <body>, en een knoop die er buiten React om in komt of uit verdwijnt, geeft
 * bij de volgende render een fout. Alles hier is `aria-hidden` of een native
 * dialoog; een schermlezer leest gewoon de pagina eronder.
 *
 * Zonder JavaScript zijn ze allemaal onzichtbaar (zie styles/motion.css): de
 * loader verschijnt alleen onder `.sl-intro`, de overgang alleen als hij
 * actief is, het cursorlabel alleen met `.is-visible`.
 */
export function Overlays({ copy }: { copy: Copy }) {
  return (
    <>
      {/* De loader "Afstemmen", alleen bij het eerste bezoek in een sessie. */}
      <div className="loader" aria-hidden="true">
        <div className="loader__panel loader__panel--top" />
        <div className="loader__panel loader__panel--bottom" />
        <div className="loader__signal">
          <canvas className="loader__noise" />
          <div className="loader__scan" />
          <div className="loader__track" />
        </div>
        <div className="loader__line" />
        {/* Onder elkaar in plaats van naast elkaar: op deze maat passen ze niet
            meer allebei op de onderste regel. De hint staat boven, zodat het
            label met de teller onderaan blijft staan, waar het in het ontwerp
            staat. */}
        <div className="loader__text">
          <p className="loader__hint">{copy.motion.loaderHint}</p>
          <p className="loader__readout">
            <span>{copy.motion.loaderLabel}</span>
            <span className="loader__count">000</span>
          </p>
        </div>
      </div>

      {/* De kanaalwissel tussen pagina's. Vijf banden; op mobiel valt de
          vijfde weg in CSS. */}
      <div className="pt" aria-hidden="true">
        <div className="pt__band" />
        <div className="pt__band" />
        <div className="pt__band" />
        <div className="pt__band" />
        <div className="pt__band" />
        <p className="pt__label" />
      </div>

      <div className="cursor-label" aria-hidden="true" />

      {/* Eén lightbox per pagina; de foto's in het raster openen hem. */}
      <dialog className="lightbox" aria-label={copy.motion.photo}>
        <div className="absolute inset-x-6 top-16 bottom-18 grid place-items-center lightbox__stage">
          {/* eslint-disable-next-line @next/next/no-img-element -- de bron wordt pas bij het openen
              ingevuld, met het adres dat het raster al geladen heeft; next/image zou er een
              tweede keer een variant van ophalen. */}
          <img
            className="lightbox__img h-auto max-h-full w-auto max-w-full border border-line object-contain"
            alt=""
          />
        </div>
        <p
          className="lightbox__caption absolute bottom-6 left-6 m-0 font-mono text-12 tracking-wide14 text-muted uppercase"
          data-decode
          data-decode-manual
        />
        <button
          type="button"
          className="lightbox__close absolute top-3 right-4 min-h-11 min-w-11 cursor-pointer border border-line-strong bg-inset px-3 font-mono text-12 tracking-wide14 uppercase transition-colors duration-[160ms] hover:border-primary"
        >
          {copy.motion.close}
        </button>
        <div className="lightbox__scan" aria-hidden="true" />
      </dialog>
    </>
  );
}

/**
 * Het script dat vóór de eerste paint de bewegingstoestand op <html> zet.
 *
 * Moet inline in de <head>: stond het in een los bestand of in React, dan zou de
 * pagina eerst zonder die klassen schilderen en daarna verspringen — een blok
 * dat eerst zichtbaar is en dan verdwijnt om binnen te komen. Precies wat v2
 * niet wil. Zie styles/motion.css voor wat elke klasse doet.
 *
 * Het vangnet onderaan is net zo belangrijk als de rest: start de motion-laag
 * niet binnen 2,5 s (een fout, een extensie die scripts blokkeert), dan gaan de
 * begin-toestanden eraf en staat alles gewoon in beeld. Liever geen beweging
 * dan een pagina met onzichtbare blokken.
 *
 * `variant="calm"` is voor het besloten deel: dat krijgt alleen de lichte
 * basis uit v2, zonder loader en zonder entrees.
 */
const PUBLIC = `(function(){var d=document.documentElement;d.classList.remove("no-js");d.classList.add("js");var r=false;try{r=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}if(r){d.classList.add("reduce-motion");return}d.classList.add("motion");var s=true;try{s=sessionStorage.getItem("sl-intro-seen")==="1"||sessionStorage.getItem("sl-lang-swap")!==null}catch(e){}if(!s)d.classList.add("sl-intro");setTimeout(function(){if(!d.classList.contains("motion-ready"))d.classList.remove("motion","sl-intro")},2500)})();`;

const CALM = `(function(){var d=document.documentElement;d.classList.remove("no-js");d.classList.add("js");try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("reduce-motion")}catch(e){}})();`;

export function MotionHead({ variant = "public" }: { variant?: "public" | "calm" }) {
  return (
    <script
      // Een vaste tekst uit dit bestand, geen invoer van buiten.
      dangerouslySetInnerHTML={{ __html: variant === "calm" ? CALM : PUBLIC }}
    />
  );
}

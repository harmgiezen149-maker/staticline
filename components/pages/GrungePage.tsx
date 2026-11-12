import type { ReactNode } from "react";

import { Button } from "@/components/Button";
import { KopTekst } from "@/components/Kop";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getGrunge, PAGE_ARTISTS, type Tone } from "@/content/grunge";
import { fetchBandAppPublic } from "@/lib/band-app";
import { richParts, songsFromPage } from "@/lib/grunge";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * /grunge: "Waar we vandaan komen".
 *
 * GEËXTRAPOLEERD, naar het ontwerp op claude.ai ("Grunge-pagina voor
 * staticline.nl"), dat weer uitgaat van de slides en het verslag van de band.
 * De pagina is een zender met elf kanalen, zoals de slides: een kanaalkiezer
 * onder de kop, en per kanaal een monolabel ("CH 01 · Samenvatting") en een
 * grote kop. Dat sluit aan op de tv-taal van de rest van de site.
 *
 * Binnen de regels van de site: hoek 0, geen schaduwen, geen verlopen, labels
 * recht (schuin alleen in Microduck), geen kanaalverschuiving op de grote
 * koppen. Eén uitzondering, op verzoek: het geel uit de slides (`bg-geel`), als
 * vlakkleur naast rood, teal en crème, en alleen op deze pagina.
 *
 * De inhoud staat in content/grunge, niet in /beheer/inhoud: het zijn vooral
 * lijsten. Alleen "Uit onze set" komt live uit de Band App.
 */

const TONE: Record<Tone, string> = {
  red: "bg-accent text-on-accent",
  teal: "bg-accent-alt text-inset",
  geel: "bg-geel text-inset",
  cream: "bg-primary text-inset",
  grey: "bg-raised text-primary",
};

const container = "mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-12";
const mono = "font-mono text-12 tracking-wide8 uppercase";
const h2 = "font-display text-[clamp(44px,7vw,88px)] leading-[0.95] font-bold uppercase";
const h3 = "font-display text-[clamp(32px,4vw,48px)] leading-none font-bold uppercase";
const card = "border border-line bg-surface";
const plate = "inline-block px-4 py-2 font-display text-18 leading-[1.25] font-semibold uppercase sm:text-20";

/** Tekst met *cursief* voor albumtitels. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {richParts(text).map((part, index) => (part.italic ? <i key={index}>{part.text}</i> : <span key={index}>{part.text}</span>))}
    </>
  );
}

/** Een kanaal: sectie met label en kop. */
function Channel({
  id,
  index,
  label,
  title,
  aside,
  children,
}: {
  id: string;
  index: number;
  label: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-12 border-b border-line py-12 sm:py-16 lg:py-24">
      <div className={`${container} flex flex-col gap-8`}>
        <div className="flex flex-wrap items-end justify-between gap-4" data-reveal="rise">
          <div className="flex flex-col gap-2">
            <p className={`${mono} text-accent-alt`} data-decode>
              CH {String(index).padStart(2, "0")} · {label}
            </p>
            <h2 className={h2}>
              <KopTekst text={title} />
            </h2>
          </div>
          {aside}
        </div>
        {children}
      </div>
    </section>
  );
}

function NowPlaying({ label, text }: { label: string; text: string }) {
  return (
    <p className="font-mono text-12 leading-[18px] tracking-tight4 text-muted">
      ▶ {label}: <Rich text={text} />
    </p>
  );
}

export async function GrungePage({ locale }: { locale: Locale }) {
  const g = getGrunge(locale);
  const c = g.chapters;
  // Nummers van bands op deze pagina uit de eigen setlist. Is de Band App even
  // niet bereikbaar, dan valt het blok weg; de rest van de pagina staat.
  const bandApp = await fetchBandAppPublic().catch(() => null);
  const ours = songsFromPage(bandApp?.setlist ?? [], PAGE_ARTISTS);

  const nav = [
    ["summary", c.summary],
    ["seattle", c.seattle],
    ["recipe", c.recipe],
    ["scene", c.scene],
    ["spot", c.spot],
    ["versus", c.versus],
    ["bands", c.bands],
    ["breakthrough", c.breakthrough],
    ["legacy", c.legacy],
    ["timeline", c.timeline],
    ["top12", c.top12],
  ] as const;

  return (
    <>
      <SiteHeader locale={locale} path="/grunge" />
      <main id="main" tabIndex={-1} className="site-main">
        {/* De opening. Korrel achter de grote kop, zoals in de hero van de
            homepage; nergens achter lopende tekst. */}
        <section className="relative isolate overflow-hidden border-b border-line">
          <div className="korrel -z-10 opacity-50" aria-hidden="true" />
          <div className={`${container} flex flex-col gap-6 py-12 sm:py-20 lg:py-24`}>
            <div className={`${mono} flex flex-wrap justify-between gap-3`}>
              <span className="text-accent-alt" data-decode>
                {g.hero.kicker}
              </span>
              <span className="text-muted">{g.hero.meta}</span>
            </div>
            <h1
              className="font-display text-[clamp(104px,21vw,300px)] leading-[0.82] font-bold tracking-[-0.01em] uppercase"
              tabIndex={-1}
              data-reveal="rise"
            >
              {g.hero.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3" data-reveal="rise">
              <p className={`${plate} ${TONE.red} sm:text-26`}>{g.hero.subtitle}</p>
              <p className={`${plate} ${TONE.geel} sm:text-26`}>{g.hero.tag}</p>
            </div>
            <p className="mt-2 max-w-[680px] text-16 leading-[26px] sm:text-18 sm:leading-[28px]" data-reveal="rise">
              {g.hero.lede}
            </p>
          </div>
        </section>

        {/* De kanaalkiezer. Blijft onder de kop staan; schuift opzij op een
            telefoon. */}
        <nav aria-label={g.navLabel} className="sticky top-[68px] z-40 border-b border-line bg-base">
          <div className={`${container} flex gap-4 overflow-x-auto font-mono text-12 tracking-tight4 whitespace-nowrap uppercase`}>
            {nav.map(([id, chapter], index) => (
              <a
                key={id}
                href={`#${id}`}
                className="inline-flex min-h-11 items-center gap-2 text-muted transition-colors duration-[120ms] hover:text-primary"
              >
                <span className="text-accent-alt">{String(index + 1).padStart(2, "0")}</span>
                {chapter.nav}
              </a>
            ))}
          </div>
        </nav>

        {/* CH 01 */}
        <Channel id="summary" index={1} label={c.summary.label} title={c.summary.title}>
          <div className="grid items-start gap-12 lg:grid-cols-2" data-reveal="rise">
            <div className="flex flex-col gap-4 text-16 leading-[26px] sm:text-18 sm:leading-[28px]">
              {g.summary.paragraphs.map((p) => (
                <p key={p}>
                  <Rich text={p} />
                </p>
              ))}
              <p className="text-muted">{g.summary.quiet}</p>
              <NowPlaying label={g.nowPlaying} text={g.summary.now} />
            </div>
            <dl className="flex flex-col gap-2">
              <Fact label={g.summary.where.label} tone="red">
                <span className="block font-display text-22 leading-[1.2] font-semibold uppercase">{g.summary.where.title}</span>
                <span className="text-14 text-muted">{g.summary.where.sub}</span>
              </Fact>
              <Fact label={g.summary.when.label} tone="teal">
                <span className="grid grid-cols-2 gap-x-4 gap-y-1 text-14 text-muted">
                  {g.summary.when.periods.map((p) => (
                    <span key={p.years}>
                      <b className="font-mono font-normal text-accent-alt">{p.years}</b> {p.text}
                    </span>
                  ))}
                </span>
              </Fact>
              <Fact label={g.summary.bigFour.label} tone="geel">
                <span className="font-display text-20 leading-[1.3] font-semibold uppercase">{g.summary.bigFour.text}</span>
              </Fact>
              <Fact label={g.summary.record.label} tone="cream">
                <span className="block font-display text-22 font-semibold uppercase">{g.summary.record.title}</span>
                <span className="text-14 text-muted">{g.summary.record.sub}</span>
              </Fact>
            </dl>
          </div>
        </Channel>

        {/* CH 02 */}
        <Channel
          id="seattle"
          index={2}
          label={c.seattle.label}
          title={c.seattle.title}
          aside={<p className={`${plate} ${TONE.geel}`}>{g.seattle.tag}</p>}
        >
          <p className="max-w-[760px] text-16 leading-[26px] sm:text-18 sm:leading-[28px]" data-reveal="rise">
            {g.seattle.intro}
          </p>
          <div className="grid gap-6 sm:grid-cols-3" data-reveal="rise">
            {g.seattle.reasons.map((r, index) => (
              <article key={r.title} className={`${card} flex flex-col gap-3 p-6`}>
                <span className="font-display text-64 leading-[0.9] font-bold text-accent">{index + 1}</span>
                <h3 className="font-display text-22 leading-[1.2] font-semibold uppercase sm:text-26">{r.title}</h3>
                <p className="text-15 leading-[24px] text-muted">{r.text}</p>
              </article>
            ))}
          </div>
          <NowPlaying label={g.nowPlaying} text={g.seattle.now} />
        </Channel>

        {/* CH 03 */}
        <Channel id="recipe" index={3} label={c.recipe.label} title={c.recipe.title}>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" data-reveal="rise">
            <ol className="border-t border-line">
              {g.recipe.items.map((item) => (
                <li key={item.code} className="grid grid-cols-[48px_1fr] gap-4 border-b border-line py-4">
                  <span className="font-mono text-18 text-accent-alt">{item.code}</span>
                  <span>
                    <b className="font-display text-22 font-semibold uppercase">{item.title}</b>{" "}
                    {item.who && <span className="text-14 text-muted">{item.who}</span>}
                    <span className="mt-1 block text-15 leading-[24px]">
                      <Rich text={item.text} />
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col items-start gap-6">
              <Cassette label={g.recipe.cassette} />
              <div className="flex items-center gap-4">
                <span aria-hidden="true" className="font-display text-64 leading-none font-bold text-geel">
                  =
                </span>
                <span className={`px-5 py-1 font-display text-[clamp(44px,5vw,56px)] leading-[1.1] font-bold uppercase ${TONE.red}`}>
                  {g.recipe.result}
                </span>
              </div>
              <p className="font-display text-26 leading-[1.2] font-medium text-muted">{g.recipe.quote}</p>
            </div>
          </div>
        </Channel>

        {/* CH 04 */}
        <Channel
          id="scene"
          index={4}
          label={c.scene.label}
          title={c.scene.title}
          aside={
            <aside className={`${card} w-full max-w-[460px]`}>
              <p className={`${plate} ${TONE.geel} block`}>{g.scene.note.title}</p>
              <p className="p-4 text-15 leading-[24px]">{g.scene.note.text}</p>
            </aside>
          }
        >
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" data-reveal="rise">
            {g.scene.steps.map((step) => (
              <li key={step.year} className="flex flex-col gap-3">
                <span className="font-display text-[clamp(44px,5vw,56px)] leading-none font-bold text-accent">{step.year}</span>
                <span aria-hidden="true" className="flex items-center">
                  <span className="size-4 bg-primary" />
                  <span className="h-0.75 flex-1 bg-accent-alt" />
                </span>
                <b className="font-display text-22 font-semibold uppercase">
                  <Rich text={step.title} />
                </b>
                <span className="text-15 leading-[24px] text-muted">{step.text}</span>
              </li>
            ))}
          </ol>
          <NowPlaying label={g.nowPlaying} text={g.scene.now} />
        </Channel>

        {/* CH 05 */}
        <Channel
          id="spot"
          index={5}
          label={c.spot.label}
          title={c.spot.title}
          aside={
            <p className={`${plate} ${TONE.red}`}>
              {g.spot.tag[0]}
              <br />
              {g.spot.tag[1]}
            </p>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal="rise">
            {g.spot.traits.map((t, index) => (
              <article key={t.title} className={`${card} flex flex-col gap-2 p-5`}>
                <h3 className="font-display text-22 font-semibold uppercase">
                  <span className="font-mono text-14 font-normal text-accent">{String(index + 1).padStart(2, "0")} </span>
                  {t.title}
                </h3>
                <p className="text-15 leading-[24px] text-muted">{t.text}</p>
                <p className="mt-auto text-14 text-accent-alt">▶ {t.listen}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-8 border border-line bg-inset p-6 sm:p-8 lg:grid-cols-2" data-reveal="rise">
            <div className="flex flex-col gap-3">
              <p className={`${mono} text-accent-alt`}>{g.spot.bass.kicker}</p>
              <h3 className={h3}>{g.spot.bass.title}</h3>
              <p className="text-16 leading-[26px]">{g.spot.bass.text}</p>
            </div>
            <ul>
              {g.spot.bass.players.map((p) => (
                <li key={p.name} className="border-b border-line py-3 last:border-b-0">
                  <b className="block font-display text-26 font-semibold uppercase">{p.name}</b>
                  <span className="text-14 text-muted">
                    {p.band}
                    {p.listen && ` · ${p.listen}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Channel>

        {/* CH 06 */}
        <Channel id="versus" index={6} label={c.versus.label} title={c.versus.title}>
          <p className="-mt-4 text-16 leading-[26px] text-muted sm:text-18" data-reveal="rise">
            {g.versus.intro}
          </p>
          <div className="overflow-x-auto border border-line" data-reveal="rise">
            <table className="w-full min-w-[860px] border-collapse text-15 leading-[22px]">
              <thead>
                <tr>
                  <td className="w-36 bg-base" />
                  {g.versus.columns.map((col, index) => (
                    <th
                      key={col.name}
                      scope="col"
                      className={`p-4 text-left font-display text-20 font-semibold uppercase ${index === 2 ? TONE.red : "bg-surface"}`}
                    >
                      {col.name} <span className="font-mono text-12 font-normal opacity-80">{col.era}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.versus.rows.map((row) => (
                  <tr key={row.label} className="border-t border-line">
                    <th scope="row" className="px-4 py-3.5 text-left font-display font-semibold text-muted uppercase">
                      {row.label}
                    </th>
                    {row.values.map((value, index) => (
                      <td key={index} className={`px-4 py-3.5 ${index === 2 ? "bg-accent-quiet" : ""}`}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 lg:grid-cols-2" data-reveal="rise">
            {g.versus.notes.map((n) => (
              <aside key={n.title} className={`${card} p-5`}>
                <b className="block font-display text-20 font-semibold uppercase">{n.title}</b>
                <span className="text-15 leading-[24px] text-muted">{n.text}</span>
              </aside>
            ))}
          </div>
        </Channel>

        {/* CH 07 */}
        <Channel
          id="bands"
          index={7}
          label={c.bands.label}
          title={c.bands.title}
          aside={<p className="max-w-[460px] text-16 leading-[26px] text-muted">{g.bands.intro}</p>}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal="rise">
            {g.bands.bigFour.map((band) => (
              <article key={band.name} className={`${card} flex flex-col`}>
                <header className={`px-5 py-4 ${TONE[band.tone]}`}>
                  <h3 className="font-display text-26 leading-[1.1] font-bold uppercase">{band.name}</h3>
                  <span className="text-14">{band.from}</span>
                </header>
                <div className="flex flex-col gap-3 p-5">
                  <p className="text-15 leading-[24px] text-muted">{band.text}</p>
                  <ul className="font-display text-18 leading-[30px] font-medium">
                    {band.albums.map((a) => (
                      <li key={a.title}>
                        <span className="font-mono text-14 text-accent-alt">{a.year}</span> {a.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4" data-reveal="rise">
            <div className="grid items-end gap-6 lg:grid-cols-2">
              <h3 className={h3}>{g.bands.tree.title}</h3>
              <p className="text-16 leading-[26px] text-muted">{g.bands.tree.text}</p>
            </div>
            <FamilyTree t={g.bands.tree} />
          </div>

          <div className="mt-8 flex flex-col gap-4" data-reveal="rise">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className={h3}>{g.bands.pioneers.title}</h3>
              <p className={`${plate} ${TONE.teal}`}>{g.bands.pioneers.tag}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {g.bands.pioneers.items.map((p) => (
                <article key={p.name} className={`${card} flex flex-col gap-1.5 p-4`}>
                  <h4 className="font-display text-20 font-semibold uppercase">{p.name}</h4>
                  <p className="text-14 leading-[22px] text-muted">{p.text}</p>
                  <p className="mt-auto text-14 text-accent-alt">▶ {p.listen}</p>
                </article>
              ))}
            </div>
          </div>
        </Channel>

        {/* CH 08: de krantenkop staat waar de andere kanalen hun kop hebben. */}
        <section id="breakthrough" className="scroll-mt-12 border-b border-line pt-12 sm:pt-16 lg:pt-24">
          <div className={`${container} flex flex-col gap-6`} data-reveal="rise">
            <p className={`${mono} text-accent-alt`} data-decode>
              CH 08 · {c.breakthrough.label}
            </p>
            <p className="flex font-display text-20 font-bold uppercase">
              <span className={`px-3 py-1 ${TONE.red}`}>{g.breakthrough.news}</span>
              <span className={`px-3 py-1 ${TONE.cream}`}>{g.breakthrough.date}</span>
            </p>
            <h2 className={`${h2} max-w-[1000px]`}>
              <span className="text-geel">{g.breakthrough.headline.hot}</span> {g.breakthrough.headline.rest}
            </h2>
            <p className="max-w-[760px] text-16 leading-[26px] sm:text-18 sm:leading-[28px]">{g.breakthrough.text}</p>
            <ul className="grid gap-x-8 gap-y-4 text-15 leading-[24px] sm:grid-cols-2 lg:grid-cols-3">
              {g.breakthrough.items.map((item) => (
                <li key={item} className="grid grid-cols-[40px_1fr]">
                  <span aria-hidden="true" className="font-mono text-danger">
                    +++
                  </span>
                  <span>
                    <Rich text={item} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {/* Een stilstaande balk; de looptekst die beweegt is van Microduck. */}
          <p className={`mt-8 flex overflow-hidden whitespace-nowrap ${TONE.red}`}>
            <span className={`flex-none px-5 py-3 font-display text-18 font-bold uppercase ${TONE.cream}`}>{g.breakthrough.breaking}</span>
            <span className="px-5 py-3 font-mono text-14 tracking-tight4 uppercase">{g.breakthrough.ticker}</span>
          </p>
          <div className={`${container} grid items-start gap-12 py-12 sm:py-16 lg:grid-cols-2 lg:py-24`} data-reveal="rise">
            <div className="flex flex-col gap-4">
              <p className={`${mono} text-accent-alt`}>{g.breakthrough.decline.kicker}</p>
              <h3 className={h3}>{g.breakthrough.decline.date}</h3>
              <p className="text-16 leading-[26px] sm:text-18 sm:leading-[28px]">{g.breakthrough.decline.text}</p>
              <ul className="mt-2 flex flex-col gap-2.5 text-15 leading-[24px] text-muted">
                {g.breakthrough.decline.items.map((item) => (
                  <li key={item} className="grid grid-cols-[20px_1fr]">
                    <span aria-hidden="true" className="mt-2 size-2 bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <aside className={`${card} flex flex-col gap-5 p-6`}>
              <p className="flex items-center gap-3">
                <span className={`px-3 py-1 font-display text-20 font-bold uppercase ${TONE.teal}`}>{g.breakthrough.after.title}</span>
                <span className="font-mono text-12 tracking-wide8 text-muted">{g.breakthrough.after.rewind}</span>
              </p>
              {g.breakthrough.after.items.map((item) => (
                <p key={item.band} className="text-15 leading-[24px]">
                  <b className="font-display text-18 font-semibold uppercase">{item.band}</b> <Rich text={item.text} />
                </p>
              ))}
              <div className="flex flex-col gap-3 border-t border-line pt-4">
                <b className="font-display text-18 font-semibold uppercase">{g.breakthrough.after.hallTitle}</b>
                <div className="grid grid-cols-3 gap-2">
                  {g.breakthrough.after.hall.map((h) => (
                    <div key={h.year} className="bg-inset p-3">
                      <span className="block font-mono text-18 text-accent-alt">{h.year}</span>
                      <span className="font-display font-semibold uppercase">{h.band}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* CH 09 */}
        <Channel
          id="legacy"
          index={9}
          label={c.legacy.label}
          title={c.legacy.title}
          aside={<p className={`${plate} ${TONE.geel}`}>{g.legacy.tag}</p>}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal="rise">
            {g.legacy.channels.map((ch) => (
              <article key={ch.title} className={`${card} flex flex-col`}>
                <header className={`px-5 py-4 ${TONE[ch.tone]}`}>
                  <span className="font-mono text-12 tracking-tight4 uppercase">{ch.kicker}</span>
                  <h3 className="mt-1 font-display text-26 leading-[1.1] font-bold uppercase">{ch.title}</h3>
                </header>
                <p className="px-5 pt-5 text-15 leading-[24px] text-muted">{ch.text}</p>
                <p className="mt-auto px-5 pt-4 pb-5 text-14 leading-[22px] text-accent-alt">{ch.bands}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]" data-reveal="rise">
            <div className="flex flex-col gap-3">
              <p className={`${mono} text-accent-alt`}>{g.legacy.post.kicker}</p>
              <h3 className={h3}>{g.legacy.post.title}</h3>
              <p className="text-16 leading-[26px]">{g.legacy.post.text}</p>
              <p className={`${plate} ${TONE.red} mt-2 self-start text-16 sm:text-18`}>
                {g.legacy.post.critics[0]}
                <br />
                {g.legacy.post.critics[1]}
              </p>
            </div>
            <div className="overflow-x-auto border border-line">
              <table className="w-full min-w-[620px] border-collapse text-14 leading-[22px]">
                <thead>
                  <tr className="font-mono text-12 tracking-tight4 text-muted uppercase">
                    {g.legacy.post.head.map((h) => (
                      <th key={h} scope="col" className="px-4 py-3 text-left font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.legacy.post.waves.map((w) => (
                    <tr key={w.name} className={w.heir ? "border-y border-accent bg-accent-quiet" : "border-t border-line"}>
                      <th scope="row" className="px-4 py-3.5 text-left align-top">
                        <span className="block font-display text-18 font-semibold uppercase">{w.name}</span>
                        {w.years && <span className="font-mono text-12 font-normal text-accent-alt">{w.years}</span>}
                      </th>
                      <td className="px-4 py-3.5 align-top">{w.bands}</td>
                      <td className="px-4 py-3.5 align-top">
                        <Rich text={w.albums} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Channel>

        {/* CH 10 */}
        <Channel
          id="timeline"
          index={10}
          label={c.timeline.label}
          title={c.timeline.title}
          aside={<p className="max-w-[520px] text-16 leading-[26px] text-muted">{g.timeline.intro}</p>}
        >
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" data-reveal="rise">
            {g.timeline.phases.map((p) => (
              <li key={p.name} className={`px-4 py-3 ${TONE[p.tone]}`}>
                <b className="block font-display text-20 font-semibold uppercase">{p.name}</b>
                <span className="font-mono text-12">{p.years}</span>
              </li>
            ))}
          </ol>
          <ol className="grid grid-cols-2 gap-x-4 gap-y-6 text-14 leading-[21px] sm:grid-cols-3 lg:grid-cols-5" data-reveal="rise">
            {g.timeline.years.map((y) => (
              <li
                key={y.year}
                className={`border-t-[3px] pt-3 ${y.tone === "red" ? "border-accent" : y.tone === "teal" ? "border-accent-alt" : "border-line-strong"}`}
              >
                <b className={`block font-mono text-22 leading-8 font-normal ${y.tone === "red" ? "text-danger" : "text-accent-alt"}`}>{y.year}</b>
                <Rich text={y.text} />
              </li>
            ))}
          </ol>
        </Channel>

        {/* CH 11 */}
        <Channel
          id="top12"
          index={11}
          label={c.top12.label}
          title={c.top12.title}
          aside={
            <div className="flex max-w-[460px] flex-col items-start gap-4">
              <p className="text-16 leading-[26px] text-muted">{g.top12.intro}</p>
              {/* De Spotify-lijst komt later; zonder adres geen knop. */}
              {g.top12.spotify && (
                <a
                  href={g.top12.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--primary inline-flex min-h-12 items-center justify-center px-6 font-display text-15 font-bold tracking-wide12 uppercase"
                >
                  <span className="btn__label">{g.top12.spotifyLabel}</span>
                </a>
              )}
            </div>
          }
        >
          <ol className="grid gap-2 lg:grid-cols-2 lg:gap-x-6" data-reveal="rise">
            {g.top12.items.map((item, index) => {
              const hot = index === 5;
              return (
                <li key={item.title} className={`grid grid-cols-[48px_1fr_auto] items-center gap-3 px-4 py-3 ${hot ? TONE.red : "bg-surface"}`}>
                  <span className={`text-right font-display text-30 leading-none font-bold sm:text-[36px] ${hot ? "" : "text-accent"}`}>{index + 1}</span>
                  <span>
                    <b className="block font-display text-16 leading-[1.25] font-semibold uppercase sm:text-18">{item.title}</b>
                    <span className={`text-12 sm:text-14 ${hot ? "" : "text-muted"}`}>{item.note}</span>
                  </span>
                  <span className={`font-mono text-14 ${hot ? "" : "text-accent-alt"}`}>{item.year}</span>
                </li>
              );
            })}
          </ol>
        </Channel>

        {/* De uitsmijter: van deze pagina naar de zaal. De site is er om
            geboekt te worden. */}
        <section className="relative isolate overflow-hidden py-12 sm:py-16 lg:py-24">
          <div className="korrel -z-10 opacity-35" aria-hidden="true" />
          <div className={`${container} grid items-start gap-12 lg:grid-cols-2`} data-reveal="rise">
            <div className="flex flex-col gap-6">
              <p className={`${mono} text-accent-alt`} data-decode>
                {g.outro.kicker}
              </p>
              <h2 className="font-display text-[clamp(64px,11vw,140px)] leading-[0.85] font-bold uppercase">
                <KopTekst text={g.outro.title} />
              </h2>
              <p className="max-w-[520px] text-16 leading-[26px] sm:text-18 sm:leading-[28px]">{g.outro.text}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button href={localePath(locale, "/agenda")} variant="primary" className="flex min-h-12 px-7 py-3.5 text-15 sm:inline-flex sm:text-16">
                  {g.outro.show}
                </Button>
                <Button href={localePath(locale, "/boeken")} variant="ghost" className="flex min-h-12 px-7 py-3.5 text-15 sm:inline-flex sm:text-16">
                  {g.outro.book}
                </Button>
              </div>
            </div>
            {ours.length > 0 && (
              <aside className={`${card} flex flex-col gap-3 p-6`}>
                <p className={`${mono} text-accent-alt`}>{g.outro.setKicker}</p>
                <p className="text-15 leading-[24px] text-muted">{g.outro.setText}</p>
                <ul>
                  {ours.map((song) => (
                    <li key={`${song.artist}-${song.title}`} className="flex justify-between gap-3 border-t border-line py-2.5">
                      <b className="font-display text-18 font-semibold uppercase">{song.title}</b>
                      <span className="text-right text-14 text-muted">{song.artist}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
          <div className={`${container} mt-16`}>
            <div className="border-t border-line pt-4 text-12 leading-[20px] text-muted sm:text-14">
              <b className={`${mono} font-normal text-accent-alt`}>{g.outro.sourcesTitle}</b>
              <ul className="mt-1">
                {g.outro.sources.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} target="_blank" rel="noreferrer" className="text-accent-alt underline underline-offset-2 hover:text-primary">
                      {s.text}
                    </a>
                    {s.suffix}
                  </li>
                ))}
              </ul>
              <p className="mt-1">{g.outro.sourcesNote}</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}

/** Eén regel van "In het kort": een gekleurd vlak met het label, en de inhoud. */
function Fact({ label, tone, children }: { label: string; tone: Tone; children: ReactNode }) {
  return (
    <div className={`${card} grid grid-cols-[104px_1fr] sm:grid-cols-[128px_1fr]`}>
      <dt className={`flex items-center justify-center px-2 text-center font-display text-18 font-bold uppercase sm:text-20 ${TONE[tone]}`}>{label}</dt>
      <dd className="px-5 py-4">{children}</dd>
    </div>
  );
}

/** De cassette van "Het recept". Een tekening, geen foto. */
function Cassette({ label }: { label: string }) {
  return (
    <svg role="img" aria-label={label} viewBox="0 0 380 240" className="h-auto w-full max-w-[380px]">
      <rect x="2" y="2" width="376" height="236" fill="var(--bg-raised)" stroke="var(--border-strong)" strokeWidth="2" />
      <rect x="30" y="22" width="320" height="120" fill="var(--text-primary)" />
      <rect x="30" y="34" width="320" height="6" fill="var(--accent)" />
      <rect x="30" y="44" width="320" height="4" fill="var(--accent-alt)" />
      <text x="190" y="80" textAnchor="middle" fontFamily="var(--font-display)" fontSize="22" fontWeight="600" fill="var(--bg-base)">
        {label.toUpperCase()}
      </text>
      <rect x="104" y="94" width="172" height="40" fill="var(--bg-base)" />
      <circle cx="136" cy="114" r="12" fill="none" stroke="var(--text-primary)" strokeWidth="5" />
      <circle cx="244" cy="114" r="12" fill="none" stroke="var(--text-primary)" strokeWidth="5" />
      <rect x="166" y="110" width="48" height="8" fill="var(--border-strong)" />
      <path d="M 92 236 L 112 176 L 268 176 L 288 236" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="2" />
    </svg>
  );
}

type Tree = ReturnType<typeof getGrunge>["bands"]["tree"];

/**
 * De familieboom. Een vaste tekening van 1072 bij 712: op een telefoon schuift
 * hij opzij in zijn kader, net als de tabellen. De lijnen zijn één svg eronder,
 * de bands gewone tekst erboven, zodat ze te lezen en te vertalen zijn.
 */
function FamilyTree({ t }: { t: Tree }) {
  const box = "absolute box-border flex h-[88px] flex-col justify-center px-4 py-3";
  const name = "font-display text-22 font-bold uppercase";
  const label = "absolute font-mono text-12 leading-4 text-primary";
  return (
    <div className="overflow-x-auto border border-line bg-inset">
      <div className="relative h-[712px] w-[1072px]">
        <svg aria-hidden="true" width="1072" height="712" className="absolute inset-0" fill="none" strokeWidth="2">
          <defs>
            <marker id="boom-pijl" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" fill="var(--text-muted)" />
            </marker>
            <marker id="boom-pijl-teal" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" fill="var(--accent-alt)" />
            </marker>
          </defs>
          <g stroke="var(--text-muted)">
            <path d="M355 128 V176 M180 176 H530" />
            <path d="M180 176 V222" markerEnd="url(#boom-pijl)" />
            <path d="M530 176 V222" markerEnd="url(#boom-pijl)" />
            <path d="M880 128 V268 H682" markerEnd="url(#boom-pijl)" />
            <path d="M530 312 V406" markerEnd="url(#boom-pijl)" />
          </g>
          <g stroke="var(--accent-alt)">
            <path d="M530 496 V544 H880 V496" />
            <path d="M705 544 V590" markerEnd="url(#boom-pijl-teal)" />
          </g>
        </svg>
        <div className={`${box} ${TONE.red} w-[300px]`} style={{ left: 205, top: 40 }}>
          <b className={name}>Green River</b>
          <span className="text-12">{t.greenRiver}</span>
        </div>
        <div className={`${box} w-[300px] border border-line-strong bg-surface`} style={{ left: 730, top: 40 }}>
          <b className={name}>Malfunkshun</b>
          <span className="text-12 text-muted">{t.malfunkshun}</span>
        </div>
        <div className={`${box} w-[280px] border border-line-strong bg-surface`} style={{ left: 40, top: 224 }}>
          <b className={name}>Mudhoney</b>
          <span className="text-12 text-muted">{t.mudhoney}</span>
        </div>
        <div className={`${box} w-[300px] border border-line-strong bg-surface`} style={{ left: 380, top: 224 }}>
          <b className={name}>Mother Love Bone</b>
          <span className="text-12 text-muted">{t.motherLoveBone}</span>
        </div>
        <div className={`${box} ${TONE.teal} w-[300px]`} style={{ left: 380, top: 408 }}>
          <b className={name}>Pearl Jam</b>
          <span className="text-12">{t.pearlJam}</span>
        </div>
        <div className={`${box} w-[300px] border border-line-strong bg-surface`} style={{ left: 730, top: 408 }}>
          <b className={name}>Soundgarden</b>
          <span className="text-12 text-muted">{t.soundgarden}</span>
        </div>
        <div className={`${box} w-[300px] border border-accent-alt bg-surface`} style={{ left: 555, top: 592, height: 80 }}>
          <b className={name}>Temple of the Dog</b>
          <span className="text-12 text-muted">{t.temple}</span>
        </div>
        <span className={label} style={{ left: 367, top: 144 }}>
          {t.split}
        </span>
        <span className={label} style={{ left: 892, top: 190 }}>
          {t.wood}
        </span>
        <span className={label} style={{ left: 542, top: 351 }}>
          {t.vedder}
        </span>
      </div>
    </div>
  );
}


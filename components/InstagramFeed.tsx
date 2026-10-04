import { handleFrom } from "@/lib/instagram";
import { getInstagramPosts } from "@/lib/instagram-feed";
import type { Locale } from "@/lib/i18n";
import { getSiteCopy, getSocials } from "@/lib/site-content";

/**
 * De laatste Instagram-posts, op de homepage onder de shows.
 *
 * EXTRAPOLATIE: dit blok staat niet in de design-handoff. Het volgt de kop van
 * `ShowList` (dezelfde maat, het masker en de lijn eronder) en de tegels van
 * `PhotoGrid` (een rand in --line op --bg-inset, radius 0), zonder nieuwe
 * kleuren, schaduwen of bewegingen. De entree is die van de foto's.
 *
 * Wat er staat:
 * - zes tegels: op een telefoon twee naast elkaar, op tablet drie, op desktop
 *   zes in één rij; elke tegel opent de post op Instagram;
 * - daaronder de link naar het profiel.
 *
 * Geen posts — geen sleutel ingesteld, de sleutel verlopen, Instagram even
 * weg — dan alleen de kop en de link. Staat er ook geen profiel in
 * /beheer/inhoud, dan blijft het hele blok weg. Zie lib/instagram-feed.ts.
 */
export async function InstagramFeed({ locale }: { locale: Locale }) {
  const [copy, posts, socials] = await Promise.all([
    getSiteCopy(locale),
    getInstagramPosts(),
    getSocials(),
  ]);
  const profile = socials.instagram;
  if (posts.length === 0 && !profile) return null;

  const handle = handleFrom(profile);
  const t = copy.instagram;

  return (
    <section
      id="instagram"
      className="flex flex-col gap-3 px-5 py-6 sm:gap-6 sm:px-8 sm:py-12 lg:px-12 lg:py-16"
    >
      <div
        className="kop-lijn flex items-baseline gap-4 border-b-2 border-primary pb-2 sm:pb-3"
        data-reveal="mask"
      >
        <h2 className="font-display text-26 leading-[1.05] font-bold tracking-tight2 uppercase sm:text-[clamp(28px,4vw,44px)]">
          <span className="mask-line">
            <span>{t.heading}</span>
          </span>
        </h2>
        {handle && (
          <span className="hidden font-mono text-12 tracking-wide18 text-faint sm:inline" data-decode>
            {handle}
          </span>
        )}
      </div>

      {posts.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-6">
          {posts.map((post) => (
            <li key={post.id} data-reveal="" data-stagger="photo">
              <a
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-square overflow-hidden border border-line bg-inset transition-colors hover:border-accent-alt focus-visible:border-accent-alt"
              >
                {/* Een gewone <img> en geen next/image: de beelden staan op
                    Instagram, en next.config.ts laat bewust alleen de eigen
                    Blob-opslag toe. Die lijst verruimen maakt van deze site een
                    afbeeldingsproxy. `no-referrer`, want Instagram hoeft niet te
                    weten op welke pagina iemand zat. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image}
                  alt={post.alt || t.alt}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {post.isVideo && (
                  <span className="absolute top-2 left-2 bg-base px-2 py-1 font-mono text-11 tracking-wide14 text-primary uppercase">
                    {t.video}
                  </span>
                )}
                <span className="sr-only"> ({t.newWindow})</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {profile && (
        <a
          href={profile}
          target="_blank"
          rel="me noopener noreferrer"
          className="inline-flex min-h-11 items-center self-start font-mono text-12 tracking-wide14 text-accent-alt uppercase"
        >
          <span className="link-line">{t.follow} →</span>
          <span className="sr-only"> ({t.newWindow})</span>
        </a>
      )}
    </section>
  );
}

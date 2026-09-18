import { Embed } from "@/components/Embed";
import { Empty, Page, Section } from "@/components/Page";
import { getCopy } from "@/content";
import { videos } from "@/content/media";
import type { Locale } from "@/lib/i18n";

/**
 * De videopagina.
 *
 * GEËXTRAPOLEERD. Er is nog geen beeld; zodra er een YouTube-id in
 * content/media.ts staat, verschijnt het hier. De embeds laden pas na een klik —
 * zie components/Embed.tsx voor waarom.
 */
export function VideoPage({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);

  return (
    <Page
      locale={locale}
      path="/video"
      title={copy.video.title}
      intro={copy.video.intro}
    >
      {videos.length === 0 ? (
        <Empty>{copy.video.empty}</Empty>
      ) : (
        videos.map((video) => (
          <Section key={video.id} title={video.title}>
            <Embed
              service="YouTube"
              title={video.title}
              height={420}
              copy={copy.embed}
              // nocookie-variant: zet pas een cookie als er echt afgespeeld wordt.
              src={`https://www.youtube-nocookie.com/embed/${video.id}`}
            />
          </Section>
        ))
      )}
    </Page>
  );
}

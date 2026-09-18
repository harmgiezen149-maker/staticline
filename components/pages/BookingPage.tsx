import { BookingForm } from "@/components/BookingForm";
import { Empty, Page, Section } from "@/components/Page";
import { getCopy } from "@/content";
import { getRiderUrl } from "@/lib/band-app";
import type { Locale } from "@/lib/i18n";

/**
 * De boekingspagina.
 *
 * Dit is waarom de site bestaat — alle drie de bandleden zeiden het in hun eigen
 * woorden in de vragenlijst. Vandaar dat het formulier bovenaan staat en de rider
 * eronder, en niet andersom.
 */
export async function BookingPage({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const riderUrl = await getRiderUrl();

  return (
    <Page
      locale={locale}
      path="/boeken"
      title={copy.booking.title}
      intro={copy.booking.intro}
    >
      <BookingForm
        copy={copy.booking}
        locale={locale}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />

      <Section title={copy.booking.riderTitle}>
        <p className="max-w-[560px] text-14 leading-[22px] text-muted sm:text-16 sm:leading-[26px]">
          {copy.booking.riderBody}
        </p>
        {riderUrl ? (
          <a
            href={riderUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 w-fit items-center border border-line-strong px-6 py-3 font-display text-15 font-bold tracking-wide12 text-primary uppercase transition-colors duration-[120ms] hover:border-primary"
          >
            {copy.booking.riderLink}
          </a>
        ) : (
          <Empty>{copy.booking.riderEmpty}</Empty>
        )}
      </Section>
    </Page>
  );
}

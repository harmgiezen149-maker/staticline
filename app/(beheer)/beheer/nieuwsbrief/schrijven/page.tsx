import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { IssueEditor } from "@/components/beheer/IssueEditor";
import { Shell } from "@/components/beheer/Shell";
import { EDITABLE, getIssue } from "@/lib/issues";
import { audienceSize } from "@/lib/list-mail";
import { getSession } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Nieuwsbrief schrijven" };

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

/**
 * Een nieuwsbrief schrijven of bijwerken. Zonder `?id=` een nieuwe.
 *
 * Alleen voor een beheerder, net als het versturen van showmails: dit gaat naar
 * iedereen op de lijst die ander nieuws wil.
 */
export default async function SchrijvenPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string | string[];
    melding?: string | string[];
  }>;
}) {
  const session = await getSession();
  if (!session) redirect("/beheer/login");
  if (session.role !== "admin") redirect("/beheer/nieuwsbrief");

  const params = await searchParams;
  const id = Number(first(params.id));
  const issue = Number.isInteger(id) && id > 0 ? await getIssue(id) : null;
  if (first(params.id) && !issue) redirect("/beheer/nieuwsbrief");

  const audience = await audienceSize("news");
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Europe/Amsterdam",
  });

  const status = issue
    ? {
        draft: "Concept",
        scheduled: `Ingepland voor de ochtend van ${issue.scheduled_for}`,
        sending: "Wordt verstuurd",
        sent: `Verstuurd naar ${issue.recipients} adressen`,
        failed: "Versturen mislukt — opnieuw te proberen",
      }[issue.status]
    : "Nieuw";

  return (
    <Shell session={session} title="Nieuwsbrief schrijven">
      <div className="flex flex-col gap-6">
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Link
            href="/beheer/nieuwsbrief"
            className="font-mono text-12 uppercase underline hover:text-primary"
          >
            ← Nieuwsbrief
          </Link>
          <span className="font-mono text-12 text-faint uppercase">
            {status}
          </span>
        </p>
        <IssueEditor
          key={issue?.id ?? "nieuw"}
          id={issue?.id}
          initial={{
            subject_nl: issue?.subject_nl ?? "",
            body_nl: issue?.body_nl ?? "",
            subject_en: issue?.subject_en ?? "",
            body_en: issue?.body_en ?? "",
            scheduled_for: issue?.scheduled_for ?? null,
          }}
          editable={!issue || EDITABLE.includes(issue.status)}
          audience={audience}
          today={today}
          notice={first(params.melding)}
        />
      </div>
    </Shell>
  );
}

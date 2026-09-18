"use client";

import { useActionState } from "react";

import {
  type SaveState,
  addVideo,
  deleteMedia,
} from "@/app/(beheer)/beheer/inhoud/actions";

export type VideoItem = { id: number; youtubeId: string; title: string };

/**
 * De video's op /video.
 *
 * Toevoegen met het volledige YouTube-adres; het id wordt er serverzijde
 * uitgehaald. Vragen om "alleen het id" is een instructie die niemand onthoudt,
 * en dan staat er een halve URL in de database.
 */
export function VideoManager({ videos }: { videos: VideoItem[] }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    addVideo,
    null,
  );

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-11 text-faint uppercase">Video&apos;s</h2>

      {videos.length === 0 ? (
        <p className="text-muted">
          Nog geen video&apos;s. De videopagina toont zolang een lege staat.
        </p>
      ) : (
        <ul className="flex flex-col">
          {videos.map((video) => (
            <VideoRow key={video.id} video={video} />
          ))}
        </ul>
      )}

      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">
            YouTube-link
          </span>
          <input
            type="text"
            name="url"
            placeholder="https://www.youtube.com/watch?v=…"
            className="border border-line-default bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-11 text-faint uppercase">Titel</span>
          <input
            type="text"
            name="title"
            placeholder="Loburg, 10 november 2026"
            className="border border-line-default bg-inset px-4 py-3 text-primary transition-colors duration-[120ms] focus:border-line-strong"
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center border border-line-strong px-5 py-2 font-display text-14 font-bold tracking-wide12 uppercase transition-colors duration-[120ms] hover:border-primary disabled:opacity-60"
          >
            {pending ? "Bezig…" : "Video toevoegen"}
          </button>
          {state && (
            <span className={state.ok ? "text-muted" : "text-danger"}>
              {state.message}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

function VideoRow({ video }: { video: VideoItem }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    deleteMedia,
    null,
  );

  if (state?.ok) {
    return (
      <li className="border-b border-line-default py-2 text-muted">
        {video.title} is verwijderd.
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line-default py-2">
      <span className="flex flex-wrap items-baseline gap-x-3">
        <span>{video.title}</span>
        <span className="font-mono text-11 text-faint">{video.youtubeId}</span>
      </span>
      <span className="flex items-center gap-3">
        {state && !state.ok && <span className="text-danger">{state.message}</span>}
        <form action={action}>
          <input type="hidden" name="id" value={video.id} />
          <button
            type="submit"
            disabled={pending}
            className="font-mono text-11 text-muted uppercase underline transition-colors duration-[120ms] hover:text-danger disabled:opacity-60"
          >
            {pending ? "Bezig…" : "Verwijderen"}
          </button>
        </form>
      </span>
    </li>
  );
}

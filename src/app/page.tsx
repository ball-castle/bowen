import {
  Sparkles,
} from "lucide-react";

import { ExhibitionGallery } from "@/components/exhibition-gallery";
import { UploadPanel } from "@/components/upload-panel";
import { Badge } from "@/components/ui/badge";
import { readGalleryEntries } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await readGalleryEntries();
  const photoCount = entries.reduce((total, entry) => total + entry.images.length, 0);
  const venueCount = new Set(
    entries.map((entry) => entry.venue.trim()).filter(Boolean),
  ).size;

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(120deg,rgba(255,255,255,0.35),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.18),transparent_72%)]" />
      <div className="pointer-events-none absolute left-[-12%] top-[-8%] -z-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[-10%] -z-10 h-80 w-80 rounded-full bg-teal-300/30 blur-3xl sm:h-[26rem] sm:w-[26rem]" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-black/8 bg-white/72 p-6 shadow-[0_24px_90px_-42px_rgba(30,41,59,0.5)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border-0 bg-primary/12 px-4 py-1.5 text-[11px] tracking-[0.24em] text-primary uppercase">
                Exhibition Upload
              </Badge>
              <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-zinc-500 uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Archive
              </span>
            </div>

            <div className="mt-8 space-y-5">
              <div className="space-y-4">
                <h1 className="max-w-4xl text-5xl leading-[0.92] font-semibold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl [font-family:var(--font-editorial)]">
                  展览照片上传与归档
                </h1>
                <p className="max-w-xl text-base leading-8 text-zinc-600 sm:text-lg">
                  上传图片，整理批次，直接在首页查看。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.6rem] border border-white/60 bg-white/70 p-4 backdrop-blur">
                  <p className="text-xs tracking-[0.22em] text-zinc-500 uppercase">
                    批次
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-900">
                    {entries.length}
                  </p>
                </div>
                <div className="rounded-[1.6rem] border border-white/60 bg-white/70 p-4 backdrop-blur">
                  <p className="text-xs tracking-[0.22em] text-zinc-500 uppercase">
                    照片
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-900">
                    {photoCount}
                  </p>
                </div>
                <div className="rounded-[1.6rem] border border-white/60 bg-white/70 p-4 backdrop-blur">
                  <p className="text-xs tracking-[0.22em] text-zinc-500 uppercase">
                    场馆
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-900">
                    {venueCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <UploadPanel />
        </section>

        <section>
          <ExhibitionGallery entries={entries} />
        </section>
      </main>
    </div>
  );
}

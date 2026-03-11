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
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(120deg,rgba(255,255,255,0.42),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.2),transparent_74%)]" />
      <div className="pointer-events-none absolute left-[-10%] top-[-8%] -z-10 h-72 w-72 rounded-full bg-amber-200/30 blur-[110px] sm:h-[24rem] sm:w-[24rem]" />
      <div className="pointer-events-none absolute bottom-[-14%] right-[-8%] -z-10 h-80 w-80 rounded-full bg-sky-200/30 blur-[120px] sm:h-[28rem] sm:w-[28rem]" />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(23rem,0.92fr)]">
          <div className="rounded-[1.8rem] border border-black/8 bg-white/80 p-6 shadow-[0_28px_90px_-56px_rgba(15,23,42,0.38)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full border-0 bg-primary/10 px-3.5 py-1 text-[11px] font-medium tracking-[0.22em] text-primary uppercase">
                  Exhibition Upload
                </Badge>
                <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
                  <Sparkles className="h-3.5 w-3.5" />
                  Curated Archive
                </span>
              </div>
              <span className="rounded-full border border-black/8 bg-white/70 px-3 py-1 text-xs text-zinc-500">
                单次最多 12 张图片
              </span>
            </div>

            <div className="mt-9 space-y-6">
              <div className="space-y-4">
                <h1 className="max-w-3xl text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.05em] text-zinc-950 sm:text-[3.5rem] lg:text-[4.2rem]">
                  展览照片上传与归档
                </h1>
                <p className="max-w-xl text-sm leading-7 text-zinc-600 sm:text-base">
                  统一收集每次展览的现场照片，按批次沉淀，上传后首页即时刷新，归档内容一眼就能找到。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.35rem] border border-black/8 bg-white/72 p-4 backdrop-blur">
                  <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
                    批次
                  </p>
                  <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.03em] text-zinc-950">
                    {entries.length}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-black/8 bg-white/72 p-4 backdrop-blur">
                  <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
                    照片
                  </p>
                  <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.03em] text-zinc-950">
                    {photoCount}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-black/8 bg-white/72 p-4 backdrop-blur">
                  <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
                    场馆
                  </p>
                  <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.03em] text-zinc-950">
                    {venueCount}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 text-xs text-zinc-500">
                <span className="rounded-full border border-black/8 bg-white/65 px-3 py-1.5">
                  支持 JPG / PNG / WEBP / AVIF / GIF
                </span>
                <span className="rounded-full border border-black/8 bg-white/65 px-3 py-1.5">
                  首页按最新批次排序
                </span>
                <span className="rounded-full border border-black/8 bg-white/65 px-3 py-1.5">
                  上传后自动刷新图片墙
                </span>
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

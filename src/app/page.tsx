import { ExhibitionGallery } from "@/components/exhibition-gallery";
import { UploadPanel } from "@/components/upload-panel";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { readGalleryEntries } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await readGalleryEntries();
  const latestEntry = entries[0];
  const photoCount = entries.reduce((total, entry) => total + entry.images.length, 0);
  const venueCount = new Set(
    entries.map((entry) => entry.venue.trim()).filter(Boolean),
  ).size;
  const stats = [
    { label: "批次", value: entries.length },
    { label: "照片", value: photoCount },
    { label: "场馆", value: venueCount },
  ];

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[linear-gradient(125deg,rgba(255,255,255,0.78),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.34),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(rgba(39,47,55,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(39,47,55,0.035)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.28),transparent_86%)]" />
      <div className="pointer-events-none absolute left-[-9%] top-[-7%] -z-10 h-72 w-72 rounded-full bg-amber-100/40 blur-[125px] sm:h-[23rem] sm:w-[23rem]" />
      <div className="pointer-events-none absolute bottom-[-14%] right-[-6%] -z-10 h-80 w-80 rounded-full bg-sky-100/38 blur-[130px] sm:h-[27rem] sm:w-[27rem]" />
      <div className="pointer-events-none absolute left-[32%] top-[18%] -z-10 h-56 w-56 rounded-full bg-rose-100/30 blur-[130px]" />

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(24rem,27rem)]">
          <div className="animate-in fade-in slide-in-from-bottom-4 rounded-[2rem] border border-black/7 bg-white/82 p-6 shadow-[0_34px_110px_-70px_rgba(24,34,43,0.34)] backdrop-blur-xl duration-700 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border-0 bg-primary/8 px-3.5 py-1 text-[11px] font-medium tracking-[0.22em] text-primary uppercase">
                Exhibition Archive
              </Badge>
              <p className="text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
                Latest First
              </p>
            </div>

            <div className="mt-10 space-y-5 sm:mt-12">
              <h1 className="max-w-4xl font-[family:var(--font-display)] text-[3rem] leading-[0.94] font-semibold tracking-[-0.06em] text-zinc-950 sm:text-[4rem] lg:text-[5.35rem]">
                展览照片上传与归档
              </h1>
              <p className="max-w-xl text-[15px] leading-7 text-zinc-600 sm:text-base">
                把每次展览的照片和基本信息整理成一组完整批次，让上传与浏览都保持清楚、安静、可回看。
              </p>
            </div>

            <div className="mt-10 space-y-3 sm:mt-12">
              <div className="flex items-center justify-between text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
                <span>Overview</span>
                <span>Archive Data</span>
              </div>
              <div className="grid gap-px overflow-hidden rounded-[1.35rem] border border-black/8 bg-black/[0.045] sm:grid-cols-3">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={cn(
                      "bg-white/78 px-4 py-4 backdrop-blur-sm sm:px-5 sm:py-5",
                      index === 2 ? "col-span-2 sm:col-span-1" : "",
                    )}
                  >
                    <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-[1.65rem] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[1.85rem]">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-[1.35rem] border border-black/8 bg-[linear-gradient(180deg,rgba(252,249,244,0.9),rgba(255,255,255,0.78))] px-4 py-4 sm:mt-6 sm:flex-row sm:items-end sm:justify-between sm:px-5">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                  最近更新
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-zinc-950">
                  {latestEntry ? latestEntry.exhibitionName : "等待第一组上传"}
                </p>
              </div>
              <div className="space-y-1 text-sm leading-6 text-zinc-500 sm:text-right">
                <p>
                  {latestEntry
                    ? formatDateTimeLabel(latestEntry.createdAt)
                    : "上传完成后会立即出现在这里"}
                </p>
                <p>{latestEntry?.venue?.trim() || "按批次倒序排列展示"}</p>
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

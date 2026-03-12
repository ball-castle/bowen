import { ExhibitionGallery } from "@/components/exhibition-gallery";
import { UploadPanel } from "@/components/upload-panel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { readGalleryEntries } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await readGalleryEntries();
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
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(120deg,rgba(255,255,255,0.46),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.16),transparent_76%)]" />
      <div className="pointer-events-none absolute left-[-9%] top-[-7%] -z-10 h-72 w-72 rounded-full bg-amber-100/35 blur-[125px] sm:h-[23rem] sm:w-[23rem]" />
      <div className="pointer-events-none absolute bottom-[-14%] right-[-6%] -z-10 h-80 w-80 rounded-full bg-sky-100/35 blur-[130px] sm:h-[27rem] sm:w-[27rem]" />

      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.14fr)_minmax(22rem,0.86fr)]">
          <div className="flex h-full flex-col rounded-[1.7rem] border border-black/7 bg-white/84 p-6 shadow-[0_34px_110px_-70px_rgba(24,34,43,0.34)] backdrop-blur-xl sm:p-8 lg:p-9">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border-0 bg-primary/8 px-3.5 py-1 text-[11px] font-medium tracking-[0.22em] text-primary uppercase">
                Exhibition Archive
              </Badge>
              <p className="text-xs text-zinc-500">
                上传后自动归档，首页按时间排序展示。
              </p>
            </div>

            <div className="mt-10 flex flex-1 flex-col justify-between gap-8">
              <div className="space-y-5">
                <h1 className="max-w-3xl text-[2.4rem] leading-[1.04] font-semibold tracking-[-0.055em] text-zinc-950 sm:text-[3.1rem] lg:text-[4rem]">
                  展览照片上传与归档
                </h1>
                <p className="max-w-2xl text-[15px] leading-7 text-zinc-600 sm:text-base">
                  统一收集每次展览的现场照片与基本信息，保持首页归档清晰、节奏安静，便于后续检索、复盘和回看现场记录。
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] tracking-[0.18em] text-zinc-500 uppercase">
                  <span>Overview</span>
                  <span>Latest First</span>
                </div>
                <div className="grid gap-px overflow-hidden rounded-[1.3rem] border border-black/8 bg-black/[0.045] sm:grid-cols-3">
                  {stats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className={cn(
                        "bg-white/76 px-4 py-4 backdrop-blur-sm sm:px-5",
                        index === 2 ? "col-span-2 sm:col-span-1" : "",
                      )}
                    >
                      <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[1.7rem]">
                        {stat.value}
                      </p>
                    </div>
                  ))}
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

import Image from "next/image";

import { ExhibitionGallery } from "@/components/exhibition-gallery";
import { UploadPanel } from "@/components/upload-panel";
import { formatDateTimeLabel } from "@/lib/formatters";
import { readGalleryEntries } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await readGalleryEntries();
  const latestEntry = entries[0];
  const latestImage = latestEntry?.images[0];
  const photoCount = entries.reduce((total, entry) => total + entry.images.length, 0);
  const summaryItems = [
    { label: "照片组", value: entries.length },
    { label: "照片数", value: photoCount },
    {
      label: "最近保存",
      value: latestEntry ? formatDateTimeLabel(latestEntry.createdAt) : "还没有内容",
    },
  ];

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:gap-8 lg:px-8 lg:py-8">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_24rem]">
          <div className="rounded-[2.8rem] bg-white p-4 shadow-[0_26px_120px_-60px_rgba(15,23,42,0.28)] ring-1 ring-black/5 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.85fr)]">
              <div className="flex min-h-[22rem] flex-col justify-between rounded-[2.2rem] bg-[linear-gradient(180deg,#fbfbfd_0%,#f4f4f6_100%)] px-6 py-7 sm:px-8 sm:py-8 lg:min-h-[39rem]">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase shadow-sm ring-1 ring-black/5">
                      Personal Photo Wall
                    </span>
                    <span className="text-[11px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">
                      Latest First
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h1 className="max-w-3xl text-[2.7rem] leading-[0.94] font-semibold tracking-[-0.07em] text-zinc-950 sm:text-[4rem] lg:text-[5.35rem]">
                      把日常照片，
                      <br />
                      留在一面只属于自己的墙上。
                    </h1>
                    <p className="max-w-xl text-[15px] leading-7 text-zinc-500 sm:text-base">
                      不公开，不喧哗。只是把每次舍不得删掉的照片，安静地放回一处会反复回看的地方。
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {summaryItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[1.35rem] bg-white px-4 py-4 shadow-sm ring-1 ring-black/5"
                      >
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                          {item.label}
                        </p>
                        <p className="mt-2 text-base font-semibold tracking-tight text-zinc-950 sm:text-lg">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.45rem] bg-white px-4 py-4 shadow-sm ring-1 ring-black/5">
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                      最近一组
                    </p>
                    <p className="mt-2 text-base font-semibold tracking-tight text-zinc-950">
                      {latestEntry ? `${latestEntry.images.length} 张照片` : "等你放上第一组照片"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[22rem] overflow-hidden rounded-[2.2rem] bg-zinc-100 lg:min-h-[39rem]">
                {latestImage ? (
                  <>
                    <Image
                      src={latestImage.src}
                      alt={latestImage.alt}
                      fill
                      priority
                      sizes="(min-width: 1280px) 42vw, (min-width: 1024px) 46vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <div className="absolute left-5 top-5 rounded-full bg-white/84 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-zinc-900 uppercase backdrop-blur-md">
                      最近保存
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="inline-flex flex-col rounded-[1.35rem] bg-black/35 px-4 py-3 text-white backdrop-blur-md">
                        <span className="text-[11px] font-semibold tracking-[0.18em] text-white/78 uppercase">
                          Latest Memory
                        </span>
                        <span className="mt-1 text-lg font-semibold tracking-tight">
                          {formatDateTimeLabel(latestEntry.createdAt)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[22rem] flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(228,228,231,0.9))] px-8 text-center lg:min-h-[39rem]">
                    <div className="rounded-full bg-white px-4 py-1 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase shadow-sm ring-1 ring-black/5">
                      Empty Wall
                    </div>
                    <p className="mt-6 max-w-sm text-2xl font-semibold tracking-tight text-zinc-950">
                      还没有照片，但位置已经留好了。
                    </p>
                    <p className="mt-3 max-w-sm text-sm leading-7 text-zinc-500">
                      从右侧拖进第一组照片开始，这里会变成你的首页主视觉。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <UploadPanel />
        </section>

        <ExhibitionGallery entries={entries} />
      </main>
    </div>
  );
}

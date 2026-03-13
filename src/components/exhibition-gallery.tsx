import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { GalleryEntryActions } from "@/components/gallery-entry-actions";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTimeLabel } from "@/lib/formatters";
import type { GalleryEntry } from "@/lib/gallery";

type ExhibitionGalleryProps = {
  entries: GalleryEntry[];
};

export function ExhibitionGallery({ entries }: ExhibitionGalleryProps) {
  const photoCount = entries.reduce((total, entry) => total + entry.images.length, 0);
  const latestEntry = entries[0];
  const summaryItems = [
    { label: "照片组", value: entries.length },
    { label: "照片数", value: photoCount },
    {
      label: "最近保存",
      value: latestEntry ? formatDateTimeLabel(latestEntry.createdAt) : "还没有记录",
    },
  ];

  return (
    <section className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-5 rounded-[2.4rem] bg-white px-6 py-7 shadow-[0_18px_70px_-42px_rgba(15,23,42,0.22)] ring-1 ring-black/5 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-zinc-500 uppercase">
            Recent Memories
          </p>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
              最近留下的照片
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-zinc-500 sm:text-[15px]">
              按保存时间倒序排开。默认只看照片本身，需要整理时再打开管理面板。
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:w-[34rem]">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.35rem] bg-zinc-50 px-4 py-4 ring-1 ring-black/5"
            >
              <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                {item.label}
              </p>
              <p className="mt-2 text-base font-semibold tracking-tight text-zinc-950 sm:text-lg">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {!entries.length ? (
        <Card className="rounded-[2.4rem] border border-dashed border-black/8 bg-white/82 py-16 shadow-none backdrop-blur-md">
          <CardContent className="flex flex-col items-center gap-5 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              <ImageIcon className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight text-zinc-950">
                还没有照片
              </h3>
              <p className="max-w-md text-sm leading-7 text-zinc-500">
                从上方拖进第一组照片开始，这里会慢慢长成一面只属于你的日常照片墙。
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {entries.map((entry) => {
            const heroImage = entry.images[0];
            const supportingImages = entry.images.slice(1, 5);
            const remainingCount = Math.max(entry.images.length - supportingImages.length - 1, 0);

            return (
              <article
                key={entry.id}
                className="group rounded-[2.6rem] bg-white p-3 shadow-[0_22px_90px_-52px_rgba(15,23,42,0.28)] ring-1 ring-black/5 sm:p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.75fr)]">
                  <div className="relative min-h-[25rem] overflow-hidden rounded-[2rem] bg-zinc-100 sm:min-h-[34rem]">
                    <Image
                      src={heroImage.src}
                      alt={heroImage.alt}
                      fill
                      sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 60vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/8 to-transparent" />

                    <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 sm:left-5 sm:top-5">
                      <span className="rounded-full bg-white/84 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-zinc-900 uppercase backdrop-blur">
                        {formatDateTimeLabel(entry.createdAt)}
                      </span>
                      <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-white uppercase backdrop-blur">
                        {entry.images.length} Photos
                      </span>
                    </div>

                    <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
                      <GalleryEntryActions entry={entry} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {supportingImages.length ? (
                      <>
                        {supportingImages.map((image, imageIndex) => {
                          const isLastVisible =
                            imageIndex === supportingImages.length - 1 && remainingCount > 0;

                          return (
                            <div
                              key={image.id}
                              className="relative min-h-[11rem] overflow-hidden rounded-[1.6rem] bg-zinc-100 sm:min-h-[13rem] lg:min-h-[15rem]"
                            >
                              <Image
                                src={image.src}
                                alt={image.alt}
                                fill
                                sizes="(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 100vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                              />

                              {isLastVisible ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/38 text-2xl font-semibold tracking-tight text-white backdrop-blur-[1px]">
                                  +{remainingCount}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-[1.8rem] bg-zinc-50 px-6 text-center ring-1 ring-black/5">
                        <p className="text-sm font-medium text-zinc-900">这组只有 1 张主图</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                          需要补照片或调整封面时，直接点右上角的管理。
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

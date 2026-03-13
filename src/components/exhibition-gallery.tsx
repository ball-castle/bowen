import Image from "next/image";
import { Clock3, ImageIcon, Images, LayoutPanelTop, type LucideIcon } from "lucide-react";

import { GalleryEntryActions } from "@/components/gallery-entry-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTimeLabel } from "@/lib/formatters";
import type { GalleryEntry } from "@/lib/gallery";

type ExhibitionGalleryProps = {
  entries: GalleryEntry[];
};

type SummaryItem = {
  label: string;
  value: number | string;
  note: string;
  icon: LucideIcon;
};

function SummaryCard({ item }: { item: SummaryItem }) {
  const Icon = item.icon;

  return (
    <div className="rounded-[1.7rem] border border-white/70 bg-white/84 p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
            {item.label}
          </p>
          <p className="text-base font-semibold tracking-tight text-zinc-950 sm:text-lg">
            {item.value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white shadow-sm">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-4 text-xs leading-6 text-zinc-500">{item.note}</p>
    </div>
  );
}

export function ExhibitionGallery({ entries }: ExhibitionGalleryProps) {
  const photoCount = entries.reduce((total, entry) => total + entry.images.length, 0);
  const latestEntry = entries[0];
  const summaryItems: SummaryItem[] = [
    {
      label: "照片组",
      value: entries.length,
      note: "每次保存就是一组，便于按时间回看和管理。",
      icon: LayoutPanelTop,
    },
    {
      label: "照片数",
      value: photoCount,
      note: "所有照片会按每组顺序展示，第一张默认作为封面。",
      icon: Images,
    },
    {
      label: "最近保存",
      value: latestEntry ? formatDateTimeLabel(latestEntry.createdAt) : "还没有记录",
      note: "最新的一组会始终停留在最前面。",
      icon: Clock3,
    },
  ];

  return (
    <section className="space-y-6 sm:space-y-8">
      <Card className="overflow-hidden rounded-[2.7rem] border-white/80 bg-white/76 py-0 shadow-[0_28px_110px_-62px_rgba(15,23,42,0.3)]">
        <CardContent className="px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="h-8 rounded-full bg-white px-4 text-[11px] tracking-[0.2em] text-zinc-700 uppercase shadow-sm"
                  >
                    Recent Memories
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-8 rounded-full border-black/8 bg-white/60 px-4 text-[11px] tracking-[0.2em] text-zinc-500 uppercase"
                  >
                    Latest First
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-[2.8rem]">
                    最近留下的照片
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-zinc-500 sm:text-[15px]">
                    按保存时间倒序排开。默认只看照片本身，需要整理时再打开管理面板。
                  </p>
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-white/70 bg-white/82 px-5 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)] lg:max-w-[20rem]">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                  浏览方式
                </p>
                <p className="mt-2 text-base font-semibold tracking-tight text-zinc-950">
                  先看主图，再顺着附图继续往下翻。
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {summaryItems.map((item) => (
                <SummaryCard key={item.label} item={item} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {!entries.length ? (
        <Card className="rounded-[2.6rem] border border-dashed border-black/8 bg-white/82 py-16 shadow-none backdrop-blur-md">
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
                className="group overflow-hidden rounded-[2.8rem] border border-white/80 bg-white/78 p-3 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.3)] transition-all duration-300 hover:shadow-[0_36px_120px_-62px_rgba(15,23,42,0.34)]"
              >
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.12fr)_22rem]">
                  <div className="relative min-h-[24rem] overflow-hidden rounded-[2.2rem] bg-zinc-100 sm:min-h-[36rem]">
                    <Image
                      src={heroImage.src}
                      alt={heroImage.alt}
                      fill
                      sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 60vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/14 to-transparent" />

                    <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 sm:left-5 sm:top-5">
                      <Badge className="h-8 rounded-full bg-white/88 px-4 text-[11px] tracking-[0.16em] text-zinc-900 uppercase backdrop-blur-md">
                        {formatDateTimeLabel(entry.createdAt)}
                      </Badge>
                      <Badge className="h-8 rounded-full bg-black/34 px-4 text-[11px] tracking-[0.16em] text-white uppercase backdrop-blur-md">
                        {entry.images.length} Photos
                      </Badge>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <div className="inline-flex max-w-full flex-col rounded-[1.6rem] border border-white/15 bg-black/28 px-4 py-3 text-white shadow-lg backdrop-blur-md sm:px-5 sm:py-4">
                        <span className="text-[11px] font-semibold tracking-[0.18em] text-white/75 uppercase">
                          Photo Set
                        </span>
                        <span className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                          这一组共有 {entry.images.length} 张照片
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="rounded-[1.9rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,246,248,0.84))] p-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.22)]">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                              Quick Manage
                            </p>
                            <p className="text-xl font-semibold tracking-tight text-zinc-950">
                              直接整理这一组
                            </p>
                          </div>

                          <GalleryEntryActions
                            entry={entry}
                            buttonClassName="rounded-full border-black/10 bg-white/90 px-4 shadow-sm hover:bg-white"
                          />
                        </div>

                        <p className="text-sm leading-6 text-zinc-500">
                          第一张会作为封面展示。需要补图、重排顺序或删除整组时，直接从这里进入管理。
                        </p>

                        <Separator />

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                          <div className="rounded-[1.3rem] border border-black/6 bg-white/86 px-4 py-3">
                            <p className="text-xs text-zinc-500">封面规则</p>
                            <p className="mt-1 text-sm font-semibold text-zinc-950">
                              第一张图片
                            </p>
                          </div>
                          <div className="rounded-[1.3rem] border border-black/6 bg-white/86 px-4 py-3">
                            <p className="text-xs text-zinc-500">当前照片</p>
                            <p className="mt-1 text-sm font-semibold text-zinc-950">
                              {entry.images.length} 张
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {supportingImages.length ? (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        {supportingImages.map((image, imageIndex) => {
                          const isLastVisible =
                            imageIndex === supportingImages.length - 1 && remainingCount > 0;

                          return (
                            <div
                              key={image.id}
                              className="group/image relative min-h-[12rem] overflow-hidden rounded-[1.7rem] border border-black/6 bg-zinc-100 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.22)] sm:min-h-[13rem] xl:min-h-[15rem]"
                            >
                              <Image
                                src={image.src}
                                alt={image.alt}
                                fill
                                sizes="(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 100vw"
                                className="object-cover transition-transform duration-700 group-hover/image:scale-[1.04]"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                              {isLastVisible ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/42 text-2xl font-semibold tracking-tight text-white backdrop-blur-[1px]">
                                  +{remainingCount}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-black/8 bg-zinc-50 px-6 text-center">
                        <p className="text-sm font-medium text-zinc-900">这组只有 1 张主图</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                          需要补照片或调整封面时，直接点上方的管理。
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

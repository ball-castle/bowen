import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatBytes, formatDateLabel, formatDateTimeLabel } from "@/lib/formatters";
import type { GalleryEntry } from "@/lib/gallery";

type ExhibitionGalleryProps = {
  entries: GalleryEntry[];
};

export function ExhibitionGallery({ entries }: ExhibitionGalleryProps) {
  const photoCount = entries.reduce((total, entry) => total + entry.images.length, 0);
  const venueCount = new Set(entries.map((entry) => entry.venue.trim()).filter(Boolean)).size;
  const summaryItems = [
    { label: "批次", value: entries.length },
    { label: "照片", value: photoCount },
    { label: "场馆", value: venueCount },
  ];

  return (
    <section className="space-y-5">
      <div className="rounded-[1.8rem] border border-black/7 bg-white/78 px-6 py-6 shadow-[0_28px_90px_-72px_rgba(24,34,43,0.32)] backdrop-blur-xl sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] tracking-[0.24em] text-zinc-500 uppercase">
              Archive Wall
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <h2 className="font-[family:var(--font-display)] text-[2.15rem] leading-none font-semibold tracking-[-0.05em] text-zinc-950 sm:text-[2.55rem]">
                展览图片墙
              </h2>
              <span className="pb-1 text-xs text-zinc-500">
                共 {entries.length} 个批次
              </span>
            </div>
            <p className="max-w-xl text-[13px] leading-6 text-zinc-500">
              按上传时间倒序排列，把每次展览的图像与说明整理成一页完整记录。
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-[1.15rem] border border-black/8 bg-black/[0.045] sm:grid-cols-3 lg:w-[20rem]">
            {summaryItems.map((item) => (
              <div key={item.label} className="bg-white/76 px-4 py-3">
                <p className="text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-zinc-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!entries.length ? (
        <Card className="rounded-[1.8rem] border border-dashed border-black/10 bg-white/72 py-10 backdrop-blur">
          <CardContent className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/8 text-primary">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-zinc-950">
                还没有上传记录
              </h3>
              <p className="max-w-md text-sm leading-7 text-zinc-600">
                上传第一组照片后，这里会显示归档内容。
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {entries.map((entry) => {
            const heroImage = entry.images[0];
            const secondaryImages = entry.images.slice(1, 4);
            const remainingCount = Math.max(entry.images.length - 4, 0);

            return (
              <Card
                key={entry.id}
                className="rounded-[1.85rem] border border-black/7 bg-white/80 py-0 shadow-[0_30px_96px_-68px_rgba(24,34,43,0.34)] backdrop-blur-xl"
              >
                <CardContent className="p-0">
                  <div className="grid gap-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,1fr)]">
                    <div className="p-4 sm:p-5 lg:p-6">
                      <div className="space-y-3">
                        <div className="group relative overflow-hidden rounded-[1.5rem] border border-black/8 bg-zinc-100">
                          <div className="relative aspect-[16/10]">
                            <Image
                              src={heroImage.src}
                              alt={heroImage.alt}
                              fill
                              sizes="(min-width: 1280px) 48vw, (min-width: 1024px) 54vw, 100vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            />
                          </div>

                          <div className="absolute left-4 top-4">
                            <Badge className="rounded-full border-0 bg-black/58 px-3 py-1 text-[11px] tracking-[0.16em] text-white backdrop-blur-sm uppercase">
                              {entry.images.length} 张图片
                            </Badge>
                          </div>

                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/62 via-black/12 to-transparent px-4 py-3.5 text-white">
                            <p className="truncate text-sm">{heroImage.filename}</p>
                            <span className="text-xs text-white/80">
                              {formatBytes(heroImage.size)}
                            </span>
                          </div>
                        </div>

                        {secondaryImages.length ? (
                          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                            {secondaryImages.map((image, imageIndex) => (
                              <div
                                key={image.id}
                                className="group relative overflow-hidden rounded-[1.1rem] border border-black/8 bg-zinc-100"
                              >
                                <div className="relative aspect-[4/3]">
                                  <Image
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    sizes="(min-width: 1024px) 16vw, 40vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                  />
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                                {remainingCount > 0 &&
                                imageIndex === secondaryImages.length - 1 ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-base font-semibold text-white backdrop-blur-[1.5px]">
                                    +{remainingCount}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex min-h-24 items-center justify-center rounded-[1.1rem] border border-dashed border-black/10 bg-zinc-50 text-sm text-zinc-500">
                            仅上传了 1 张主图
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col border-t border-black/6 px-5 py-5 sm:px-6 sm:py-6 lg:border-t-0 lg:border-l">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full border-0 bg-primary/8 px-3 py-1 text-[11px] tracking-[0.16em] text-primary uppercase">
                          {entry.exhibitionDate
                            ? formatDateLabel(entry.exhibitionDate)
                            : "展期待定"}
                        </Badge>
                        {entry.venue ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-black/8 bg-white/72 px-3 py-1 text-zinc-600"
                          >
                            {entry.venue}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-5">
                        <CardTitle className="font-[family:var(--font-display)] text-[2rem] leading-[1.02] font-semibold tracking-[-0.05em] text-zinc-950">
                          {entry.exhibitionName}
                        </CardTitle>
                      </div>

                      <div className="mt-5 grid gap-px overflow-hidden rounded-[1.1rem] border border-black/8 bg-black/[0.045] sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        <div className="bg-white/76 px-3.5 py-3">
                          <p className="text-[10px] tracking-[0.16em] text-zinc-500 uppercase">
                            上传时间
                          </p>
                          <p className="mt-1 text-sm leading-6 text-zinc-700">
                            {formatDateTimeLabel(entry.createdAt)}
                          </p>
                        </div>
                        <div className="bg-white/76 px-3.5 py-3">
                          <p className="text-[10px] tracking-[0.16em] text-zinc-500 uppercase">
                            图片数量
                          </p>
                          <p className="mt-1 text-sm leading-6 text-zinc-700">
                            {entry.images.length} 张
                          </p>
                        </div>
                        <div className="bg-white/76 px-3.5 py-3">
                          <p className="text-[10px] tracking-[0.16em] text-zinc-500 uppercase">
                            场馆位置
                          </p>
                          <p className="mt-1 text-sm leading-6 text-zinc-700">
                            {entry.venue || "未填写场馆"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-[1.2rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,245,240,0.8))] px-4 py-4">
                        <p className="text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
                          Curator Note
                        </p>
                        <p className="mt-3 text-[14px] leading-7 text-zinc-600">
                          {entry.curatorNote || "这组上传未填写展览说明，保留为纯图片归档。"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

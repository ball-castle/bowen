import Image from "next/image";
import { CalendarDays, Clock3, ImageIcon, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBytes, formatDateLabel, formatDateTimeLabel } from "@/lib/formatters";
import type { GalleryEntry } from "@/lib/gallery";

type ExhibitionGalleryProps = {
  entries: GalleryEntry[];
};

export function ExhibitionGallery({ entries }: ExhibitionGalleryProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.24em] text-zinc-500 uppercase">
            Gallery
          </p>
          <h2 className="text-3xl text-zinc-900 [font-family:var(--font-editorial)] sm:text-4xl">
            展览图片墙
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-zinc-600">
          最新上传排在最前面。
        </p>
      </div>

      {!entries.length ? (
        <Card className="rounded-[2rem] border border-dashed border-black/10 bg-white/65 py-10 backdrop-blur">
          <CardContent className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImageIcon className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl text-zinc-900 [font-family:var(--font-editorial)]">
                还没有上传记录
              </h3>
              <p className="max-w-md text-sm leading-7 text-zinc-600">
                上传第一组照片后，这里会显示归档内容。
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {entries.map((entry) => {
            const heroImage = entry.images[0];
            const secondaryImages = entry.images.slice(1, 4);
            const remainingCount = Math.max(entry.images.length - 4, 0);

            return (
              <Card
                key={entry.id}
                className="rounded-[2rem] border border-black/8 bg-white/78 py-0 shadow-[0_22px_80px_-50px_rgba(15,23,42,0.35)] backdrop-blur-xl"
              >
                <CardHeader className="gap-4 px-6 pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border-0 bg-primary/12 px-3 py-1 text-[11px] tracking-[0.18em] text-primary uppercase">
                      {entry.exhibitionDate
                        ? formatDateLabel(entry.exhibitionDate)
                        : "展期待定"}
                    </Badge>
                    {entry.venue ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-black/10 bg-white/70 px-3 py-1 text-zinc-700"
                      >
                        {entry.venue}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <CardTitle className="text-3xl leading-tight text-zinc-900 [font-family:var(--font-editorial)]">
                      {entry.exhibitionName}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap gap-4 text-sm text-zinc-500">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        {formatDateTimeLabel(entry.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {entry.images.length} 张照片
                      </span>
                      {entry.venue ? (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {entry.venue}
                        </span>
                      ) : null}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 px-6 pb-6">
                  {entry.curatorNote ? (
                    <p className="text-sm leading-7 text-zinc-600">
                      {entry.curatorNote}
                    </p>
                  ) : null}

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
                    <div className="group relative overflow-hidden rounded-[1.5rem] border border-black/8 bg-zinc-100">
                      <div className="relative aspect-[4/5]">
                        <Image
                          src={heroImage.src}
                          alt={heroImage.alt}
                          fill
                          sizes="(min-width: 1280px) 28vw, (min-width: 1024px) 38vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 py-4 text-white">
                        <p className="truncate text-sm">{heroImage.filename}</p>
                        <span className="text-xs text-white/80">
                          {formatBytes(heroImage.size)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                      {secondaryImages.map((image, index) => (
                        <div
                          key={image.id}
                          className="group relative overflow-hidden rounded-[1.35rem] border border-black/8 bg-zinc-100"
                        >
                          <div className="relative aspect-[4/3] lg:aspect-[4/2.6]">
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              sizes="(min-width: 1280px) 14vw, (min-width: 1024px) 18vw, 50vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                          {remainingCount > 0 && index === secondaryImages.length - 1 ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xl font-semibold text-white backdrop-blur-[2px]">
                              +{remainingCount}
                            </div>
                          ) : null}
                        </div>
                      ))}

                      {!secondaryImages.length ? (
                        <div className="flex min-h-40 items-center justify-center rounded-[1.35rem] border border-dashed border-black/10 bg-zinc-50 text-sm text-zinc-500">
                          仅上传了 1 张主图
                        </div>
                      ) : null}
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

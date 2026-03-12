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
  const summaryItems =[
    { label: "归档批次", value: entries.length },
    { label: "图片总数", value: photoCount },
    { label: "记录场馆", value: venueCount },
  ];

  return (
    <section className="space-y-8">
      {/* 顶部数据汇总卡片 */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/40 bg-card/60 px-6 py-8 shadow-2xl shadow-primary/5 backdrop-blur-2xl sm:px-10 sm:py-10">
        <div className="absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
        
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-bold tracking-[0.25em] text-primary/80 uppercase">
              Archive Wall
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <h2 className="font-[family:var(--font-display)] text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                展览图片墙
              </h2>
              <span className="mb-1 rounded-full bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                共 {entries.length} 个批次
              </span>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              按上传时间倒序排列，把每次展览的图像与说明整理成一页完整记录，留存视觉与空间的记忆。
            </p>
          </div>

          <div className="grid gap-2 rounded-2xl bg-muted/30 p-2 sm:grid-cols-3 lg:w-[24rem]">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex flex-col items-center justify-center rounded-xl bg-background/50 px-4 py-3 text-center shadow-sm transition-transform hover:-translate-y-0.5">
                <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                  {item.label}
                </p>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 空状态 */}
      {!entries.length ? (
        <Card className="rounded-[2rem] border-2 border-dashed border-border/50 bg-card/30 py-16 backdrop-blur-md">
          <CardContent className="flex flex-col items-center gap-5 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
              <ImageIcon className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                还没有上传记录
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                在上方完成第一组照片归档后，这里会立刻生成属于你的展览画廊。
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* 列表渲染 */
        <div className="space-y-8">
          {entries.map((entry) => {
            const heroImage = entry.images[0];
            const secondaryImages = entry.images.slice(1, 4);
            const remainingCount = Math.max(entry.images.length - 4, 0);

            return (
              <Card
                key={entry.id}
                className="group/card overflow-hidden rounded-[2rem] border border-border/40 bg-card/60 p-0 shadow-lg shadow-black/5 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-primary/5"
              >
                <CardContent className="p-0">
                  <div className="grid gap-0 lg:grid-cols-[1.5fr_minmax(20rem,1fr)]">
                    
                    {/* 左侧：图片排版区 */}
                    <div className="p-5 sm:p-6 lg:p-8">
                      <div className="space-y-3">
                        {/* 主图 Hero Image */}
                        <div className="group/hero relative overflow-hidden rounded-[1.25rem] border border-border/50 bg-muted/20">
                          <div className="relative aspect-[16/10]">
                            <Image
                              src={heroImage.src}
                              alt={heroImage.alt}
                              fill
                              sizes="(min-width: 1280px) 48vw, (min-width: 1024px) 54vw, 100vw"
                              className="object-cover transition-transform duration-700 group-hover/hero:scale-105"
                            />
                          </div>

                          {/* 悬浮标签（为了图片上的可见性，保持深色/毛玻璃背景） */}
                          <div className="absolute left-4 top-4">
                            <Badge className="rounded-full border-0 bg-black/40 px-3 py-1.5 text-[11px] font-semibold tracking-widest text-white backdrop-blur-md uppercase shadow-sm">
                              {entry.images.length} Photos
                            </Badge>
                          </div>

                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 py-4 text-white opacity-90 transition-opacity group-hover/hero:opacity-100">
                            <p className="truncate text-sm font-medium">{heroImage.filename}</p>
                            <span className="text-xs font-mono text-white/80">
                              {formatBytes(heroImage.size)}
                            </span>
                          </div>
                        </div>

                        {/* 副图 Secondary Images */}
                        {secondaryImages.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                            {secondaryImages.map((image, imageIndex) => (
                              <div
                                key={image.id}
                                className="group/sub relative overflow-hidden rounded-[1rem] border border-border/50 bg-muted/20"
                              >
                                <div className="relative aspect-[4/3]">
                                  <Image
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    sizes="(min-width: 1024px) 16vw, 40vw"
                                    className="object-cover transition-transform duration-700 group-hover/sub:scale-110"
                                  />
                                </div>

                                {remainingCount > 0 && imageIndex === secondaryImages.length - 1 && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xl font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/40 cursor-pointer">
                                    +{remainingCount}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex min-h-24 items-center justify-center rounded-[1rem] border border-dashed border-border/60 bg-muted/10 text-sm font-medium text-muted-foreground">
                            仅上传了 1 张主图
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 右侧：信息与描述区 */}
                    <div className="flex flex-col border-t border-border/40 bg-muted/5 px-6 py-6 lg:border-l lg:border-t-0 lg:px-8 lg:py-8">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-widest text-primary uppercase shadow-none">
                          {entry.exhibitionDate
                            ? formatDateLabel(entry.exhibitionDate)
                            : "展期待定"}
                        </Badge>
                        {entry.venue && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-border/60 bg-background/50 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-none"
                          >
                            {entry.venue}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-6">
                        <CardTitle className="font-[family:var(--font-display)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                          {entry.exhibitionName}
                        </CardTitle>
                      </div>

                      <div className="mt-8 grid gap-2 rounded-2xl bg-muted/30 p-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        <div className="flex flex-col justify-center rounded-xl bg-background/50 px-3.5 py-3 shadow-sm">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            上传时间
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {formatDateTimeLabel(entry.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col justify-center rounded-xl bg-background/50 px-3.5 py-3 shadow-sm">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            图片数量
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {entry.images.length} 张
                          </p>
                        </div>
                        <div className="flex flex-col justify-center rounded-xl bg-background/50 px-3.5 py-3 shadow-sm">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            场馆位置
                          </p>
                          <p className="mt-1 truncate text-sm font-medium text-foreground">
                            {entry.venue || "未填写"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex-1 rounded-2xl border border-border/50 bg-gradient-to-br from-background/80 to-muted/20 px-5 py-5 shadow-inner">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-primary/80 uppercase">
                          Curator Note
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
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
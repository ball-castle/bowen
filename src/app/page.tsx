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
  const stats =[
    { label: "上传批次", value: entries.length },
    { label: "照片总数", value: photoCount },
    { label: "涉及场馆", value: venueCount },
  ];

  return (
    <div className="relative isolate min-h-screen overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* 
        背景氛围光晕 (Ambient Glows)
        使用主题变量替代固定颜色，在亮暗模式下都能呈现出完美的色彩融合 
      */}
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] -z-10 h-[40rem] w-[40rem] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] -z-10 h-[35rem] w-[35rem] rounded-full bg-chart-1/10 blur-[120px]" />
      <div className="pointer-events-none absolute left-[30%] top-[20%] -z-10 h-[25rem] w-[25rem] rounded-full bg-chart-2/10 blur-[100px]" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="grid items-start gap-8 xl:grid-cols-[1.2fr_minmax(24rem,28rem)] xl:gap-12">
          
          {/* 左侧主内容卡片 */}
          <div className="animate-in fade-in slide-in-from-bottom-6 rounded-[2.5rem] border border-border/40 bg-card/60 p-6 shadow-2xl shadow-primary/5 backdrop-blur-2xl duration-700 sm:p-10 lg:p-12">
            
            {/* 顶部标签行 */}
            <div className="flex flex-wrap items-center gap-4">
              <Badge className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-primary uppercase shadow-none transition-colors hover:bg-primary/20">
                Exhibition Archive
              </Badge>
              <div className="flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                {/* 呼吸灯效果的点 */}
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                Latest First
              </div>
            </div>

            {/* 标题区域 */}
            <div className="mt-12 space-y-6 sm:mt-16">
              <h1 className="max-w-4xl bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text font-[family:var(--font-display)] text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-[5.5rem] lg:leading-[1.1]">
                展览照片上传与归档
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                把每次展览的照片和基本信息整理成一组完整批次，让上传与浏览都保持清楚、安静、可回看。
              </p>
            </div>

            {/* 统计数据区域 (Stats) */}
            <div className="mt-16 space-y-5 sm:mt-20">
              <div className="flex items-center justify-between px-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                <span>Overview Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 p-5 transition-all hover:bg-background/80 hover:shadow-sm hover:-translate-y-0.5 sm:p-6",
                      index === 2 ? "col-span-2 sm:col-span-1" : "",
                    )}
                  >
                    {/* Hover时的渐变高光 */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 最近更新区域 */}
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border/50 bg-gradient-to-br from-muted/40 to-muted/10 p-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:p-6 transition-colors hover:border-border/80">
              <div className="space-y-1.5">
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  最近更新
                </p>
                <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {latestEntry ? latestEntry.exhibitionName : "等待第一组上传"}
                </p>
              </div>
              <div className="flex flex-col space-y-1 text-sm text-muted-foreground sm:items-end">
                <p className="font-medium text-foreground/80">
                  {latestEntry
                    ? formatDateTimeLabel(latestEntry.createdAt)
                    : "上传完成后会立即出现在这里"}
                </p>
                <p>{latestEntry?.venue?.trim() || "按批次倒序排列展示"}</p>
              </div>
            </div>
          </div>

          {/* 右侧上传面板 */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <UploadPanel />
          </div>
        </section>

        {/* 底部画廊区域 */}
        <section className="animate-in fade-in slide-in-from-bottom-10 mt-4 duration-1000 sm:mt-8">
          <ExhibitionGallery entries={entries} />
        </section>
      </main>
    </div>
  );
}
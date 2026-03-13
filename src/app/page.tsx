import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { ExhibitionGallery } from "@/components/exhibition-gallery";
import { UploadPanel } from "@/components/upload-panel";
import { formatDateTimeLabel } from "@/lib/formatters";
import { readGalleryEntries } from "@/lib/gallery";

export const dynamic = "force-dynamic";

// 极简数据块：放弃卡片，采用杂志风格的排版
function StatBlock({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="flex flex-col gap-3 border-l border-zinc-200 pl-5 dark:border-zinc-800">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="text-3xl font-light tracking-tighter text-foreground sm:text-4xl">
          {value}
        </p>
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground/80">
        {note}
      </p>
    </div>
  );
}

export default async function Home() {
  const entries = await readGalleryEntries();
  const latestEntry = entries[0];
  const latestImage = latestEntry?.images[0];
  const photoCount = entries.reduce((total, entry) => total + entry.images.length, 0);

  return (
    <div className="relative min-h-screen selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 md:py-12 lg:px-10">
        
        {/* 顶部主视觉区 */}
        <section className="grid items-start gap-8 xl:grid-cols-[1fr_24rem] xl:gap-10">
          
          {/* 左侧：画廊主展板 (The Editorial Canvas) */}
          <div className="relative flex min-h-[600px] flex-col overflow-hidden rounded-[2.5rem] bg-zinc-50/50 shadow-sm ring-1 ring-zinc-200/50 dark:bg-zinc-900/20 dark:ring-zinc-800/50 lg:min-h-[700px] lg:flex-row lg:p-3">
            
            {/* 展板左侧：文字与数据 */}
            <div className="flex flex-col justify-between p-8 sm:p-12 lg:w-[45%] lg:p-14">
              <div className="space-y-10">
                {/* 顶栏元信息 */}
                <div className="flex items-center gap-4 border-b border-zinc-200/60 pb-6 dark:border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-950 dark:bg-zinc-50" />
                    <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-foreground uppercase">
                      Archive Vol.1
                    </span>
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground">
                    // PRIVATE SPACE
                  </span>
                </div>

                {/* 主标题：打破常规的大留白与字重对比 */}
                <div className="space-y-6">
                  <h1 className="text-[2.5rem] font-medium leading-[1.15] tracking-tight text-foreground sm:text-[3rem] lg:text-[3.5rem]">
                    把日常照片，<br />
                    <span className="text-muted-foreground">留在一面只属于自己的墙上。</span>
                  </h1>
                  <p className="max-w-md text-base leading-[1.8] text-muted-foreground/90">
                    不公开，不喧哗。只是把每次舍不得删掉的照片，安静地放回一处会反复回看的地方，任由它们堆叠成时间的纹理。
                  </p>
                </div>
              </div>

              {/* 数据统计区：采用细线和留白分隔 */}
              <div className="mt-16 space-y-12">
                <div className="grid grid-cols-2 gap-8 sm:gap-12">
                  <StatBlock 
                    label="Galleries" 
                    value={String(entries.length).padStart(2, '0')} 
                    note="组相册" 
                  />
                  <StatBlock 
                    label="Total Photos" 
                    value={String(photoCount).padStart(2, '0')} 
                    note="张照片" 
                  />
                </div>

                {/* 状态栏：极简的胶囊按钮设计 */}
                <div className="inline-flex w-full items-center justify-between rounded-full bg-zinc-100 py-3 pl-4 pr-3 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono text-[11px] font-medium tracking-[0.15em] text-foreground uppercase">
                      {latestEntry ? `Latest: ${latestEntry.images.length} Photos` : "Waiting for upload"}
                    </span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200/50 text-muted-foreground transition-colors hover:bg-zinc-200 hover:text-foreground dark:bg-zinc-800 dark:hover:bg-zinc-700">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* 展板右侧：带“相框感”的巨大主视觉 */}
            <div className="relative min-h-[400px] w-full flex-1 overflow-hidden lg:min-h-full lg:rounded-[1.8rem]">
              {latestImage ? (
                <div className="group relative h-full w-full">
                  <Image
                    src={latestImage.src}
                    alt={latestImage.alt}
                    fill
                    priority
                    className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                  {/* 高级暗角遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10 transition-opacity duration-700 group-hover:opacity-80" />
                  
                  {/* 图片上的信息标签 */}
                  <div className="absolute bottom-0 left-0 flex w-full flex-col justify-end p-8 sm:p-12">
                    <div className="translate-y-4 opacity-0 transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-white/70 uppercase">
                        Capture Date
                      </p>
                      <p className="mt-2 text-2xl font-medium tracking-tight text-white sm:text-3xl">
                        {formatDateTimeLabel(latestEntry.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-100/50 p-12 text-center dark:bg-zinc-900/50">
                  <div className="mb-4 h-px w-12 bg-zinc-300 dark:bg-zinc-700" />
                  <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                    Blank Canvas
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 右侧边栏：上传面板保持自然独立 */}
          <div className="sticky top-12 shrink-0">
             <UploadPanel />
          </div>
        </section>

        {/* 底部画廊 */}
        <section className="mt-16 sm:mt-24">
          <ExhibitionGallery entries={entries} />
        </section>
      </main>
    </div>
  );
}
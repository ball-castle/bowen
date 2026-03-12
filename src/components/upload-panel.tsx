"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoaderCircle, Sparkles, Trash2, Upload, FileImage } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_FILE_COUNT = 12;
const UPLOAD_STEPS =[
  { label: "填写信息", value: "展览 / 场馆" },
  { label: "选择图片", value: "最多 12 张" },
  { label: "提交归档", value: "首页刷新" },
];

type PreviewImage = {
  id: string;
  file: File;
  previewUrl: string;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function UploadPanel() {
  const router = useRouter();
  const previewsRef = useRef<PreviewImage[]>([]);

  const[exhibitionName, setExhibitionName] = useState("");
  const [venue, setVenue] = useState("");
  const[exhibitionDate, setExhibitionDate] = useState("");
  const [curatorNote, setCuratorNote] = useState("");
  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const[isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "error" | "success";
    message: string;
  }>({ type: "idle", message: "" });

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      for (const preview of previewsRef.current) {
        URL.revokeObjectURL(preview.previewUrl);
      }
    };
  },[]);

  function appendFiles(fileList: File[]) {
    const imageFiles = fileList.filter((file) => file.type.startsWith("image/"));

    if (!imageFiles.length) {
      setStatus({
        type: "error",
        message: "请拖入或选择图片文件。",
      });
      return;
    }

    if (imageFiles.length !== fileList.length) {
      setStatus({
        type: "error",
        message: "已自动忽略非图片文件。",
      });
    } else {
      setStatus({ type: "idle", message: "" });
    }

    setPreviews((current) => {
      const availableSlots = Math.max(MAX_FILE_COUNT - current.length, 0);
      const acceptedFiles = imageFiles.slice(0, availableSlots);

      if (!acceptedFiles.length) {
        setStatus({
          type: "error",
          message: `最多只能保留 ${MAX_FILE_COUNT} 张待上传图片。`,
        });
        return current;
      }

      if (acceptedFiles.length < imageFiles.length) {
        setStatus({
          type: "error",
          message: `最多只能保留 ${MAX_FILE_COUNT} 张待上传图片。`,
        });
      }

      return[
        ...current,
        ...acceptedFiles.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ];
    });
  }

  function removePreview(id: string) {
    setPreviews((current) => {
      const target = current.find((preview) => preview.id === id);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((preview) => preview.id !== id);
    });
  }

  function resetForm() {
    for (const preview of previewsRef.current) {
      URL.revokeObjectURL(preview.previewUrl);
    }

    previewsRef.current =[];
    setExhibitionName("");
    setVenue("");
    setExhibitionDate("");
    setCuratorNote("");
    setPreviews([]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!exhibitionName.trim()) {
      setStatus({ type: "error", message: "请填写展览名称。" });
      return;
    }

    if (!previews.length) {
      setStatus({ type: "error", message: "请至少选择一张图片。" });
      return;
    }

    const formData = new FormData();
    formData.append("exhibitionName", exhibitionName.trim());
    formData.append("venue", venue.trim());
    formData.append("exhibitionDate", exhibitionDate);
    formData.append("curatorNote", curatorNote.trim());

    for (const preview of previews) {
      formData.append("files", preview.file);
    }

    setIsUploading(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "上传失败，请稍后再试。");
      }

      resetForm();
      setStatus({ type: "success", message: "上传成功，图片墙已更新。" });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "上传失败，请稍后再试。",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="h-full rounded-[2.5rem] border border-border/40 bg-card/60 py-0 shadow-2xl shadow-primary/5 backdrop-blur-2xl xl:sticky xl:top-8">
      <CardHeader className="gap-5 px-6 pt-8 sm:px-8 sm:pt-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-primary/80 uppercase">
              Upload Batch
            </p>
            <CardTitle className="mt-2 font-[family:var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              新建上传批次
            </CardTitle>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          先整理一组展览资料，再统一上传照片。系统会自动完成排版与归档。
        </CardDescription>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/30 p-2">
          {UPLOAD_STEPS.map((step) => (
            <div key={step.label} className="flex flex-col items-center justify-center rounded-xl bg-background/50 py-2.5 text-center shadow-sm">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {step.label}
              </p>
              <p className="mt-1 text-xs font-medium text-foreground">{step.value}</p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-8 sm:px-8 sm:pb-10">
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Step 1: 基础信息 */}
          <section className="space-y-5 rounded-[1.5rem] border border-border/50 bg-muted/10 p-5 transition-colors hover:bg-muted/20">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                  Step 01
                </p>
                <p className="text-base font-semibold tracking-tight text-foreground">
                  基础信息
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="exhibition-name" className="text-xs font-medium text-foreground/80">
                  展览名称 <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="exhibition-name"
                  placeholder="例如：光的边界"
                  value={exhibitionName}
                  onChange={(event) => setExhibitionName(event.target.value)}
                  className="h-11 rounded-xl border-border/50 bg-background/50 px-4 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="venue" className="text-xs font-medium text-foreground/80">
                  场馆 / 空间
                </label>
                <Input
                  id="venue"
                  placeholder="例如：一层主展厅"
                  value={venue}
                  onChange={(event) => setVenue(event.target.value)}
                  className="h-11 rounded-xl border-border/50 bg-background/50 px-4 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="exhibition-date" className="text-xs font-medium text-foreground/80">
                  展览日期
                </label>
                <Input
                  id="exhibition-date"
                  type="date"
                  value={exhibitionDate}
                  onChange={(event) => setExhibitionDate(event.target.value)}
                  className="h-11 rounded-xl border-border/50 bg-background/50 px-4 text-foreground transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="curator-note" className="text-xs font-medium text-foreground/80">
                  展览说明
                </label>
                <Textarea
                  id="curator-note"
                  placeholder="写一点布展、策展或拍摄说明..."
                  value={curatorNote}
                  onChange={(event) => setCuratorNote(event.target.value)}
                  className="min-h-[2.75rem] resize-none rounded-xl border-border/50 bg-background/50 px-4 py-3 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </section>

          {/* Step 2: 图片上传 */}
          <section className="space-y-5 rounded-[1.5rem] border border-border/50 bg-muted/10 p-5 transition-colors hover:bg-muted/20">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                  Step 02
                </p>
                <p className="text-base font-semibold tracking-tight text-foreground">
                  图片归档
                </p>
              </div>
              <span className="rounded-full border border-border bg-background/50 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                {previews.length} / {MAX_FILE_COUNT} 张
              </span>
            </div>

            <label
              htmlFor="file-upload"
              className={cn(
                "group relative block cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-all duration-200",
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-muted/30",
              )}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                appendFiles(Array.from(event.dataTransfer.files));
              }}
            >
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                className="hidden"
                onChange={(event) => {
                  appendFiles(Array.from(event.target.files ??[]));
                  event.target.value = "";
                }}
              />

              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background border border-border shadow-sm transition-transform group-hover:-translate-y-1 group-hover:shadow-md">
                  <FileImage className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    点击选择或将照片拖拽至此
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持 JPG, PNG, WEBP (单次最多12张)
                  </p>
                </div>
              </div>
            </label>

            {previews.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-medium text-muted-foreground">待上传队列</p>
                  <button
                    type="button"
                    className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
                    onClick={resetForm}
                  >
                    清空重置
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {previews.map((preview) => (
                    <div
                      key={preview.id}
                      className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/50 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] bg-muted/20">
                        <Image
                          src={preview.previewUrl}
                          alt={preview.file.name}
                          fill
                          unoptimized
                          sizes="(min-width: 640px) 20vw, 40vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* 悬浮删除按钮蒙版 */}
                        <div className="absolute inset-0 bg-background/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 flex items-center justify-center">
                          <button
                            type="button"
                            className="rounded-full bg-rose-500 p-2.5 text-white shadow-lg transition-transform hover:scale-110 hover:bg-rose-600"
                            onClick={() => removePreview(preview.id)}
                            aria-label={`移除 ${preview.file.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <p className="truncate text-xs font-medium text-foreground">
                          {preview.file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatBytes(preview.file.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 状态提示区 */}
          {status.type !== "idle" && (
            <div
              className={cn(
                "animate-in fade-in slide-in-from-top-2 rounded-xl px-4 py-3 text-sm font-medium",
                status.type === "success"
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
              )}
            >
              {status.message}
            </div>
          )}

          {/* 提交按钮 */}
          <Button
            type="submit"
            className="group h-12 w-full rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                正在加密上传中...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                确认归档并上传
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
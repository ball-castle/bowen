"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FileImage,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBytes } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const MAX_FILE_COUNT = 12;

type PreviewImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type StatusState = {
  type: "idle" | "error" | "success";
  message: string;
};

type RecentUpload = {
  id: string;
  imageCount: number;
};

type UploadResponse = {
  entry?: {
    id: string;
    images: Array<{ id: string }>;
  };
  error?: string;
};

const IDLE_STATUS: StatusState = { type: "idle", message: "" };

const featureItems = [
  { label: "选择", value: "最多 12 张", hint: "一次可多选上传" },
  { label: "去重", value: "重复自动忽略", hint: "同一张不会重复进队列" },
  { label: "撤销", value: "上传后可撤回", hint: "刚保存的内容支持立即撤销" },
];

function getFileSignature(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function UploadPanel() {
  const router = useRouter();
  const previewsRef = useRef<PreviewImage[]>([]);

  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [lastUploadedEntry, setLastUploadedEntry] = useState<RecentUpload | null>(
    null,
  );
  const [status, setStatus] = useState<StatusState>(IDLE_STATUS);

  const previewTotalSize = previews.reduce((total, preview) => {
    return total + preview.file.size;
  }, 0);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      for (const preview of previewsRef.current) {
        URL.revokeObjectURL(preview.previewUrl);
      }
    };
  }, []);

  function clearPreviews() {
    for (const preview of previewsRef.current) {
      URL.revokeObjectURL(preview.previewUrl);
    }

    previewsRef.current = [];
    setPreviews([]);
  }

  function appendFiles(fileList: File[]) {
    const imageFiles = fileList.filter((file) => file.type.startsWith("image/"));

    if (!imageFiles.length) {
      setStatus({ type: "error", message: "请拖入或选择图片文件。" });
      return;
    }

    setPreviews((current) => {
      const notices: string[] = [];
      const existingFiles = new Set(current.map((preview) => getFileSignature(preview.file)));
      const uniqueFiles: File[] = [];

      if (imageFiles.length !== fileList.length) {
        notices.push("已自动忽略非图片文件");
      }

      for (const file of imageFiles) {
        const signature = getFileSignature(file);

        if (existingFiles.has(signature)) {
          continue;
        }

        existingFiles.add(signature);
        uniqueFiles.push(file);
      }

      const duplicateCount = imageFiles.length - uniqueFiles.length;

      if (duplicateCount > 0) {
        notices.push(`已忽略 ${duplicateCount} 张重复照片`);
      }

      const availableSlots = Math.max(MAX_FILE_COUNT - current.length, 0);
      const acceptedFiles = uniqueFiles.slice(0, availableSlots);

      if (acceptedFiles.length < uniqueFiles.length) {
        notices.push(`最多只能保留 ${MAX_FILE_COUNT} 张待上传照片`);
      }

      if (!acceptedFiles.length) {
        setStatus({
          type: "error",
          message: notices.length ? `${notices.join("，")}。` : "没有可添加的照片。",
        });
        return current;
      }

      setStatus(
        notices.length
          ? {
              type: "error",
              message: `${notices.join("，")}。`,
            }
          : IDLE_STATUS,
      );

      return [
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

      const nextPreviews = current.filter((preview) => preview.id !== id);

      if (!nextPreviews.length) {
        setStatus(IDLE_STATUS);
      }

      return nextPreviews;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!previews.length) {
      setStatus({ type: "error", message: "请至少选择一张照片。" });
      return;
    }

    const formData = new FormData();

    for (const preview of previews) {
      formData.append("files", preview.file);
    }

    setIsUploading(true);
    setStatus(IDLE_STATUS);

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as UploadResponse;

      if (!response.ok || !payload.entry) {
        throw new Error(payload.error || "保存失败，请稍后再试。");
      }

      setLastUploadedEntry({
        id: payload.entry.id,
        imageCount: payload.entry.images.length,
      });
      clearPreviews();
      setStatus({
        type: "success",
        message: "已保存到照片墙，需要的话可以马上撤销这次上传。",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "保存失败，请稍后再试。",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUndoLastUpload() {
    if (!lastUploadedEntry) {
      return;
    }

    const confirmed = window.confirm(
      `确认撤销刚刚上传的这组照片吗？这会删除刚保存的 ${lastUploadedEntry.imageCount} 张照片。`,
    );

    if (!confirmed) {
      return;
    }

    setIsUndoing(true);

    try {
      const response = await fetch(`/api/uploads/${lastUploadedEntry.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        if (response.status === 404) {
          setLastUploadedEntry(null);
        }

        throw new Error(payload.error || "撤销失败，请稍后再试。");
      }

      setLastUploadedEntry(null);
      setStatus({
        type: "success",
        message: "刚刚那组照片已经从墙上撤下来了。",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "撤销失败，请稍后再试。",
      });
    } finally {
      setIsUndoing(false);
    }
  }

  return (
    <Card className="relative overflow-hidden rounded-[2.7rem] border-white/80 bg-white/78 py-0 shadow-[0_30px_110px_-58px_rgba(15,23,42,0.32)] xl:sticky xl:top-8">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-24 rounded-b-[1.75rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0))]" />

      <CardHeader className="relative gap-6 border-b border-black/5 px-6 pb-6 pt-7 sm:px-7 sm:pt-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="h-8 rounded-full bg-white px-4 text-[11px] tracking-[0.2em] text-zinc-700 uppercase shadow-sm"
              >
                Quick Save
              </Badge>
              <Badge
                variant="outline"
                className="h-8 rounded-full border-black/8 bg-white/60 px-4 text-[11px] tracking-[0.2em] text-zinc-500 uppercase"
              >
                Private Only
              </Badge>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-[2rem] font-semibold tracking-[-0.05em] text-zinc-950">
                直接把照片放上来
              </CardTitle>
              <CardDescription className="max-w-md text-sm leading-7 text-zinc-500">
                不用填标题和说明。选好照片，确认保存，之后想换封面、删图或补图都可以再管理。
              </CardDescription>
            </div>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white shadow-[0_18px_36px_-20px_rgba(15,23,42,0.5)]">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          {featureItems.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.4rem] border border-white/75 bg-white/82 p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)]"
            >
              <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-semibold tracking-tight text-zinc-950">
                {item.value}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-zinc-500">{item.hint}</p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="relative px-6 pb-7 pt-6 sm:px-7 sm:pb-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label
            htmlFor="photo-upload"
            className={cn(
              "group relative isolate block overflow-hidden rounded-[2rem] border p-6 transition-all duration-200 sm:p-8",
              isUploading ? "cursor-not-allowed opacity-70" : "cursor-pointer",
              isDragging
                ? "border-zinc-900 bg-zinc-50 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.36)]"
                : "border-dashed border-zinc-200 bg-[linear-gradient(180deg,rgba(250,250,250,0.92),rgba(245,245,245,0.82))] hover:border-zinc-300 hover:bg-zinc-50/95 hover:shadow-[0_22px_56px_-40px_rgba(15,23,42,0.24)]",
            )}
            onDragEnter={(event) => {
              if (isUploading) {
                return;
              }

              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              if (isUploading) {
                return;
              }

              event.preventDefault();
              setIsDragging(false);
            }}
            onDragOver={(event) => {
              if (isUploading) {
                return;
              }

              event.preventDefault();
            }}
            onDrop={(event) => {
              if (isUploading) {
                return;
              }

              event.preventDefault();
              setIsDragging(false);
              appendFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <div className="pointer-events-none absolute inset-x-10 top-0 h-20 rounded-b-[1.4rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0))]" />

            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="hidden"
              disabled={isUploading}
              onChange={(event) => {
                appendFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />

            <div className="relative flex flex-col items-center gap-4 text-center">
              <div className="flex h-18 w-18 items-center justify-center rounded-full bg-white text-zinc-900 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.3)] ring-1 ring-black/5 transition-transform duration-200 group-hover:-translate-y-0.5">
                <FileImage className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <p className="text-base font-semibold tracking-tight text-zinc-950">
                  点击选择或把照片拖到这里
                </p>
                <p className="text-sm leading-6 text-zinc-500">
                  JPG、PNG、WEBP、AVIF、GIF，单张 8MB 以内
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Badge
                  variant="outline"
                  className="h-8 rounded-full border-black/8 bg-white/78 px-4 text-[11px] tracking-[0.18em] text-zinc-600 uppercase"
                >
                  Click To Select
                </Badge>
                <Badge
                  variant="outline"
                  className="h-8 rounded-full border-black/8 bg-white/78 px-4 text-[11px] tracking-[0.18em] text-zinc-600 uppercase"
                >
                  Drag And Drop
                </Badge>
              </div>
            </div>
          </label>

          {previews.length > 0 ? (
            <div className="rounded-[1.8rem] border border-black/6 bg-zinc-50/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="h-7 rounded-full bg-white px-3 text-[11px] tracking-[0.18em] text-zinc-700 uppercase shadow-sm"
                    >
                      待保存队列
                    </Badge>
                    <p className="text-xs font-medium text-zinc-500">
                      共 {previews.length} 张
                    </p>
                  </div>
                  <p className="text-[13px] text-zinc-500">
                    累计 {formatBytes(previewTotalSize)}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-full px-4 text-zinc-500 hover:bg-white hover:text-zinc-950"
                  onClick={() => {
                    clearPreviews();
                    setStatus(IDLE_STATUS);
                  }}
                  disabled={isUploading}
                >
                  清空当前队列
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                {previews.map((preview) => (
                  <div
                    key={preview.id}
                    className="group overflow-hidden rounded-[1.45rem] border border-black/6 bg-white/92 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_40px_-26px_rgba(15,23,42,0.28)]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
                      <Image
                        src={preview.previewUrl}
                        alt={preview.file.name}
                        fill
                        unoptimized
                        sizes="(min-width: 1536px) 12vw, (min-width: 1280px) 14vw, (min-width: 640px) 22vw, 40vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />

                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                      <button
                        type="button"
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-zinc-900 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-white disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => removePreview(preview.id)}
                        disabled={isUploading}
                        aria-label={`移除 ${preview.file.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-1 px-3 pb-3 pt-2.5">
                      <p className="truncate text-xs font-medium text-zinc-950">
                        {preview.file.name}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {formatBytes(preview.file.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.7rem] border border-dashed border-black/8 bg-zinc-50/70 px-5 py-4 text-[13px] leading-6 text-zinc-500">
              上传后会自动进入时间倒序的照片墙。封面、顺序和单张删图都在下方管理面板里处理。
            </div>
          )}

          {status.type !== "idle" ? (
            <div
              className={cn(
                "rounded-[1.6rem] border px-4 py-4 backdrop-blur-sm transition-all duration-200 sm:px-5",
                status.type === "success"
                  ? "border-emerald-500/18 bg-emerald-500/8 text-emerald-700"
                  : "border-rose-500/18 bg-rose-500/8 text-rose-700",
              )}
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      "h-7 rounded-full px-3 text-[11px] tracking-[0.18em] uppercase",
                      status.type === "success"
                        ? "bg-white/80 text-emerald-700"
                        : "bg-white/80 text-rose-700",
                    )}
                  >
                    {status.type === "success" ? "保存成功" : "需要处理"}
                  </Badge>
                  <p className="text-sm font-medium">{status.message}</p>
                </div>

                {status.type === "success" && lastUploadedEntry ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full rounded-full border-emerald-500/20 bg-white/80 text-emerald-700 hover:bg-white sm:w-auto"
                    onClick={handleUndoLastUpload}
                    disabled={isUndoing}
                  >
                    {isUndoing ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <RotateCcw />
                    )}
                    {isUndoing ? "撤销中..." : "撤销刚刚上传"}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="h-13 w-full rounded-[1.45rem] bg-zinc-950 text-white shadow-[0_24px_48px_-24px_rgba(15,23,42,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800"
            disabled={isUploading || isUndoing}
          >
            {isUploading ? (
              <>
                <LoaderCircle className="animate-spin" />
                正在保存照片...
              </>
            ) : (
              <>
                <Upload />
                保存到照片墙
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

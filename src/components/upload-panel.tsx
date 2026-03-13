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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

      setStatus(notices.length ? {
        type: "error",
        message: `${notices.join("，")}。`,
      } : IDLE_STATUS);

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
    <Card className="h-full rounded-[2.6rem] border border-black/5 bg-white/96 py-0 shadow-[0_18px_80px_-40px_rgba(15,23,42,0.24)] xl:sticky xl:top-8">
      <CardHeader className="gap-5 px-6 pt-7 sm:px-7 sm:pt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.24em] text-zinc-500 uppercase">
              Quick Save
            </p>
            <CardTitle className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em] text-zinc-950">
              直接把照片放上来
            </CardTitle>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-900">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <CardDescription className="text-sm leading-7 text-zinc-500">
          不用填标题和说明。选好照片，确认保存，之后想换封面、删图或补图都可以再管理。
        </CardDescription>

        <div className="grid grid-cols-3 gap-2 rounded-[1.4rem] bg-zinc-50 p-2">
          <div className="rounded-[1rem] bg-white px-3 py-3 shadow-sm">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
              选择
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-900">最多 12 张</p>
          </div>
          <div className="rounded-[1rem] bg-white px-3 py-3 shadow-sm">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
              去重
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-900">重复自动忽略</p>
          </div>
          <div className="rounded-[1rem] bg-white px-3 py-3 shadow-sm">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
              撤销
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-900">上传后可撤回</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-7 sm:px-7 sm:pb-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label
            htmlFor="photo-upload"
            className={cn(
              "group relative block rounded-[2rem] border-2 border-dashed p-8 transition-all duration-200",
              isUploading ? "cursor-not-allowed opacity-70" : "cursor-pointer",
              isDragging
                ? "scale-[1.01] border-zinc-900 bg-zinc-50"
                : "border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 hover:bg-zinc-50",
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

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:-translate-y-0.5">
                <FileImage className="h-7 w-7 text-zinc-500 group-hover:text-zinc-900" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-950">
                  点击选择或把照片拖到这里
                </p>
                <p className="text-xs leading-6 text-zinc-500">
                  JPG、PNG、WEBP、AVIF、GIF，单张 8MB 以内
                </p>
              </div>
            </div>
          </label>

          {previews.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-500">待保存队列</p>
                  <p className="text-[11px] text-zinc-500">
                    共 {previews.length} 张，累计 {formatBytes(previewTotalSize)}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => {
                    clearPreviews();
                    setStatus(IDLE_STATUS);
                  }}
                  disabled={isUploading}
                >
                  清空当前队列
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map((preview) => (
                  <div
                    key={preview.id}
                    className="group overflow-hidden rounded-[1.4rem] bg-zinc-50 ring-1 ring-black/5"
                  >
                    <div className="relative aspect-[4/5]">
                      <Image
                        src={preview.previewUrl}
                        alt={preview.file.name}
                        fill
                        unoptimized
                        sizes="(min-width: 640px) 20vw, 40vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/16 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          className="rounded-full bg-white/92 p-2.5 text-zinc-900 shadow-lg transition-transform hover:scale-105"
                          onClick={() => removePreview(preview.id)}
                          disabled={isUploading}
                          aria-label={`移除 ${preview.file.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="truncate text-xs font-medium text-zinc-950">
                        {preview.file.name}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        {formatBytes(preview.file.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] bg-zinc-50 px-4 py-4 text-[13px] leading-6 text-zinc-500 ring-1 ring-black/5">
              上传后会自动进入时间倒序的照片墙。封面、顺序和单张删图都在管理面板里处理。
            </div>
          )}

          {status.type !== "idle" ? (
            <div
              className={cn(
                "rounded-[1.3rem] border px-4 py-3",
                status.type === "success"
                  ? "border-emerald-500/18 bg-emerald-500/8 text-emerald-700"
                  : "border-rose-500/18 bg-rose-500/8 text-rose-700",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium">{status.message}</p>
                {status.type === "success" && lastUploadedEntry ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-emerald-500/20 bg-white/80 text-emerald-700 hover:bg-white"
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
            className="h-12 w-full rounded-[1.2rem] bg-zinc-950 text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.7)] hover:bg-zinc-800"
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

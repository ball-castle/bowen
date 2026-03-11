"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoaderCircle, Sparkles, Trash2, Upload } from "lucide-react";

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

  const [exhibitionName, setExhibitionName] = useState("");
  const [venue, setVenue] = useState("");
  const [exhibitionDate, setExhibitionDate] = useState("");
  const [curatorNote, setCuratorNote] = useState("");
  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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
  }, []);

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

      return current.filter((preview) => preview.id !== id);
    });
  }

  function resetForm() {
    for (const preview of previewsRef.current) {
      URL.revokeObjectURL(preview.previewUrl);
    }

    previewsRef.current = [];
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
    <Card className="rounded-[1.8rem] border border-black/8 bg-white/82 py-0 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.38)] backdrop-blur-xl">
      <CardHeader className="gap-3 px-6 pt-6 sm:px-7 sm:pt-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
              Upload
            </p>
            <CardTitle className="mt-2 text-[1.75rem] font-semibold tracking-[-0.03em] text-zinc-950">
              新建上传批次
            </CardTitle>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
        <CardDescription className="text-sm leading-6 text-zinc-600">
          填写基本信息后即可归档这组展览照片。
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6 sm:px-7 sm:pb-7">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="exhibition-name"
                className="text-[13px] font-medium text-zinc-800"
              >
                展览名称
              </label>
              <Input
                id="exhibition-name"
                placeholder="例如：光的边界"
                value={exhibitionName}
                onChange={(event) => setExhibitionName(event.target.value)}
                className="h-11 rounded-[1rem] border-black/8 bg-white/80 px-4"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="venue" className="text-[13px] font-medium text-zinc-800">
                场馆 / 空间
              </label>
              <Input
                id="venue"
                placeholder="例如：一层主展厅"
                value={venue}
                onChange={(event) => setVenue(event.target.value)}
                className="h-11 rounded-[1rem] border-black/8 bg-white/80 px-4"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_1.15fr]">
            <div className="space-y-2">
              <label
                htmlFor="exhibition-date"
                className="text-[13px] font-medium text-zinc-800"
              >
                展览日期
              </label>
              <Input
                id="exhibition-date"
                type="date"
                value={exhibitionDate}
                onChange={(event) => setExhibitionDate(event.target.value)}
                className="h-11 rounded-[1rem] border-black/8 bg-white/80 px-4"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="curator-note"
                className="text-[13px] font-medium text-zinc-800"
              >
                展览说明
              </label>
              <Textarea
                id="curator-note"
                placeholder="写一点布展、策展或拍摄说明。"
                value={curatorNote}
                onChange={(event) => setCuratorNote(event.target.value)}
                className="min-h-28 resize-none rounded-[1rem] border-black/8 bg-white/80 px-4 py-3"
              />
            </div>
          </div>

          <label
            htmlFor="file-upload"
            className={cn(
              "block rounded-[1.4rem] border border-dashed bg-zinc-50/85 p-5 transition",
              isDragging
                ? "border-primary bg-primary/6 shadow-[0_0_0_6px_rgba(8,145,178,0.08)]"
                : "border-black/10 hover:border-primary/45 hover:bg-white",
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
                appendFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 sm:text-[15px]">
                  拖拽照片到这里，或点击选择文件
                </p>
                <p className="text-xs leading-6 text-zinc-600">
                  支持 JPG、PNG、WEBP、AVIF、GIF，单次最多上传 12 张。
                </p>
              </div>
            </div>
          </label>

          {previews.length ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-zinc-800">
                  待上传图片 {previews.length} / {MAX_FILE_COUNT}
                </p>
                <button
                  type="button"
                  className="text-sm text-zinc-500 transition hover:text-zinc-900"
                  onClick={resetForm}
                >
                  清空全部
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map((preview) => (
                  <div
                    key={preview.id}
                    className="overflow-hidden rounded-[1.1rem] border border-black/8 bg-white/90"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={preview.previewUrl}
                        alt={preview.file.name}
                        fill
                        unoptimized
                        sizes="(min-width: 640px) 20vw, 40vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3 px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {preview.file.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatBytes(preview.file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
                        onClick={() => removePreview(preview.id)}
                        aria-label={`移除 ${preview.file.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {status.type !== "idle" ? (
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm",
                status.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-rose-200 bg-rose-50 text-rose-700",
              )}
            >
              {status.message}
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full rounded-[1rem] bg-zinc-950 text-sm font-semibold text-white hover:bg-zinc-800"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                正在上传...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                上传这组展览照片
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  LoaderCircle,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytes, formatDateTimeLabel } from "@/lib/formatters";
import type { GalleryEntry, GalleryImage } from "@/lib/gallery";
import { cn } from "@/lib/utils";

type GalleryEntryActionsProps = {
  entry: GalleryEntry;
  buttonClassName?: string;
};

type DraftImage = {
  key: string;
  kind: "existing" | "new";
  imageId?: string;
  src: string;
  filename: string;
  mimeType: string;
  size: number;
  file?: File;
};

type DraftStatus = {
  type: "idle" | "error";
  message: string;
};

const MAX_FILE_COUNT = 12;
const IDLE_STATUS: DraftStatus = { type: "idle", message: "" };

function createDraftImages(images: GalleryImage[]): DraftImage[] {
  return images.map((image) => ({
    key: `existing:${image.id}`,
    kind: "existing",
    imageId: image.id,
    src: image.src,
    filename: image.filename,
    mimeType: image.mimeType,
    size: image.size,
  }));
}

function cleanupDraftImages(images: DraftImage[]) {
  for (const image of images) {
    if (image.kind === "new" && image.src.startsWith("blob:")) {
      URL.revokeObjectURL(image.src);
    }
  }
}

function getDraftSignature(image: DraftImage) {
  return `${image.filename}:${image.size}`;
}

function getFileSignature(file: File) {
  return `${file.name}:${file.size}`;
}

export function GalleryEntryActions({
  entry,
  buttonClassName,
}: GalleryEntryActionsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftImagesRef = useRef<DraftImage[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [status, setStatus] = useState<DraftStatus>(IDLE_STATUS);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    draftImagesRef.current = draftImages;
  }, [draftImages]);

  useEffect(() => {
    return () => {
      cleanupDraftImages(draftImagesRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanupDraftImages(draftImagesRef.current);
      draftImagesRef.current = [];
      setDraftImages([]);
      setStatus(IDLE_STATUS);
      return;
    }

    const nextDraftImages = createDraftImages(entry.images);
    cleanupDraftImages(draftImagesRef.current);
    draftImagesRef.current = nextDraftImages;
    setDraftImages(nextDraftImages);
    setStatus(IDLE_STATUS);
  }, [entry, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving && !isDeleting) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, isOpen, isSaving]);

  function appendFiles(fileList: File[]) {
    const imageFiles = fileList.filter((file) => file.type.startsWith("image/"));

    if (!imageFiles.length) {
      setStatus({ type: "error", message: "请先选择图片文件。" });
      return;
    }

    setDraftImages((current) => {
      const notices: string[] = [];
      const existingSignatures = new Set(current.map(getDraftSignature));
      const uniqueFiles: File[] = [];

      if (imageFiles.length !== fileList.length) {
        notices.push("已自动忽略非图片文件");
      }

      for (const file of imageFiles) {
        if (existingSignatures.has(getFileSignature(file))) {
          continue;
        }

        existingSignatures.add(getFileSignature(file));
        uniqueFiles.push(file);
      }

      const duplicateCount = imageFiles.length - uniqueFiles.length;

      if (duplicateCount > 0) {
        notices.push(`已忽略 ${duplicateCount} 张重复照片`);
      }

      const availableSlots = Math.max(MAX_FILE_COUNT - current.length, 0);
      const acceptedFiles = uniqueFiles.slice(0, availableSlots);

      if (acceptedFiles.length < uniqueFiles.length) {
        notices.push(`每组最多保留 ${MAX_FILE_COUNT} 张照片`);
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
          key: crypto.randomUUID(),
          kind: "new" as const,
          src: URL.createObjectURL(file),
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          file,
        })),
      ];
    });
  }

  function removeImage(imageKey: string) {
    setDraftImages((current) => {
      if (current.length === 1) {
        setStatus({
          type: "error",
          message: "最后一张照片请直接使用“删除整组”。",
        });
        return current;
      }

      const target = current.find((image) => image.key === imageKey);

      if (target?.kind === "new" && target.src.startsWith("blob:")) {
        URL.revokeObjectURL(target.src);
      }

      return current.filter((image) => image.key !== imageKey);
    });
  }

  function moveImage(imageKey: string, offset: -1 | 1) {
    setDraftImages((current) => {
      const currentIndex = current.findIndex((image) => image.key === imageKey);
      const nextIndex = currentIndex + offset;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextImages = [...current];
      const [target] = nextImages.splice(currentIndex, 1);
      nextImages.splice(nextIndex, 0, target);
      return nextImages;
    });
  }

  function setAsCover(imageKey: string) {
    setDraftImages((current) => {
      const currentIndex = current.findIndex((image) => image.key === imageKey);

      if (currentIndex <= 0) {
        return current;
      }

      const nextImages = [...current];
      const [target] = nextImages.splice(currentIndex, 1);
      nextImages.unshift(target);
      return nextImages;
    });
  }

  async function handleSave() {
    if (!draftImages.length) {
      setStatus({ type: "error", message: "至少需要保留一张照片。" });
      return;
    }

    setIsSaving(true);
    setStatus(IDLE_STATUS);

    try {
      const formData = new FormData();
      const newDraftImages = draftImages.filter((image) => image.kind === "new");

      formData.append(
        "order",
        JSON.stringify(
          draftImages.map((image) =>
            image.kind === "existing"
              ? `existing:${image.imageId}`
              : `new:${image.key}`,
          ),
        ),
      );
      formData.append(
        "newFileIds",
        JSON.stringify(newDraftImages.map((image) => image.key)),
      );

      for (const image of newDraftImages) {
        if (image.file) {
          formData.append("files", image.file);
        }
      }

      const response = await fetch(`/api/uploads/${entry.id}`, {
        method: "PATCH",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "保存失败，请稍后再试。");
      }

      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "保存失败，请稍后再试。",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteGroup() {
    const confirmed = window.confirm(
      `确认删除这组照片吗？这会同时移除 ${entry.images.length} 张照片和对应记录，且无法恢复。`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setStatus(IDLE_STATUS);

    try {
      const response = await fetch(`/api/uploads/${entry.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "删除失败，请稍后再试。");
      }

      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "删除失败，请稍后再试。",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn(
          "border-white/35 bg-white/82 text-zinc-900 backdrop-blur-md hover:bg-white",
          buttonClassName,
        )}
        onClick={() => setIsOpen(true)}
      >
        管理
      </Button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/42 px-4 py-5 backdrop-blur-sm sm:px-6 sm:py-8"
          onClick={() => {
            if (!isSaving && !isDeleting) {
              setIsOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_32px_120px_-50px_rgba(15,23,42,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/6 px-5 py-5 sm:px-7 sm:py-6">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500 uppercase">
                  Photo Manager
                </p>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[2rem]">
                    管理这组照片
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatDateTimeLabel(entry.createdAt)} · 当前 {draftImages.length} 张
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                onClick={() => setIsOpen(false)}
                disabled={isSaving || isDeleting}
              >
                <X />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-5 px-5 py-5 sm:px-7 sm:py-7 xl:grid-cols-[minmax(0,1fr)_21rem]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {draftImages.map((image, index) => (
                      <div
                        key={image.key}
                        className="overflow-hidden rounded-[1.5rem] border border-black/7 bg-zinc-50 shadow-sm"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <Image
                            src={image.src}
                            alt={image.filename}
                            fill
                            unoptimized={image.kind === "new"}
                            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 32vw, 100vw"
                            className="object-cover"
                          />

                          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-zinc-900 uppercase backdrop-blur">
                              {index === 0 ? "封面" : `#${index + 1}`}
                            </span>
                            {image.kind === "new" ? (
                              <span className="rounded-full bg-zinc-950/78 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white uppercase backdrop-blur">
                                新加
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-3 px-3 py-3">
                          <div>
                            <p className="truncate text-sm font-medium text-zinc-950">
                              {image.filename}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {formatBytes(image.size)}
                            </p>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => moveImage(image.key, -1)}
                              disabled={index === 0 || isSaving || isDeleting}
                            >
                              <ArrowLeft />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => setAsCover(image.key)}
                              disabled={index === 0 || isSaving || isDeleting}
                            >
                              <Star />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => moveImage(image.key, 1)}
                              disabled={
                                index === draftImages.length - 1 ||
                                isSaving ||
                                isDeleting
                              }
                            >
                              <ArrowRight />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              className="rounded-xl border-rose-500/20 bg-rose-500/6 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                              onClick={() => removeImage(image.key)}
                              disabled={
                                draftImages.length === 1 || isSaving || isDeleting
                              }
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="space-y-4 rounded-[1.75rem] border border-black/6 bg-zinc-50/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500 uppercase">
                      Quick Adjust
                    </p>
                    <h4 className="text-xl font-semibold tracking-tight text-zinc-950">
                      直接整理这一组
                    </h4>
                    <p className="text-sm leading-6 text-zinc-500">
                      第一张会作为封面展示。你可以追加照片、重新排序，或者删掉不想保留的那几张。
                    </p>
                  </div>

                  <div className="grid gap-2 rounded-[1.35rem] bg-white p-2 shadow-sm">
                    <div className="flex items-center justify-between rounded-[1rem] bg-zinc-50 px-3 py-3">
                      <span className="text-xs text-zinc-500">当前照片</span>
                      <span className="text-sm font-semibold text-zinc-950">
                        {draftImages.length} / {MAX_FILE_COUNT}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[1rem] bg-zinc-50 px-3 py-3">
                      <span className="text-xs text-zinc-500">封面规则</span>
                      <span className="text-sm font-semibold text-zinc-950">
                        第一张
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-white px-4 py-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        appendFiles(Array.from(event.target.files ?? []));
                        event.target.value = "";
                      }}
                    />

                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="w-full rounded-[1.1rem]"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={draftImages.length >= MAX_FILE_COUNT || isSaving || isDeleting}
                    >
                      <ImagePlus />
                      继续添加照片
                    </Button>

                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      支持拖拽前已经上传过的照片继续补充，最多保留 12 张。
                    </p>
                  </div>

                  {status.type === "error" ? (
                    <div className="rounded-[1.1rem] border border-rose-500/16 bg-rose-500/8 px-4 py-3 text-sm text-rose-700">
                      {status.message}
                    </div>
                  ) : (
                    <div className="rounded-[1.1rem] border border-black/6 bg-white px-4 py-3 text-sm text-zinc-500">
                      轻点整理，保存后首页会立即刷新。
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      type="button"
                      size="lg"
                      className="w-full rounded-[1.1rem]"
                      onClick={handleSave}
                      disabled={isSaving || isDeleting}
                    >
                      {isSaving ? (
                        <>
                          <LoaderCircle className="animate-spin" />
                          正在保存调整...
                        </>
                      ) : (
                        <>
                          <Sparkles />
                          保存这组调整
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="w-full rounded-[1.1rem] border-rose-500/20 bg-rose-500/6 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                      onClick={handleDeleteGroup}
                      disabled={isSaving || isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <LoaderCircle className="animate-spin" />
                          删除中...
                        </>
                      ) : (
                        <>
                          <Trash2 />
                          删除整组照片
                        </>
                      )}
                    </Button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

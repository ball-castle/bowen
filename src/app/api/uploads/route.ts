import { randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  saveGalleryEntry,
  type GalleryEntry,
  type GalleryImage,
} from "@/lib/gallery";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_FILE_COUNT = 12;

function toSlug(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || "photo";
}

function extFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/avif":
      return ".avif";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string";
}

export async function POST(request: Request) {
  let uploadDir: string | null = null;

  try {
    const formData = await request.formData();
    const exhibitionName = String(formData.get("exhibitionName") ?? "").trim();
    const venue = String(formData.get("venue") ?? "").trim();
    const exhibitionDate = String(formData.get("exhibitionDate") ?? "").trim();
    const curatorNote = String(formData.get("curatorNote") ?? "").trim();
    const files = formData
      .getAll("files")
      .filter(isFile)
      .filter((file) => file.size > 0);

    if (!files.length) {
      return NextResponse.json(
        { error: "至少需要选择一张照片。" },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILE_COUNT) {
      return NextResponse.json(
        { error: `单次最多上传 ${MAX_FILE_COUNT} 张图片。` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: `${file.name} 不是受支持的图片格式。` },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} 超过 8MB，请压缩后重试。` },
          { status: 400 },
        );
      }
    }

    const entryId = randomUUID();
    const uploadFolder = `memory-${entryId.slice(0, 8)}`;
    uploadDir = path.join(process.cwd(), "public", "uploads", uploadFolder);

    await mkdir(uploadDir, { recursive: true });

    const images: GalleryImage[] = [];

    for (const [index, file] of files.entries()) {
      const sourceExt = path.extname(file.name).toLowerCase();
      const extension = sourceExt || extFromMimeType(file.type);
      const rawBaseName = sourceExt
        ? path.basename(file.name, sourceExt)
        : file.name;
      const safeBaseName = toSlug(rawBaseName) || `photo-${index + 1}`;
      const storedFileName = `${String(index + 1).padStart(2, "0")}-${safeBaseName}${extension}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      await writeFile(path.join(uploadDir, storedFileName), buffer);

      images.push({
        id: randomUUID(),
        src: `/uploads/${uploadFolder}/${storedFileName}`,
        alt: `日常照片 ${index + 1}`,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });
    }

    const entry: GalleryEntry = {
      id: entryId,
      exhibitionName,
      venue,
      exhibitionDate,
      curatorNote,
      createdAt: new Date().toISOString(),
      images,
    };

    await saveGalleryEntry(entry);
    revalidatePath("/");

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Upload failed", error);

    if (uploadDir) {
      await rm(uploadDir, { recursive: true, force: true }).catch(
        (cleanupError) => {
          console.error("Upload cleanup failed", cleanupError);
        },
      );
    }

    return NextResponse.json(
      { error: "保存失败，请稍后再试。" },
      { status: 500 },
    );
  }
}

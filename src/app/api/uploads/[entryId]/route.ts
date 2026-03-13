import { randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  cleanupGalleryImages,
  deleteGalleryEntry,
  getGalleryEntryUploadFolder,
  readGalleryEntry,
  replaceGalleryEntry,
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
const EXISTING_PREFIX = "existing:";
const NEW_PREFIX = "new:";

class ValidationError extends Error {}

type RouteContext = {
  params: Promise<{
    entryId: string;
  }>;
};

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

function parseStringArray(value: string, fieldName: string) {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error();
    }

    return parsed;
  } catch {
    throw new ValidationError(`${fieldName} 格式无效。`);
  }
}

function validateFiles(files: File[]) {
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new ValidationError(`${file.name} 不是受支持的图片格式。`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(`${file.name} 超过 8MB，请压缩后重试。`);
    }
  }
}

function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(request: Request, context: RouteContext) {
  const writtenFilePaths: string[] = [];

  try {
    const { entryId } = await context.params;

    if (!entryId) {
      return createErrorResponse("缺少照片组 ID。", 400);
    }

    const entry = await readGalleryEntry(entryId);

    if (!entry) {
      return createErrorResponse("这组照片不存在或已被删除。", 404);
    }

    const formData = await request.formData();
    const orderTokens = parseStringArray(
      String(formData.get("order") ?? "[]"),
      "order",
    );
    const newFileIds = parseStringArray(
      String(formData.get("newFileIds") ?? "[]"),
      "newFileIds",
    );
    const newFiles = formData
      .getAll("files")
      .filter(isFile)
      .filter((file) => file.size > 0);

    if (newFileIds.length !== newFiles.length) {
      return createErrorResponse("新增照片数据不完整，请重新打开管理面板后再试。", 400);
    }

    if (!orderTokens.length) {
      return createErrorResponse("至少需要保留一张照片。", 400);
    }

    if (orderTokens.length > MAX_FILE_COUNT) {
      return createErrorResponse(`每组最多保留 ${MAX_FILE_COUNT} 张照片。`, 400);
    }

    validateFiles(newFiles);

    const uploadFolder =
      getGalleryEntryUploadFolder(entry) ?? `memory-${entry.id.slice(0, 8)}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", uploadFolder);
    await mkdir(uploadDir, { recursive: true });

    const existingImages = new Map(entry.images.map((image) => [image.id, image]));
    const newImages = new Map<string, GalleryImage>();

    for (const [index, file] of newFiles.entries()) {
      const sourceExt = path.extname(file.name).toLowerCase();
      const extension = sourceExt || extFromMimeType(file.type);
      const rawBaseName = sourceExt
        ? path.basename(file.name, sourceExt)
        : file.name;
      const safeBaseName = toSlug(rawBaseName) || `photo-${index + 1}`;
      const storedFileName = `${String(entry.images.length + index + 1).padStart(2, "0")}-${safeBaseName}-${randomUUID().slice(0, 6)}${extension}`;
      const absoluteFilePath = path.join(uploadDir, storedFileName);

      await writeFile(absoluteFilePath, Buffer.from(await file.arrayBuffer()));
      writtenFilePaths.push(absoluteFilePath);

      newImages.set(`${NEW_PREFIX}${newFileIds[index]}`, {
        id: randomUUID(),
        src: `/uploads/${uploadFolder}/${storedFileName}`,
        alt: `日常照片 ${entry.images.length + index + 1}`,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });
    }

    const nextImages: GalleryImage[] = [];
    const keptExistingIds = new Set<string>();
    const usedTokens = new Set<string>();

    for (const token of orderTokens) {
      if (usedTokens.has(token)) {
        throw new ValidationError("照片顺序数据重复，请重新打开管理面板后再试。");
      }

      usedTokens.add(token);

      if (token.startsWith(EXISTING_PREFIX)) {
        const imageId = token.slice(EXISTING_PREFIX.length);
        const image = existingImages.get(imageId);

        if (!image) {
          throw new ValidationError("部分原有照片已不存在，请刷新页面后再试。");
        }

        keptExistingIds.add(imageId);
        nextImages.push(image);
        continue;
      }

      if (token.startsWith(NEW_PREFIX)) {
        const image = newImages.get(token);

        if (!image) {
          throw new ValidationError("新增照片排序信息无效，请重新选择后再试。");
        }

        nextImages.push(image);
        continue;
      }

      throw new ValidationError("照片顺序数据无法识别。");
    }

    if (nextImages.length !== orderTokens.length) {
      throw new ValidationError("照片顺序数据不完整。");
    }

    for (const token of newImages.keys()) {
      if (!usedTokens.has(token)) {
        throw new ValidationError("存在未放入序列的新照片，请重新保存。");
      }
    }

    if (!nextImages.length) {
      throw new ValidationError("至少需要保留一张照片。");
    }

    const removedImages = entry.images.filter((image) => !keptExistingIds.has(image.id));
    const nextEntry = {
      ...entry,
      images: nextImages,
    };

    const savedEntry = await replaceGalleryEntry(nextEntry);

    if (!savedEntry) {
      throw new ValidationError("这组照片不存在或已被删除。");
    }

    await cleanupGalleryImages(removedImages);
    revalidatePath("/");

    return NextResponse.json({ entry: savedEntry });
  } catch (error) {
    for (const filePath of writtenFilePaths) {
      await rm(filePath, { force: true }).catch((cleanupError) => {
        console.error("Editor cleanup failed", cleanupError);
      });
    }

    if (error instanceof ValidationError) {
      return createErrorResponse(error.message, 400);
    }

    console.error("Update upload failed", error);

    return createErrorResponse(
      error instanceof Error ? error.message : "保存照片组失败，请稍后再试。",
      500,
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { entryId } = await context.params;

    if (!entryId) {
      return createErrorResponse("缺少照片组 ID。", 400);
    }

    const deletedEntry = await deleteGalleryEntry(entryId);

    if (!deletedEntry) {
      return createErrorResponse("这组照片不存在或已被删除。", 404);
    }

    revalidatePath("/");

    return NextResponse.json({
      entry: deletedEntry,
      message: "已删除这组照片。",
    });
  } catch (error) {
    console.error("Delete upload failed", error);

    return createErrorResponse("删除失败，请稍后再试。", 500);
  }
}

import { mkdir, readFile, readdir, rm, unlink, writeFile } from "fs/promises";
import path from "path";

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type GalleryEntry = {
  id: string;
  exhibitionName: string;
  venue: string;
  exhibitionDate: string;
  curatorNote: string;
  createdAt: string;
  images: GalleryImage[];
};

type GalleryStore = {
  entries: GalleryEntry[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const GALLERY_FILE = path.join(DATA_DIR, "gallery.json");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const EMPTY_STORE: GalleryStore = { entries: [] };

async function ensureGalleryStore() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(GALLERY_FILE, "utf8");
  } catch {
    await writeFile(GALLERY_FILE, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
  }
}

function compareEntriesByCreatedAt(a: GalleryEntry, b: GalleryEntry) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

async function writeGalleryEntries(entries: GalleryEntry[]) {
  const nextStore: GalleryStore = {
    entries: [...entries].sort(compareEntriesByCreatedAt),
  };

  await writeFile(GALLERY_FILE, JSON.stringify(nextStore, null, 2), "utf8");
}

function resolveUploadFilePath(src: string) {
  if (!src.startsWith("/uploads/")) {
    return null;
  }

  const normalizedSrc = src.replace(/^\/+/, "");
  const resolvedPath = path.resolve(PUBLIC_DIR, normalizedSrc);
  const relativePath = path.relative(UPLOADS_DIR, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return resolvedPath;
}

async function removeUploadFile(src: string) {
  const filePath = resolveUploadFilePath(src);

  if (!filePath) {
    return;
  }

  await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });
}

async function removeEmptyUploadFolder(src: string) {
  const filePath = resolveUploadFilePath(src);

  if (!filePath) {
    return;
  }

  const directory = path.dirname(filePath);
  const relativeDirectory = path.relative(UPLOADS_DIR, directory);

  if (
    !relativeDirectory ||
    relativeDirectory.startsWith("..") ||
    path.isAbsolute(relativeDirectory)
  ) {
    return;
  }

  const contents = await readdir(directory).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return null;
      }

      throw error;
    },
  );

  if (!contents || contents.length > 0) {
    return;
  }

  await rm(directory, { recursive: true, force: true });
}

export function getGalleryEntryUploadFolder(entry: GalleryEntry) {
  for (const image of entry.images) {
    if (!image.src.startsWith("/uploads/")) {
      continue;
    }

    const [, uploadsPrefix, folderName] = image.src.split("/");

    if (uploadsPrefix === "uploads" && folderName) {
      return folderName;
    }
  }

  return null;
}

export async function cleanupGalleryImages(images: GalleryImage[]) {
  const fileRemovalResults = await Promise.allSettled(
    images.map((image) => removeUploadFile(image.src)),
  );
  const folderCleanupResults = await Promise.allSettled(
    images.map((image) => removeEmptyUploadFolder(image.src)),
  );

  for (const result of [...fileRemovalResults, ...folderCleanupResults]) {
    if (result.status === "rejected") {
      console.error("Gallery cleanup failed", result.reason);
    }
  }
}

export async function readGalleryEntries() {
  await ensureGalleryStore();

  const raw = await readFile(GALLERY_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<GalleryStore>;
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];

  return entries.sort(compareEntriesByCreatedAt);
}

export async function readGalleryEntry(entryId: string) {
  const entries = await readGalleryEntries();
  return entries.find((entry) => entry.id === entryId) ?? null;
}

export async function saveGalleryEntry(entry: GalleryEntry) {
  const entries = await readGalleryEntries();
  await writeGalleryEntries([entry, ...entries]);

  return entry;
}

export async function replaceGalleryEntry(nextEntry: GalleryEntry) {
  const entries = await readGalleryEntries();
  const entryIndex = entries.findIndex((entry) => entry.id === nextEntry.id);

  if (entryIndex < 0) {
    return null;
  }

  const nextEntries = [...entries];
  nextEntries[entryIndex] = nextEntry;
  await writeGalleryEntries(nextEntries);

  return nextEntry;
}

export async function deleteGalleryEntry(entryId: string) {
  const entries = await readGalleryEntries();
  const targetEntry = entries.find((entry) => entry.id === entryId);

  if (!targetEntry) {
    return null;
  }

  const nextEntries = entries.filter((entry) => entry.id !== entryId);
  await writeGalleryEntries(nextEntries);
  await cleanupGalleryImages(targetEntry.images);

  return targetEntry;
}

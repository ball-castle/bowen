import { mkdir, readFile, writeFile } from "fs/promises";
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
const EMPTY_STORE: GalleryStore = { entries: [] };

async function ensureGalleryStore() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(GALLERY_FILE, "utf8");
  } catch {
    await writeFile(GALLERY_FILE, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
  }
}

export async function readGalleryEntries() {
  await ensureGalleryStore();

  const raw = await readFile(GALLERY_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<GalleryStore>;
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];

  return entries.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function saveGalleryEntry(entry: GalleryEntry) {
  const entries = await readGalleryEntries();
  const nextStore: GalleryStore = {
    entries: [entry, ...entries],
  };

  await writeFile(GALLERY_FILE, JSON.stringify(nextStore, null, 2), "utf8");

  return entry;
}

import fs from 'fs';
import path from 'path';
import { ContentPack } from '../../../shared/contracts';

const DATA_DIR = path.join(__dirname, '../../.data/content-packs');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadIndex(): Array<Pick<ContentPack, 'packId' | 'createdAt' | 'topic' | 'userId' | 'theme' | 'status'>> {
  ensureDir();
  if (!fs.existsSync(INDEX_FILE)) return [];
  try {
    const raw = fs.readFileSync(INDEX_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveIndex(list: ReturnType<typeof loadIndex>) {
  ensureDir();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(list, null, 2));
}

export function saveContentPack(pack: ContentPack): ContentPack {
  ensureDir();
  const packPath = path.join(DATA_DIR, `${pack.packId}.json`);
  fs.writeFileSync(packPath, JSON.stringify(pack, null, 2));

  const idx = loadIndex().filter((i) => i.packId !== pack.packId);
  idx.unshift({
    packId: pack.packId,
    createdAt: pack.createdAt,
    topic: pack.topic,
    userId: pack.userId,
    theme: pack.theme,
    status: pack.status,
  });
  saveIndex(idx.slice(0, 50));
  return pack;
}

export function listContentPacks(limit = 50) {
  const idx = loadIndex();
  return idx.slice(0, limit);
}

export function getContentPack(packId: string): ContentPack | null {
  ensureDir();
  const packPath = path.join(DATA_DIR, `${packId}.json`);
  if (!fs.existsSync(packPath)) return null;
  try {
    const raw = fs.readFileSync(packPath, 'utf-8');
    return JSON.parse(raw) as ContentPack;
  } catch {
    return null;
  }
}

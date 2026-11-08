const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { DateTime } = require("luxon");
const manifest = require("../lib/image-manifest");

const MEDIA = path.join(__dirname, "..", "media");
const EXCLUDE_DIRS = new Set(["_generated", "blog", "fonts"]);
const IMAGE_RE = /\.(jpe?g|png|gif|webp|avif|tiff?)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogg)$/i;

function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readSidecar(imagePath) {
  const sidecarPath = `${imagePath}.md`;
  if (!fs.existsSync(sidecarPath)) return null;
  try {
    const parsed = matter(fs.readFileSync(sidecarPath, "utf8"));
    return {
      data: parsed.data || {},
      content: (parsed.content || "").trim(),
    };
  } catch {
    return null;
  }
}

function titleCase(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function dateFromAlbumName(name) {
  const match = name.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!match) return null;
  const iso = `${match[1]}-${match[2]}-${match[3] || "01"}`;
  return DateTime.fromISO(iso, { zone: "utc" }).isValid ? iso : null;
}

function albumTitle(name) {
  const iso = dateFromAlbumName(name);
  if (iso) {
    return DateTime.fromISO(iso, { zone: "utc" }).toFormat("LLLL yyyy");
  }
  return titleCase(name);
}

function dateFromFilename(file) {
  const match = file.match(
    /(20\d{2})(\d{2})(\d{2})[_-]?(\d{2})(\d{2})(\d{2})/,
  );
  if (match) {
    const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`;
    return DateTime.fromISO(iso, { zone: "utc" }).isValid ? iso : null;
  }

  const dateOnly = file.match(/(20\d{2})(\d{2})(\d{2})/);
  if (!dateOnly) return null;
  const iso = `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;
  return DateTime.fromISO(iso, { zone: "utc" }).isValid ? iso : null;
}

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const raw = String(value).trim();
  const iso = DateTime.fromISO(raw, { zone: "utc" });
  if (iso.isValid) return iso.toISO();
  const sql = DateTime.fromSQL(raw, { zone: "utc" });
  if (sql.isValid) return sql.toISO();
  const rfc = DateTime.fromRFC2822(raw, { zone: "utc" });
  if (rfc.isValid) return rfc.toISO();
  return null;
}

function formatDate(iso, style = "long") {
  if (!iso) return null;
  const date = DateTime.fromISO(iso, { zone: "utc" });
  if (!date.isValid) return null;
  if (style === "short") return date.toFormat("d LLL yyyy");
  return date.toFormat("d LLLL yyyy");
}

function slugify(value) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function buildAlbum(name) {
  const dir = path.join(MEDIA, name);
  const meta = readJson(path.join(dir, "album.json"));
  const captions = readJson(path.join(dir, "captions.json"));

  const files = fs
    .readdirSync(dir)
    .filter(
      (file) =>
        !file.startsWith(".") && !/\.(json|md|xmp|aae)$/i.test(file),
    );

  const photos = [];
  const videos = [];

  for (const file of files) {
    const rel = `${name}/${file}`;
    const sidecar = readSidecar(path.join(dir, file));
    const extra = sidecar?.data || {};

    if (IMAGE_RE.test(file)) {
      const base = manifest.images[rel];
      if (!base) continue;

      const caption = extra.caption || captions[file] || null;
      const date =
        normalizeDate(extra.date) ||
        normalizeDate(base.date) ||
        dateFromFilename(file) ||
        dateFromAlbumName(name);

      photos.push({
        ...base,
        type: "image",
        id: `photo-${slugify(rel)}`,
        album: name,
        albumTitle: albumTitle(name),
        caption,
        note: sidecar?.content || extra.note || null,
        location: extra.location || meta.location || null,
        alt: extra.alt || caption || `Photo from ${albumTitle(name)}`,
        date,
        dateLabel: formatDate(date),
        shortDate: formatDate(date, "short"),
      });
    } else if (VIDEO_RE.test(file)) {
      const base = manifest.videos[rel];
      if (!base) continue;

      const caption = extra.caption || captions[file] || null;
      const date =
        normalizeDate(extra.date) ||
        normalizeDate(base.date) ||
        dateFromFilename(file) ||
        dateFromAlbumName(name);

      videos.push({
        ...base,
        type: "video",
        id: `photo-${slugify(rel)}`,
        album: name,
        albumTitle: albumTitle(name),
        caption,
        note: sidecar?.content || extra.note || null,
        location: extra.location || meta.location || null,
        alt: extra.alt || caption || `Video from ${albumTitle(name)}`,
        date,
        dateLabel: formatDate(date),
        shortDate: formatDate(date, "short"),
      });
    }
  }

  const byDate = (a, b) =>
    (a.date || "").localeCompare(b.date || "") ||
    (a.file || "").localeCompare(b.file || "");

  photos.sort(byDate);
  videos.sort(byDate);
  const items = [...photos, ...videos].sort(byDate);

  const coverName = meta.cover ? path.basename(meta.cover) : null;
  const cover =
    photos.find((photo) => photo.file.split("/").pop() === coverName) ||
    items[0] ||
    null;

  const date =
    normalizeDate(meta.date) ||
    dateFromAlbumName(name) ||
    items[0]?.date ||
    null;

  return {
    id: name,
    title: meta.title || albumTitle(name),
    subtitle: meta.subtitle || null,
    description: meta.description || null,
    location: meta.location || null,
    date,
    dateLabel: formatDate(date),
    cover,
    photos,
    videos,
    items,
    count: items.length,
    photoCount: photos.length,
    videoCount: videos.length,
  };
}

function buildGallery() {
  if (!fs.existsSync(MEDIA)) {
    return emptyGallery();
  }

  const albums = fs
    .readdirSync(MEDIA, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && !EXCLUDE_DIRS.has(entry.name),
    )
    .map((entry) => entry.name)
    .map(buildAlbum)
    .filter((album) => album.count > 0)
    .sort(
      (a, b) =>
        (b.date || "").localeCompare(a.date || "") ||
        b.id.localeCompare(a.id),
    );

  const book = albums.flatMap((album) =>
    album.items.map((item) => ({
      ...item,
      albumTitle: album.title,
      albumLocation: album.location,
    })),
  );

  const recent = albums
    .flatMap((album) =>
      album.items.map((item) => ({
        ...item,
        albumTitle: album.title,
      })),
    )
    .slice()
    .sort(
      (a, b) =>
        (b.date || "").localeCompare(a.date || "") ||
        (b.file || "").localeCompare(a.file || ""),
    );

  return {
    albums,
    book,
    recent,
    recentPhotos: recent.filter((item) => item.type === "image"),
    totalItems: book.length,
    totalPhotos: book.filter((item) => item.type === "image").length,
    totalVideos: book.filter((item) => item.type === "video").length,
  };
}

function emptyGallery() {
  return {
    albums: [],
    book: [],
    recent: [],
    recentPhotos: [],
    totalItems: 0,
    totalPhotos: 0,
    totalVideos: 0,
  };
}

module.exports = buildGallery();

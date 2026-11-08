#!/usr/bin/env node
/**
 * Build-time image pipeline.
 *
 * Scans media/<album>/ for photos and videos and emits responsive AVIF / WebP /
 * JPEG derivatives plus a tiny inline LQIP placeholder. Results are cached in
 * media/_generated and reused until the source file changes.
 *
 * Usage:
 *   node scripts/build-images.js
 *   node scripts/build-images.js --force
 */

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const sharp = require("sharp");
const exifr = require("exifr");

const ROOT = path.resolve(__dirname, "..");
const MEDIA = path.join(ROOT, "media");
const OUT = path.join(MEDIA, "_generated");
const MANIFEST_PATH = path.join(OUT, "manifest.json");
const HERO_SRC = path.join(MEDIA, "my_landscape_photo.jpg");

const IMAGE_RE = /\.(jpe?g|png|webp|avif|tiff?)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogg)$/i;
const EXCLUDE_DIRS = new Set(["_generated", "blog", "fonts"]);

const GALLERY_WIDTHS = [640, 1280, 1920];
const HERO_WIDTHS = [640, 960, 1280, 1600, 2000];
const POSTER_WIDTHS = [640, 1280];

const FORCE = process.argv.includes("--force");
const HAS_FFMPEG = commandExists("ffmpeg") && commandExists("ffprobe");

let manifest = { images: {}, videos: {}, hero: null };

function commandExists(cmd) {
  try {
    execFileSync(cmd, ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function hash(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function slug(value) {
  return (
    value
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 48) || "image"
  );
}

function publicUrl(filePath) {
  return "/" + path.relative(ROOT, filePath).split(path.sep).join("/");
}

async function loadManifest() {
  try {
    return JSON.parse(await fsp.readFile(MANIFEST_PATH, "utf8"));
  } catch {
    return { images: {}, videos: {}, hero: null };
  }
}

async function fileStamp(filePath) {
  const stat = await fsp.stat(filePath);
  return `${stat.size}-${Math.round(stat.mtimeMs)}`;
}

function cleanCamera(make, model) {
  if (!model) return make ? String(make).trim() : null;
  let name = String(model).trim();
  const brand = make ? String(make).trim() : "";
  if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
    name = name.slice(brand.length).trim();
  }
  return name || brand || null;
}

async function readExif(filePath) {
  try {
    const data = await exifr.parse(filePath, {
      pick: [
        "DateTimeOriginal",
        "CreateDate",
        "Make",
        "Model",
        "LensModel",
        "FNumber",
        "ExposureTime",
        "ISO",
        "FocalLength",
      ],
      translateValues: false,
      reviveValues: false,
    });
    if (!data) return {};
    const rawDate = data.DateTimeOriginal || data.CreateDate;
    const date = normalizeExifDate(rawDate);
    return {
      date,
      camera: cleanCamera(data.Make, data.Model),
      lens: data.LensModel ? String(data.LensModel).trim() : null,
      settings: formatSettings(data),
    };
  } catch {
    return {};
  }
}

function formatSettings(data) {
  const parts = [];
  const aperture = Number(data.FNumber);
  if (aperture && !Number.isNaN(aperture)) {
    parts.push(`f/${Number(aperture.toFixed(2))}`);
  }
  const exposure = Number(data.ExposureTime);
  if (exposure && !Number.isNaN(exposure)) {
    parts.push(
      exposure >= 1
        ? `${Number(exposure.toFixed(1))}s`
        : `1/${Math.round(1 / exposure)}s`,
    );
  }
  if (data.ISO) parts.push(`ISO ${data.ISO}`);
  const focal = Number(data.FocalLength);
  if (focal && !Number.isNaN(focal)) {
    parts.push(`${Number(focal.toFixed(1))}mm`);
  }
  return parts.length ? parts.join(" · ") : null;
}

function normalizeExifDate(rawDate) {
  if (rawDate instanceof Date) {
    return Number.isNaN(rawDate.valueOf()) ? null : rawDate.toISOString();
  }
  if (typeof rawDate !== "string") return null;

  // EXIF stores local time as "YYYY:MM:DD HH:MM:SS" with no timezone.
  const match = rawDate.match(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/,
  );
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`;
  }

  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function srcset(list) {
  return list
    .slice()
    .sort((a, b) => a.w - b.w)
    .map((item) => `${item.url} ${item.w}w`)
    .join(", ");
}

function allSourcesExist(entry) {
  if (!entry || !entry.sources) return false;
  return ["avif", "webp", "jpg"].every((format) =>
    (entry.sources[format] || []).every((source) =>
      fs.existsSync(path.join(ROOT, source.url)),
    ),
  );
}

async function generateImage(source, rel, widths, options = {}) {
  const {
    avif = true,
    webp = true,
    jpg = true,
  } = options;

  const metadata = await sharp(source).metadata();
  const orientation = metadata.orientation || 1;
  const rotated = orientation >= 5 && orientation <= 8;
  const width = rotated ? metadata.height : metadata.width;
  const height = rotated ? metadata.width : metadata.height;
  const maxWidth = Math.max(...widths);

  const selected = Array.from(
    new Set(
      widths
        .filter((w) => w < width)
        .concat(width <= maxWidth ? [width] : []),
    ),
  ).sort((a, b) => a - b);
  if (!selected.length) selected.push(width);

  const dir = path.join(OUT, hash(rel));
  await fsp.mkdir(dir, { recursive: true });
  const base = slug(path.basename(rel));

  const formats = { avif: [], webp: [], jpg: [] };
  const tasks = [];

  for (const w of selected) {
    const stem = path.join(dir, `${base}-${w}`);
    const pipeline = () =>
      sharp(source).rotate().resize({ width: w, withoutEnlargement: true });

    if (avif) {
      tasks.push(
        pipeline()
          .avif({ quality: 52, effort: 3 })
          .toFile(`${stem}.avif`)
          .then(() =>
            formats.avif.push({ w, url: publicUrl(`${stem}.avif`) }),
          ),
      );
    }
    if (webp) {
      tasks.push(
        pipeline()
          .webp({ quality: 74, effort: 4 })
          .toFile(`${stem}.webp`)
          .then(() =>
            formats.webp.push({ w, url: publicUrl(`${stem}.webp`) }),
          ),
      );
    }
    if (jpg) {
      tasks.push(
        pipeline()
          .jpeg({ quality: 80, mozjpeg: true })
          .toFile(`${stem}.jpg`)
          .then(() =>
            formats.jpg.push({ w, url: publicUrl(`${stem}.jpg`) }),
          ),
      );
    }
  }

  await Promise.all(tasks);

  const lqipBuffer = await sharp(source)
    .rotate()
    .resize({ width: 28, withoutEnlargement: true })
    .blur(1.2)
    .webp({ quality: 28 })
    .toBuffer();

  const jpgSorted = formats.jpg.slice().sort((a, b) => a.w - b.w);
  const webpSorted = formats.webp.slice().sort((a, b) => a.w - b.w);
  const fallback =
    (jpgSorted.find((item) => item.w >= 1280) ||
      jpgSorted[jpgSorted.length - 1] ||
      webpSorted[webpSorted.length - 1] ||
      formats.avif[0])?.url || "";

  const largest = jpgSorted[jpgSorted.length - 1] || webpSorted[webpSorted.length - 1];

  return {
    type: "image",
    src: publicUrl(source),
    file: rel,
    width,
    height,
    aspect: Number((width / height).toFixed(4)),
    orientation: width > height ? "landscape" : width < height ? "portrait" : "square",
    lqip: `data:image/webp;base64,${lqipBuffer.toString("base64")}`,
    widths: selected,
    sources: {
      avif: formats.avif.sort((a, b) => a.w - b.w),
      webp: webpSorted,
      jpg: jpgSorted,
    },
    srcset: {
      avif: srcset(formats.avif),
      webp: srcset(formats.webp),
      jpg: srcset(formats.jpg),
    },
    fallback,
    full: largest?.url || fallback,
    ...(await readExif(source)),
  };
}

async function processImage(rel, widths, options) {
  const source = path.join(MEDIA, rel);
  const stamp = await fileStamp(source);
  const cached = manifest.images[rel];

  if (!FORCE && cached && cached.stamp === stamp && allSourcesExist(cached)) {
    return cached;
  }

  const started = Date.now();
  const entry = await generateImage(source, rel, widths, options);
  entry.stamp = stamp;
  manifest.images[rel] = entry;
  console.log(
    `  image  ${rel}  (${entry.widths.join("/")}px, ${Date.now() - started}ms)`,
  );
  return entry;
}

function ffprobe(source) {
  try {
    const output = execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height:format=duration",
        "-of",
        "json",
        source,
      ],
      { encoding: "utf8" },
    );
    const info = JSON.parse(output);
    const stream = info.streams?.[0] || {};
    return {
      width: stream.width || null,
      height: stream.height || null,
      duration: info.format?.duration ? Number(info.format.duration) : null,
    };
  } catch {
    return { width: null, height: null, duration: null };
  }
}

async function makePoster(rel, source) {
  if (!HAS_FFMPEG) return null;

  const dir = path.join(OUT, hash(rel), "poster");
  await fsp.mkdir(dir, { recursive: true });
  const posterPath = path.join(dir, `${slug(path.basename(rel))}.jpg`);

  try {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-ss",
        "0.3",
        "-i",
        source,
        "-frames:v",
        "1",
        "-vf",
        "scale='min(1280,iw)':-2",
        "-q:v",
        "3",
        posterPath,
      ],
      { stdio: "ignore" },
    );
  } catch {
    return null;
  }

  const poster = await generateImage(
    posterPath,
    `${rel}#poster`,
    POSTER_WIDTHS,
    { avif: false, webp: true, jpg: true },
  );
  await fsp.unlink(posterPath).catch(() => {});
  return poster;
}

async function makeWebVideo(rel, source) {
  if (!HAS_FFMPEG) return null;

  const dir = path.join(OUT, hash(rel), "video");
  await fsp.mkdir(dir, { recursive: true });
  const output = path.join(dir, `${slug(path.basename(rel))}.mp4`);

  try {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-i",
        source,
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-vf",
        "scale=w='min(960,iw)':h='min(960,ih)':force_original_aspect_ratio=decrease",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "30",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        output,
      ],
      { stdio: "ignore" },
    );
  } catch {
    return null;
  }

  return publicUrl(output);
}

async function processVideo(rel) {
  const source = path.join(MEDIA, rel);
  const stamp = await fileStamp(source);
  const cached = manifest.videos[rel];

  if (
    !FORCE &&
    cached &&
    cached.stamp === stamp &&
    (!cached.poster || allSourcesExist(cached.poster)) &&
    cached.src &&
    cached.src.includes("/_generated/") &&
    fs.existsSync(path.join(ROOT, cached.src))
  ) {
    return cached;
  }

  const started = Date.now();
  const info = ffprobe(source);
  const [poster, webVideo] = await Promise.all([
    makePoster(rel, source),
    makeWebVideo(rel, source),
  ]);

  const entry = {
    type: "video",
    src: webVideo || publicUrl(source),
    original: publicUrl(source),
    file: rel,
    width: info.width,
    height: info.height,
    aspect: info.width && info.height
      ? Number((info.width / info.height).toFixed(4))
      : 1.7778,
    duration: info.duration,
    poster,
    stamp,
  };

  manifest.videos[rel] = entry;
  console.log(
    `  video  ${rel}  (${webVideo ? "web" : "original"}, ${poster ? "poster" : "no poster"}, ${Date.now() - started}ms)`,
  );
  return entry;
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index], index);
      }
    },
  );

  await Promise.all(runners);
  return results;
}

async function main() {
  await fsp.mkdir(OUT, { recursive: true });
  manifest = await loadManifest();
  manifest.images ||= {};
  manifest.videos ||= {};

  const albums = (await fsp.readdir(MEDIA, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !EXCLUDE_DIRS.has(entry.name))
    .map((entry) => entry.name)
    .sort();

  const jobs = [];

  for (const album of albums) {
    const dir = path.join(MEDIA, album);
    const files = await fsp.readdir(dir);
    for (const file of files) {
      if (file.startsWith(".") || /\.(json|md|xmp|aae)$/i.test(file)) continue;
      const rel = `${album}/${file}`;
      if (IMAGE_RE.test(file)) {
        jobs.push(() => processImage(rel, GALLERY_WIDTHS));
      } else if (VIDEO_RE.test(file)) {
        jobs.push(() => processVideo(rel));
      }
    }
  }

  if (fs.existsSync(HERO_SRC)) {
    jobs.push(async () => {
      const hero = await processImage("my_landscape_photo.jpg", HERO_WIDTHS);
      manifest.hero = hero;
    });
  }

  console.log(
    `Building ${jobs.length} media item${jobs.length === 1 ? "" : "s"}${FORCE ? " (forced)" : ""}…`,
  );

  await mapLimit(jobs, 3, (job) => job());

  // Drop manifest entries whose source files disappeared.
  for (const key of Object.keys(manifest.images)) {
    if (!fs.existsSync(path.join(MEDIA, key))) delete manifest.images[key];
  }
  for (const key of Object.keys(manifest.videos)) {
    if (!fs.existsSync(path.join(MEDIA, key))) delete manifest.videos[key];
  }
  if (manifest.hero && !fs.existsSync(HERO_SRC)) manifest.hero = null;

  manifest.generatedAt = new Date().toISOString();

  const tempPath = `${MANIFEST_PATH}.tmp`;
  await fsp.writeFile(tempPath, JSON.stringify(manifest, null, 2));
  await fsp.rename(tempPath, MANIFEST_PATH);

  console.log(
    `Done. ${Object.keys(manifest.images).length} images, ${Object.keys(manifest.videos).length} videos.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

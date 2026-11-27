#!/usr/bin/env node
/**
 * Add a photo to the gallery.
 *
 *   npm run new:photo -- ~/Desktop/IMG_1234.jpg "2025-03 Manali"
 *   npm run new:photo -- photo.jpg 2025-03
 *
 * The first argument is the image, the second is the album folder. If the album
 * contains a date prefix (2025-03) and extra words, the words become the title.
 */

const fs = require("fs");
const path = require("path");
const exifr = require("exifr");

const args = process.argv.slice(2);
const source = args[0];

if (!source) {
  console.error('Usage: npm run new:photo -- <image> ["YYYY-MM Title"]');
  process.exit(1);
}

if (!fs.existsSync(source)) {
  console.error(`File not found: ${source}`);
  process.exit(1);
}

if (!/\.(jpe?g|png|webp|avif|tiff?)$/i.test(source)) {
  console.error("Supported formats: jpg, jpeg, png, webp, avif, tif, tiff.");
  process.exit(1);
}

const now = new Date();
const fallbackAlbum = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const albumArg = (args[1] || fallbackAlbum).trim();
const [folderToken, ...titleWords] = albumArg.split(/\s+/);
const folder = folderToken;
const mediaDir = path.join(__dirname, "..", "media", folder);
const fileName = path.basename(source);
const destination = path.join(mediaDir, fileName);

if (fs.existsSync(destination)) {
  console.error(`That photo already exists: media/${folder}/${fileName}`);
  process.exit(1);
}

fs.mkdirSync(mediaDir, { recursive: true });
fs.copyFileSync(source, destination);

const albumJsonPath = path.join(mediaDir, "album.json");
const captionsPath = path.join(mediaDir, "captions.json");

const titleFromFolder = folder.replace(/^(\d{4})-(\d{2})/, (match, year, month) => {
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
});

const title = titleWords.length
  ? `${titleFromFolder} — ${titleWords.join(" ")}`
  : titleFromFolder;

if (!fs.existsSync(albumJsonPath)) {
  const datePrefix = folder.match(/^(\d{4})-(\d{2})/);
  const album = {
    title,
    date: datePrefix ? `${datePrefix[1]}-${datePrefix[2]}-01` : "",
    location: "",
    description: "",
  };
  fs.writeFileSync(albumJsonPath, `${JSON.stringify(album, null, 2)}\n`);
}

if (!fs.existsSync(captionsPath)) {
  fs.writeFileSync(captionsPath, "{}\n");
}

(async () => {
  let dateLabel = "";
  try {
    const exif = await exifr.parse(destination, {
      pick: ["DateTimeOriginal", "CreateDate"],
      reviveValues: true,
    });
    const date = exif?.DateTimeOriginal || exif?.CreateDate;
    if (date instanceof Date) {
      dateLabel = date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  } catch (error) {}

  console.log(`\nAdded media/${folder}/${fileName}`);
  if (dateLabel) console.log(`Captured: ${dateLabel}`);
  console.log("\nNext:");
  console.log(`  1. Edit media/${folder}/album.json for a title and location.`);
  console.log(`  2. Add a caption for "${fileName}" in media/${folder}/captions.json.`);
  console.log("  3. Run `npm run images` (or just `npm run serve`).\n");
})();

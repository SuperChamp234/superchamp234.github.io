const fs = require("fs");
const path = require("path");

const manifestPath = path.join(
  __dirname,
  "..",
  "media",
  "_generated",
  "manifest.json",
);

let manifest = { images: {}, videos: {}, hero: null };

try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch {
  console.warn(
    "[images] No manifest found. Run `npm run images` before building the site.",
  );
}

module.exports = manifest;

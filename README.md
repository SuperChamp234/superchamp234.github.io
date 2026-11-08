# Zain Siddavatam — zainsv.me

Personal site for notes on computer architecture, hardware verification, and photography. Built with Eleventy, plain CSS, and a build-time image pipeline. Light mode only.

## Quick start

```bash
npm install
npm run serve      # build images, start Eleventy at http://localhost:8080
npm run build      # production build into _site/
```

`npm run serve` and `npm run build` run the image optimizer first, so new photos work without a separate step.

## Writing a post

```bash
npm run new:post -- "Verifying a RISC-V core"
```

This creates `posts/verifying-a-risc-v-core.md` with front matter. Edit the description, write the body, and preview with `npm run serve`.

Post front matter:

```yaml
---
title: "Verifying a RISC-V core"
description: "One-line summary used on the blog index and in search results."
date: 2026-02-14
tags:
  - verification
---
```

Posts are Markdown. Code blocks get Prism highlighting, tables are wrapped for horizontal scrolling, and external links open in a new tab. Drafts are hidden with `draft: true`.

## Adding photos

Put a photo in an album folder and run the build:

```bash
npm run new:photo -- ~/Desktop/IMG_1234.jpg "2025-03 Manali"
npm run serve
```

Or copy files into `media/<album>/` manually and run `npm run images`.

### Gallery folders

```
media/
  2025-01/              # album folder; a YYYY-MM prefix gives it a date
    album.json          # optional album title, date, location, description
    captions.json       # optional captions keyed by filename
    PXL_....jpg
    PXL_....jpg.md      # optional per-photo sidecar (caption, note, date, alt)
    PXL_....mp4
```

`album.json`:

```json
{
  "title": "January 2025",
  "date": "2025-01-01",
  "location": "Himachal Pradesh",
  "description": "Snow, roads, and a lot of tea.",
  "cover": "PXL_20250108_111001640.MP.jpg"
}
```

`captions.json`:

```json
{
  "PXL_20250108_111001640.MP.jpg": "Qutub Minar at golden hour"
}
```

A sidecar can hold a longer note and override EXIF data:

```markdown
---
caption: "The last light on the ridge"
date: 2025-01-09
location: "Kasol, Himachal Pradesh"
alt: "Snowy ridge at sunset"
---

A short story about the frame. It appears under the caption in the photo book.
```

Captions are resolved in this order: sidecar `caption` → `captions.json` → EXIF/date. Dates come from sidecar → EXIF → filename → album folder. Videos are supported (`.mp4`, `.webm`, `.mov`, `.m4v`, `.ogg`) and get generated poster images when `ffmpeg` is available.

### Image pipeline

`scripts/build-images.js` scans `media/` and writes responsive AVIF, WebP, and JPEG derivatives plus tiny inline LQIP placeholders into `media/_generated/` (gitignored). Results are cached by source-file hash. Videos are transcoded to web-friendly H.264 MP4s (max 960px, faststart) and get poster images when `ffmpeg` is available.

```bash
npm run images        # incremental
npm run images:force  # rebuild everything
```

The generated `manifest.json` powers the homepage hero, gallery, and Open Graph images. The hero source is `media/my_landscape_photo.jpg`; change `HERO_SRC` in the script if the hero moves.

Gallery originals stay out of `_site`; the site serves the generated derivatives (the 1920px JPEG is the full-size view). Images used directly in posts live in `media/blog/` and are copied as-is.

## Gallery views

The gallery opens as a one-photo-at-a-time scroll-snap book on phones and as a justified grid on larger screens. Visitors can switch views with the Book/Grid control; the choice is remembered only after they explicitly switch. Book frames support arrow keys, Page Up/Down, Home, and End. Clicking a frame opens a lightbox with keyboard and swipe navigation.

Deep links work:

```
/gallery/?view=book#photo-2025-01-pxl-20250114-175101271-raw-01-cover
```

## Design directions

The site currently ships with three previewable directions: `scrapbook` (cream paper, serif display, rust ink, a pasted-on photo), `weblog` (pale blue page, white modules, Verdana, classic underlined links), and `web20` (blue chrome, rounded white cards, glossy buttons). Open the **Preview** tab in the bottom-left corner, or add `?theme=weblog` to any URL. Remove `_includes/theme-switcher.njk` and the theme block in `js/site.js` once a direction is chosen.

Design tokens live at the top of `css/main.css`. Page-specific styles are in `css/gallery.css`, `css/prism.css`, and `css/resume.css`.

## Resume

The resume is compiled from LaTeX during deployment:

```bash
cd resume
./compile.sh
```

This generates `_includes/resume_content.njk` and, when `pdflatex` is available, the PDF. The PDF button only appears when `resume/resume.pdf` exists. The deploy workflow installs Pandoc and TeX Live and runs the same script before `npm run build`.

## Deployment

Pushes to `master` deploy to GitHub Pages via `.github/workflows/deploy.yml`. The workflow pulls Git LFS media, restores the generated-image cache, compiles the resume, builds the site, and publishes `_site/`.

## Configuration

- `_data/site.json` — title, description, URL, email, gallery blurb.
- `_data/homepage.json` — hero copy, typed strings, current activities, social links.
- `_data/hero.js` — generated hero image data.
- `_data/gallery.js` — reads `media/` and the generated manifest.

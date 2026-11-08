#!/usr/bin/env node
/**
 * Create a new blog post.
 *
 *   npm run new:post -- "Verifying a RISC-V core"
 */

const fs = require("fs");
const path = require("path");

const title = process.argv.slice(2).join(" ").trim();

if (!title) {
  console.error('Usage: npm run new:post -- "Your post title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-");

const filePath = path.join(__dirname, "..", "posts", `${slug}.md`);

if (fs.existsSync(filePath)) {
  console.error(`A post already exists at posts/${slug}.md`);
  process.exit(1);
}

const date = new Date().toISOString();
const escapedTitle = title.replace(/"/g, '\\"');

const content = `---
title: "${escapedTitle}"
description: ""
date: ${date}
tags:
  - post
---

`;

fs.writeFileSync(filePath, content, "utf8");

console.log(`\nCreated posts/${slug}.md`);
console.log("Next:");
console.log("  1. Add a description in the front matter.");
console.log("  2. Write the post.");
console.log("  3. Run `npm run serve` to preview.\n");

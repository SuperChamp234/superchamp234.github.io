const fs = require("fs");
const path = require("path");

// Get the current date and time in ISO format
const date = new Date().toISOString();

// Get the title from the command line arguments
const title = process.argv[2];
if (!title) {
  console.error("Please provide a title for the new post.");
  process.exit(1);
}

// Convert the title to a sanitized filename (lowercase, spaces to dashes, remove special characters)
const filename = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
  .replace(/\s+/g, "-") + ".md";

// Define the file path
const filePath = path.join(__dirname, "posts", filename);

// Define the YAML front matter
const content = `---
title: ${title}
layout: post
date: ${date}
tags:
  - blog
---
`;

// Write the file
fs.writeFileSync(filePath, content, "utf8");
console.log(`New post created: ${filePath}`);
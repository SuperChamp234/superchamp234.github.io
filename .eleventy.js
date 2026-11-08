const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItPrism = require("markdown-it-prism");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("robots.txt");

  // Serve optimized derivatives and the images used directly in posts. Gallery
  // originals stay local; the generated 1920px JPEG is the full-size view.
  eleventyConfig.addPassthroughCopy({
    "media/_generated": "media/_generated",
    "media/blog": "media/blog",
    "media/celeste-finish.jpeg": "media/celeste-finish.jpeg",
  });

  // Files that are only used as local tooling / source templates.
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("resume/custom-template.html");

  // Nunjucks has no `slice`/`limit` filter; use `| limit(n)` in templates.
  eleventyConfig.addFilter("limit", (items, count) =>
    Array.isArray(items) ? items.slice(0, count) : [],
  );

  // ---------------------------------------------------------------- dates
  eleventyConfig.addFilter("formatDate", (dateObj) =>
    DateTime.fromJSDate(dateObj).toISODate(),
  );

  eleventyConfig.addFilter("readableDate", (dateObj) =>
    DateTime.fromJSDate(dateObj).toFormat("d LLLL yyyy"),
  );

  eleventyConfig.addFilter("blogDate", (dateObj) =>
    DateTime.fromJSDate(dateObj).toFormat("dd LLL"),
  );

  eleventyConfig.addFilter("htmlDateString", (dateObj) =>
    DateTime.fromJSDate(dateObj).toISO({ suppressMilliseconds: true }),
  );

  eleventyConfig.addFilter("year", (dateObj) =>
    DateTime.fromJSDate(dateObj).toFormat("yyyy"),
  );

  // Format date for sitemap
  eleventyConfig.addFilter("sitemapDateString", (dateObj) => {
    const dt = DateTime.fromJSDate(dateObj);
    if (!dt.isValid) {
      return "";
    }
    return dt.toISO();
  });

  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    try {
      return new URL(url, base).toString();
    } catch {
      return url;
    }
  });

  // ------------------------------------------------------------ collections
  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi
      .getFilteredByTag("post")
      .filter((post) => post.data.draft !== true)
      .sort((a, b) => b.date - a.date),
  );

  // Get all content, for creating the sitemap
  eleventyConfig.addCollection("sitemapContent", function (collectionApi) {
    return collectionApi.getAll();
  });

  eleventyConfig.addFilter("groupByYear", (posts) => {
    const groups = new Map();
    for (const post of posts) {
      const year = DateTime.fromJSDate(post.date).toFormat("yyyy");
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(post);
    }
    return Array.from(groups, ([year, items]) => ({ year, posts: items }));
  });

  eleventyConfig.addFilter("postNeighbors", (posts, url) => {
    const index = posts.findIndex((post) => post.url === url);
    return {
      previous: index > 0 ? posts[index - 1] : null,
      next: index >= 0 && index < posts.length - 1 ? posts[index + 1] : null,
    };
  });

  // ------------------------------------------------------------- text utils
  const plainText = (content) =>
    String(content || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  eleventyConfig.addFilter("readingTime", (content) => {
    const words = plainText(content).split(" ").filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  });

  eleventyConfig.addFilter("excerpt", (content, length = 160) => {
    const text = plainText(content);
    if (text.length <= length) return text;
    return `${text.slice(0, length).trim()}…`;
  });

  eleventyConfig.addFilter("plainText", plainText);

  // ------------------------------------------------------------- global data
  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());
  eleventyConfig.addGlobalData("buildDate", () =>
    DateTime.now().toFormat("d LLLL yyyy"),
  );

  eleventyConfig.addGlobalData("resumeAvailable", () => {
    const resume = path.join(__dirname, "_includes", "resume_content.njk");
    try {
      return fs.statSync(resume).size > 200;
    } catch {
      return false;
    }
  });

  eleventyConfig.addGlobalData("resumePdfAvailable", () =>
    fs.existsSync(path.join(__dirname, "resume", "resume.pdf")),
  );

  // ------------------------------------------------------------- markdown
  const markdownOptions = {
    html: true,
    breaks: true,
    linkify: true,
  };
  const markdownLib = new markdownIt(markdownOptions);

  markdownLib.use(markdownItPrism);

  // Add div around tables
  markdownLib.renderer.rules.table_open = () =>
    '<div class="table-wrapper">\n<table>\n';
  markdownLib.renderer.rules.table_close = () => "</table>\n</div>";

  const defaultImageRule = markdownLib.renderer.rules.image;
  markdownLib.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    token.attrSet("loading", "lazy");
    token.attrSet("decoding", "async");
    return defaultImageRule(tokens, idx, options, env, self);
  };

  const defaultLinkOpen =
    markdownLib.renderer.rules.link_open ||
    ((tokens, idx, options, env, self) =>
      self.renderToken(tokens, idx, options));
  markdownLib.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet("href") || "";
    if (/^https?:\/\//i.test(href)) {
      tokens[idx].attrSet("target", "_blank");
      tokens[idx].attrSet("rel", "noopener noreferrer");
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  eleventyConfig.setLibrary("md", markdownLib);

  return {
    dir: {
      output: "_site",
    },
  };
};

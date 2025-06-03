const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItPrism = require("markdown-it-prism");

module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("media");
    eleventyConfig.addPassthroughCopy("js");
    eleventyConfig.addPassthroughCopy("robots.txt");

    eleventyConfig.addFilter("formatDate", (dateObj) => {
        return DateTime.fromJSDate(dateObj).toISODate();
    });     

    // Format date for sitemap
    eleventyConfig.addFilter("sitemapDateString", (dateObj) => {
        const dt = DateTime.fromJSDate(dateObj);
        if (!dt.isValid) {
            return '';
        }
        return dt.toISO();
    });

    // Get all content, for creating the sitemap
    eleventyConfig.addCollection("sitemapContent", function(collectionApi) {
        return collectionApi.getAll();
    });

    let markdownOptions = {
        html: true,
        breaks: true,
        linkify: true
    };
    let markdownLib = new markdownIt(markdownOptions);

    // Add Prism.js syntax highlighting
    markdownLib.use(markdownItPrism);

    //Add div around tables
    markdownLib.renderer.rules.table_open = () => '<div class="table-wrapper">\n<table>\n',
    markdownLib.renderer.rules.table_close = () => '</table>\n</div>',

    eleventyConfig.setLibrary("md", markdownLib);

    return {
        dir: {
            output: "_site"
        }
    };
};
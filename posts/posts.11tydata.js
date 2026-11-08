module.exports = {
    layout: "post.njk",
    pageStyles: ["/css/prism.css"],
    eleventyComputed: {
      title: data => data.title || data.page.filePathStem.split('/').pop(),
      description: data => data.description || data.page.excerpt || "Article by Zain Siddavatam",
      image: data => data.image || null,
      tags: data => {
        const existingTags = data.tags || [];
        if (!existingTags.includes('post')) {
          existingTags.push('post');
        }
        return existingTags;
      }
    }
};

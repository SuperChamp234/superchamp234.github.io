const fs = require("fs");
const path = require("path");

const galleryPath = "./media";

function getGalleryData() {
  const months = fs.readdirSync(galleryPath).filter((folder) => 
    fs.statSync(path.join(galleryPath, folder)).isDirectory()
  );

  return months.map((month) => {
    const files = fs.readdirSync(path.join(galleryPath, month));

    const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => `/media/${month}/${file}`);

    const videos = files.filter(file => /\.(mp4|webm|ogg)$/i.test(file))
      .map(file => `/media/${month}/${file}`);

    return { month, images, videos };
  }).reverse(); // Newest first
}

module.exports = getGalleryData();

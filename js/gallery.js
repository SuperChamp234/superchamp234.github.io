document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery JS Loaded!');
  const lazyImages = document.querySelectorAll('img.lazy');

  const lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;  // Replace with full image
        img.classList.remove('lazy');
        lazyObserver.unobserve(img);
      }
    });
  });

  function shuffleGallery() {
    const galleryGrid = document.querySelector('.gallery-grid');
    const items = Array.from(galleryGrid.children);

    // Shuffle array
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    // Append shuffled items back into the grid
    items.forEach(item => galleryGrid.appendChild(item));
  }

  shuffleGallery();

  lazyImages.forEach(img => lazyObserver.observe(img));

  function createLightbox(content) {
    const lightbox = document.createElement('div');
    lightbox.classList.add('lightbox');
    lightbox.innerHTML = content;

    document.body.appendChild(lightbox);
    setTimeout(() => lightbox.classList.add('show'), 10);  // Smooth transition

    // Click outside media to close the lightbox
    lightbox.addEventListener('click', function(event) {
      if (event.target !== this) return;
      lightbox.classList.remove('show');
      setTimeout(() => document.body.removeChild(lightbox), 300);
    });

    console.log('Lightbox created:', lightbox);
  }

  // Handle Image Clicks
  document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('Image clicked:', this.src);
      createLightbox(`<img src="${this.src}" alt="Expanded view">`);
    });
  });

  // Handle Video Clicks
  document.querySelectorAll('.gallery-item').forEach(item => {
    const video = item.querySelector('video');
    if (!video) return;

    // Remove controls initially
    video.removeAttribute('controls');

    // Create video play overlay icon
    const playIcon = document.createElement('div');
    playIcon.classList.add('video-overlay');
    playIcon.innerHTML = '▶';
    item.appendChild(playIcon);

    item.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('Video clicked:', video.querySelector('source').src);

      createLightbox(`
                <video controls autoplay>
                    <source src="${
          video.querySelector('source').src}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>`);
    });
  });
});

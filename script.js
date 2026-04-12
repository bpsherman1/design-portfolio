/* ========================================
   Scroll Reveal Animations
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  const reveals = document.querySelectorAll('.reveal, .reveal-stagger');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));

  // Close mobile nav when clicking a link
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.remove('sidebar--open');
    });
  });

  /* ========================================
     Lightbox
     ======================================== */

  // Build the lightbox DOM
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox__close">&times;</button>
    <div class="lightbox__info"></div>
    <button class="lightbox__arrow lightbox__arrow--left">&#8592;</button>
    <button class="lightbox__arrow lightbox__arrow--right">&#8594;</button>
    <img class="lightbox__img" src="" alt="">
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector('.lightbox__img');
  const lbInfo = lightbox.querySelector('.lightbox__info');
  const lbClose = lightbox.querySelector('.lightbox__close');
  const lbLeft = lightbox.querySelector('.lightbox__arrow--left');
  const lbRight = lightbox.querySelector('.lightbox__arrow--right');

  let currentImages = [];
  let currentIndex = 0;
  let currentProjectName = '';

  function getProjectName(img) {
    // Walk up to find the project section
    let el = img.closest('.project') || img.closest('.poster-mosaic');
    if (!el) return 'Gallery';

    // Check for a project title
    const title = el.querySelector('.project__title');
    if (title) return title.textContent.trim();

    // For mosaic gallery, try to figure out from alt text
    return 'Gallery';
  }

  function getProjectImages(img) {
    // Find all images in the same project section
    let container = img.closest('.project') || img.closest('.poster-mosaic');
    if (!container) return [img];

    const imgs = Array.from(container.querySelectorAll('img'));
    // Filter out images inside HTML comments (shouldn't exist in DOM, but just in case)
    return imgs.filter(i => i.src && !i.closest('[style*="display:none"]'));
  }

  function openLightbox(img) {
    currentImages = getProjectImages(img);
    currentIndex = currentImages.indexOf(img);
    if (currentIndex === -1) currentIndex = 0;
    currentProjectName = getProjectName(img);

    updateLightbox();
    lightbox.classList.add('lightbox--open');
    document.body.style.overflow = 'hidden';
  }

  function updateLightbox() {
    const img = currentImages[currentIndex];
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbInfo.textContent = currentProjectName + '  ' + (currentIndex + 1) + ' / ' + currentImages.length;

    // Hide arrows if only one image
    lbLeft.style.display = currentImages.length > 1 ? '' : 'none';
    lbRight.style.display = currentImages.length > 1 ? '' : 'none';
  }

  function closeLightbox() {
    lightbox.classList.remove('lightbox--open');
    document.body.style.overflow = '';
  }

  function navigate(dir) {
    currentIndex = (currentIndex + dir + currentImages.length) % currentImages.length;
    updateLightbox();
  }

  // Click any image on the page to open lightbox
  document.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;

    // Skip images in the sidebar, nav, or lightbox itself
    if (img.closest('.sidebar') || img.closest('.lightbox') || img.closest('.home-card')) return;

    e.preventDefault();
    openLightbox(img);
  });

  lbClose.addEventListener('click', closeLightbox);
  lbLeft.addEventListener('click', () => navigate(-1));
  lbRight.addEventListener('click', () => navigate(1));

  // Click backdrop to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('lightbox--open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  /* ========================================
     Gallery Hover Effect
     ======================================== */
  const mosaic = document.querySelector('.poster-mosaic');
  if (mosaic) {
    const mosaicImgs = mosaic.querySelectorAll('img');

    mosaicImgs.forEach(img => {
      img.addEventListener('mouseenter', () => {
        mosaic.classList.add('poster-mosaic--hovering');
        img.classList.add('poster-mosaic__img--active');
      });

      img.addEventListener('mouseleave', () => {
        mosaic.classList.remove('poster-mosaic--hovering');
        img.classList.remove('poster-mosaic__img--active');
      });
    });
  }
});

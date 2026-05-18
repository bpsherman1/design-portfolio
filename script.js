/* ========================================
   Service Worker (PWA)
   ======================================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

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

  // Float-up reveal (homepage intro)
  const floats = document.querySelectorAll('.reveal-float');
  const floatObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-float--visible');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  floats.forEach(el => floatObserver.observe(el));

  /* ========================================
     Mobile Nav: open / close UX
     ======================================== */
  const sidebar = document.querySelector('.sidebar');
  const navToggle = document.querySelector('.nav-toggle');

  // Backdrop scrim — clickable area to close, visual cue that nav is open
  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  document.body.appendChild(backdrop);

  function openNav() {
    sidebar.classList.add('sidebar--open');
    backdrop.classList.add('sidebar-backdrop--visible');
    if (navToggle) navToggle.classList.add('nav-toggle--open');
  }
  function closeNav() {
    sidebar.classList.remove('sidebar--open');
    backdrop.classList.remove('sidebar-backdrop--visible');
    if (navToggle) navToggle.classList.remove('nav-toggle--open');
  }

  // Replace the inline onclick toggle with a real handler
  if (navToggle) {
    navToggle.removeAttribute('onclick');
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.contains('sidebar--open') ? closeNav() : openNav();
    });
  }

  // Close on link click
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on backdrop tap
  backdrop.addEventListener('click', closeNav);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('sidebar--open')) {
      closeNav();
    }
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
    lbImg.src = img.dataset.full || img.src;
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

    // Skip images in the sidebar, nav, lightbox, project switcher buttons, or
    // brand-book PDF slices (Ctown / RiverBank — they're stitched pages, not
    // standalone artworks, so they shouldn't open in the lightbox).
    if (img.closest('.sidebar') || img.closest('.lightbox') || img.closest('.home-card') || img.closest('.project-switcher') || img.classList.contains('img-full--book')) return;

    e.preventDefault();
    openLightbox(img);
  });

  lbClose.addEventListener('click', closeLightbox);
  lbLeft.addEventListener('click', () => navigate(-1));
  lbRight.addEventListener('click', () => navigate(1));

  /* ── Mobile: swipe + edge-tap navigation
     Arrow buttons are hidden on phones (CSS), so swiping or tapping the
     left/right edge navigates between images. Center-tap on the backdrop
     still closes; the close button is excluded from these gestures. */
  const isMobileLightbox = () => window.matchMedia('(max-width: 768px)').matches;
  let touchStartX = 0;
  let touchStartY = 0;
  let didSwipe = false;
  const SWIPE_THRESHOLD = 50;

  lightbox.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    didSwipe = false;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    if (!lightbox.classList.contains('lightbox--open')) return;
    if (currentImages.length < 2) return;
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      navigate(dx > 0 ? -1 : 1); // swipe right = prev, swipe left = next
      didSwipe = true;
    }
  }, { passive: true });

  lightbox.addEventListener('click', (e) => {
    // Suppress the synthetic click that fires after a swipe
    if (didSwipe) { didSwipe = false; return; }
    // Never intercept the close button or info badge
    if (e.target.closest('.lightbox__close, .lightbox__info, .lightbox__arrow')) return;

    // Mobile: tap left/right edge navigates
    if (isMobileLightbox() && currentImages.length > 1) {
      const w = window.innerWidth;
      const x = e.clientX;
      if (x < w * 0.22) { navigate(-1); return; }
      if (x > w * 0.78) { navigate(1);  return; }
    }

    // Default: tapping the backdrop (not the image) closes
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation (desktop)
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('lightbox--open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  /* ========================================
     Project Switcher
     Used on branding.html and rebranding.html. Each switcher tabs between
     projects on the same page — only one project's case study is rendered
     at a time. The switcher is reusable: it discovers its own buttons and
     the project sections in the surrounding container at runtime, so the
     same DOM pattern works for any number of projects.
     ======================================== */
  document.querySelectorAll('.project-switcher').forEach(switcher => {
    const buttons = Array.from(switcher.querySelectorAll('.project-switcher__btn'));
    if (buttons.length === 0) return;

    const container = switcher.closest('.main__inner') || document;
    const projects = Array.from(container.querySelectorAll('[data-project-id]'));

    const activate = (target, { scrollToSwitcher = false } = {}) => {
      buttons.forEach(btn => {
        btn.classList.toggle('project-switcher__btn--active', btn.dataset.project === target);
        btn.setAttribute('aria-pressed', String(btn.dataset.project === target));
      });
      projects.forEach(p => {
        const isActive = p.dataset.projectId === target;
        p.hidden = !isActive;
        // Bypass the IntersectionObserver fade-in for switched-in content
        // so the case study appears immediately rather than waiting for scroll.
        if (isActive) p.classList.add('visible');
      });
      if (scrollToSwitcher) {
        switcher.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        activate(btn.dataset.project, { scrollToSwitcher: true });
      });
    });

    // Initialize: first button is the default active project
    activate(buttons[0].dataset.project);
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

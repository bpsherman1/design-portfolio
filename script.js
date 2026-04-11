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
});

(function (window, document) {
  'use strict';

  const nav = document.getElementById('nav');
  const toggle = document.getElementById('ham');
  const menu = document.getElementById('mobMenu');

  if (!nav) return;

  function syncScrolled() {
    nav.classList.toggle('scrolled', window.scrollY > 55);
  }

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  window.closeM = closeMenu;

  syncScrolled();
  window.addEventListener('scroll', syncScrolled, { passive: true });

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth > 880) closeMenu();
  });

  document.addEventListener('click', function (event) {
    if (!menu || !menu.classList.contains('open')) return;
    if (nav.contains(event.target)) return;
    closeMenu();
  });
})(window, document);

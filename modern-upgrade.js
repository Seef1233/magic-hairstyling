/* ═══════════════════════════════════════════════════
   MODERN UPGRADE JS — Magic Hairstyling
═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ──────────────────────────────
     SCROLL REVEAL
  ────────────────────────────── */
  function initReveal() {
    var selectors = [
      '.sec-head', '.section-head',
      '.tar-card', '.rev-card',
      '.value-box', '.feature-card',
      '.svc-card', '.d-card',
      '.port-item',
      '.addr-card', '.qs-btn',
      '.about-copy',
      '.c-grid > *',
      '.foot-brand', '.foot-col',
      '.page-hero .eyebrow',
      '.page-hero p',
      '.hero-actions'
    ];

    var all = document.querySelectorAll(selectors.join(','));

    all.forEach(function (el) {
      /* Skip elements already in the viewport on load (above fold) */
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) return;

      el.classList.add('mu-reveal');

      /* Stagger siblings inside same parent */
      var siblings = Array.from(el.parentElement.children).filter(function (c) {
        return c.classList.contains('mu-reveal');
      });
      var idx = siblings.indexOf(el);
      if (idx >= 1 && idx <= 4) {
        el.classList.add('mu-reveal-d' + idx);
      }
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('mu-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

    document.querySelectorAll('.mu-reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ──────────────────────────────
     BUTTON RIPPLE
  ────────────────────────────── */
  function initRipple() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn-gold, .nav-btn');
      if (!btn) return;

      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement('span');
      ripple.className = 'mu-ripple';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top  = (e.clientY - rect.top)  + 'px';
      btn.style.position = btn.style.position || 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', function () {
        ripple.remove();
      });
    });
  }

  /* ──────────────────────────────
     NAVBAR SHRINK ON SCROLL
  ────────────────────────────── */
  function initNavShrink() {
    var nav = document.getElementById('nav');
    if (!nav) return;

    function onScroll() {
      nav.classList.toggle('mu-shrunk', window.scrollY > 70);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ──────────────────────────────
     GOLD SHIMMER ON HERO TITLE
  ────────────────────────────── */
  function initHeroShimmer() {
    var heroTitle = document.querySelector('.slide-title, .slide-content h1');
    if (!heroTitle) return;
    var span = heroTitle.querySelector('span');
    if (span) span.classList.add('mu-gold-shimmer');
  }

  /* ──────────────────────────────
     INIT
  ────────────────────────────── */
  function init() {
    initReveal();
    initRipple();
    initNavShrink();
    initHeroShimmer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

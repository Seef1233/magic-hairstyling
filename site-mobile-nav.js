(function (window, document) {
  'use strict';

  const body = document.body;
  if (!body || !body.dataset || !body.dataset.page) return;
  if (document.querySelector('.mob-bottom-nav')) return;

  const page = body.dataset.page;
  const isIndex = page === 'index';
  const bookingLandingHref = 'index.html?booking=1#contact';
  const bookHref = isIndex ? '#' : bookingLandingHref;
  const homeHref = isIndex ? '#hero' : 'index.html';
  const servicesHref = isIndex ? '#diensten' : 'index.html#diensten';
  const pricingHref = page === 'tarieven' ? 'tarieven.html' : 'tarieven.html';
  const contactHref = 'contact.html';

  const nav = document.createElement('nav');
  nav.className = 'mob-bottom-nav';
  nav.setAttribute('aria-label', 'Mobile navigation');
  nav.innerHTML = [
    '<div class="mob-bottom-nav-inner">',
    '<a href="' + homeHref + '" class="mob-bnav-item" data-bnav="home">',
    '<i class="fas fa-home"></i>',
    '<span data-i18n="nav.home">Home</span>',
    '</a>',
    '<a href="' + servicesHref + '" class="mob-bnav-item" data-bnav="services">',
    '<i class="fas fa-scissors"></i>',
    '<span data-i18n="nav.services">Diensten</span>',
    '</a>',
    '<a href="' + bookHref + '" class="mob-bnav-item bnav-book" data-bnav="book">',
    '<i class="fas fa-calendar-check"></i>',
    '<span data-i18n="nav.book">Afspraak maken</span>',
    '</a>',
    '<a href="' + pricingHref + '" class="mob-bnav-item" data-bnav="pricing">',
    '<i class="fas fa-tag"></i>',
    '<span data-i18n="nav.pricing">Tarieven</span>',
    '</a>',
    '<a href="' + contactHref + '" class="mob-bnav-item" data-bnav="contact">',
    '<i class="fas fa-map-marker-alt"></i>',
    '<span data-i18n="nav.contact">Contact</span>',
    '</a>',
    '</div>'
  ].join('');

  document.body.appendChild(nav);

  if (isIndex) {
    const bookButton = nav.querySelector('[data-bnav="book"]');
    if (bookButton && typeof window.openAfspraakModal === 'function') {
      bookButton.addEventListener('click', function (event) {
        event.preventDefault();
        window.openAfspraakModal();
      });
    }
  }

  function markActive() {
    nav.querySelectorAll('.mob-bnav-item').forEach(function (item) {
      item.classList.remove('active');
    });

    if (page === 'tarieven') {
      const pricingItem = nav.querySelector('[data-bnav="pricing"]');
      if (pricingItem) pricingItem.classList.add('active');
      return;
    }

    if (page === 'contact') {
      const contactItem = nav.querySelector('[data-bnav="contact"]');
      if (contactItem) contactItem.classList.add('active');
      return;
    }

    if (!isIndex) return;

    const hash = window.location.hash || '#hero';
    let activeKey = 'home';
    if (hash === '#diensten') activeKey = 'services';
    if (hash === '#contact') activeKey = 'contact';
    const activeItem = nav.querySelector('[data-bnav="' + activeKey + '"]');
    if (activeItem) activeItem.classList.add('active');
  }

  markActive();
  window.addEventListener('hashchange', markActive);
})(window, document);

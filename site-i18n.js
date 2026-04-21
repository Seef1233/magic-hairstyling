(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'magic-hairstyling-language';
  const DEFAULT_LANG = 'nl';
  const SUPPORTED_LANGS = ['nl', 'en'];
  const FALLBACK_PAGE = 'index';
  const TRANSLATIONS_PATH = 'translations.json';

  const SWITCHER_CSS = `
    .lang-switcher {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px;
      border-radius: 999px;
      border: 1px solid rgba(201, 168, 76, .2);
      background: rgba(255, 255, 255, .04);
      backdrop-filter: blur(10px);
      flex-shrink: 0;
    }
    .lang-btn {
      border: 0;
      background: transparent;
      color: rgba(255, 255, 255, .72);
      padding: 8px 12px;
      border-radius: 999px;
      cursor: pointer;
      font-family: 'Montserrat', sans-serif;
      font-size: .76rem;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
      transition: all .2s ease;
    }
    .lang-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, .08);
    }
    .lang-btn.active {
      background: var(--gold, #c9a84c);
      color: var(--dark, #0f0f0f);
    }
    .topbar-inner .lang-switcher {
      margin-left: auto;
    }
    #nav .lang-switcher {
      margin-left: auto;
      margin-right: 10px;
    }
    .mob-menu .lang-switcher {
      width: fit-content;
      margin-top: 4px;
      margin-bottom: 6px;
    }
    @media (max-width: 900px) {
      .topbar-inner .lang-switcher {
        margin-left: 0;
      }
    }
    @media (max-width: 768px) {
      #nav .lang-switcher {
        margin-right: 0;
      }
      .lang-btn {
        padding: 7px 10px;
        font-size: .72rem;
      }
    }
  `;
  const PRESET_MAP = {
    common: [
      { selector: '#footer .foot-bottom p:first-child', key: 'footer.rights', mode: 'html' },
      { selector: '#footer .foot-bottom p:last-child', key: 'footer.metaLine', mode: 'html' }
    ],
    'werken-bij-ons': [
      { selector: '#solliciteren .apply-form > .field:last-of-type > label:first-child', key: 'form.cvLabel', mode: 'html' },
      { selector: '#cvLabel', key: 'form.cvUpload', mode: 'html' }
    ]
  };

  let translations = null;
  let currentLang = normalizeLang(readStoredLang()) || DEFAULT_LANG;

  function normalizeLang(value) {
    const lang = String(value || '').trim().toLowerCase();
    return SUPPORTED_LANGS.includes(lang) ? lang : '';
  }

  function readStoredLang() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return '';
    }
  }

  function storeLang(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      /* ignore storage failures */
    }
  }

  function getPageName() {
    const explicitPage = document.body && document.body.dataset ? document.body.dataset.page : '';
    if (explicitPage) return explicitPage;

    const filename = window.location.pathname.split('/').pop() || '';
    if (!filename || filename === 'index.html') return FALLBACK_PAGE;
    return filename.replace(/\.html$/i, '') || FALLBACK_PAGE;
  }

  function injectStyle() {
    if (document.getElementById('magic-i18n-style')) return;
    const style = document.createElement('style');
    style.id = 'magic-i18n-style';
    style.textContent = SWITCHER_CSS;
    document.head.appendChild(style);
  }

  function deepGet(source, path) {
    if (!source || !path) return undefined;
    return String(path).split('.').reduce(function (value, part) {
      if (value === undefined || value === null) return undefined;
      return value[part];
    }, source);
  }

  function interpolate(template, vars) {
    if (typeof template !== 'string' || !vars) return template;
    return template.replace(/\{(\w+)\}/g, function (_, key) {
      return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : '';
    });
  }

  function getValue(key, lang) {
    if (!translations || !key) return undefined;
    const resolvedLang = normalizeLang(lang) || currentLang;
    const pageName = getPageName();

    let value = deepGet(translations[resolvedLang] && translations[resolvedLang][pageName], key);
    if (value === undefined) value = deepGet(translations[resolvedLang] && translations[resolvedLang].common, key);

    if (value === undefined && resolvedLang !== DEFAULT_LANG) {
      return getValue(key, DEFAULT_LANG);
    }
    return value;
  }

  function t(key, vars, fallback) {
    const value = getValue(key);
    if (typeof value !== 'string') {
      return fallback !== undefined ? fallback : '';
    }
    return interpolate(value, vars);
  }

  function setText(el, value) {
    if (el.tagName === 'TITLE') {
      document.title = value;
      return;
    }
    el.textContent = value;
  }

  function applyAttributeTranslations(selector, attrName, resolver) {
    document.querySelectorAll(selector).forEach(function (el) {
      const key = resolver(el);
      const value = t(key);
      if (!value) return;
      el.setAttribute(attrName, value);
    });
  }

  function applyPresetTranslations() {
    const pageName = getPageName();
    const entries = (PRESET_MAP.common || []).concat(PRESET_MAP[pageName] || []);

    entries.forEach(function (entry) {
      document.querySelectorAll(entry.selector).forEach(function (el) {
        const value = entry.mode === 'html' ? t(entry.key) : t(entry.key);
        if (!value) return;
        if (entry.mode === 'html') {
          el.innerHTML = value;
          return;
        }
        setText(el, value);
      });
    });
  }

  function applyTranslations() {
    if (!translations) return;

    document.documentElement.lang = currentLang;
    document.documentElement.dataset.lang = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const value = t(el.dataset.i18n);
      if (!value) return;
      setText(el, value);
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      const value = t(el.dataset.i18nHtml);
      if (!value) return;
      if (el.tagName === 'TITLE') {
        document.title = value;
        return;
      }
      el.innerHTML = value;
    });

    document.querySelectorAll('[data-i18n-value]').forEach(function (el) {
      const value = t(el.dataset.i18nValue);
      if (!value) return;
      el.value = value;
    });

    applyAttributeTranslations('[data-i18n-placeholder]', 'placeholder', function (el) {
      return el.dataset.i18nPlaceholder;
    });
    applyAttributeTranslations('[data-i18n-title]', 'title', function (el) {
      return el.dataset.i18nTitle;
    });
    applyAttributeTranslations('[data-i18n-aria-label]', 'aria-label', function (el) {
      return el.dataset.i18nAriaLabel;
    });

    applyPresetTranslations();
    renderSwitchers();
    document.dispatchEvent(new window.CustomEvent('magic:languagechange', {
      detail: { lang: currentLang, page: getPageName() }
    }));
  }

  function renderSwitchers() {
    document.querySelectorAll('[data-language-switcher]').forEach(function (host) {
      host.classList.add('lang-switcher');
      host.innerHTML = '';

      SUPPORTED_LANGS.forEach(function (lang) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lang-btn' + (lang === currentLang ? ' active' : '');
        button.textContent = lang.toUpperCase();
        button.setAttribute('aria-pressed', lang === currentLang ? 'true' : 'false');
        button.setAttribute('aria-label', lang === 'nl' ? 'Nederlands' : 'English');
        button.addEventListener('click', function () {
          setLang(lang);
        });
        host.appendChild(button);
      });
    });
  }

  function setLang(lang) {
    const nextLang = normalizeLang(lang) || DEFAULT_LANG;
    if (nextLang === currentLang) {
      renderSwitchers();
      return;
    }

    currentLang = nextLang;
    storeLang(currentLang);
    applyTranslations();
  }

  function getLocale() {
    return currentLang === 'en' ? 'en-GB' : 'nl-NL';
  }

  function loadTranslations() {
    return window.fetch(TRANSLATIONS_PATH, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('Unable to load translations');
        return response.json();
      })
      .then(function (data) {
        translations = data || {};
        applyTranslations();
        return api;
      })
      .catch(function () {
        translations = {};
        renderSwitchers();
        return api;
      });
  }

  injectStyle();
  renderSwitchers();

  const api = {
    ready: loadTranslations(),
    get: getValue,
    t: t,
    setLang: setLang,
    getLang: function () { return currentLang; },
    getLocale: getLocale,
    getPageName: getPageName,
    refresh: applyTranslations
  };

  window.MagicI18n = api;
})(window, document);

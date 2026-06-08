/* ============================================================
   Context Handoff — shared theme controller
   - sets <html data-theme> before paint (no flash)
   - persists choice in localStorage 'ch_theme' (shared)
   - falls back to system preference
   - injects one consistent floating sun/moon toggle + bg layer
   Pages just need:  <script src="theme.js"></script>
   ============================================================ */
(function () {
  var KEY = 'ch_theme';
  var TKEY = 'ch_tweaks';

  /* accent palettes (per theme shade); 'default' = let theme.css decide */
  var ACCENTS = {
    default: null,
    indigo: { light: '#5b53e0', dark: '#7b73f0' },
    teal:   { light: '#0e8a78', dark: '#2bb5a0' },
    slate:  { light: '#475569', dark: '#8a93a8' }
  };

  function current() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  /* ---- shared tweaks (font size + accent), synced across all pages ---- */
  function getTweaks() {
    var d = { fontBump: 2, accent: 'default' };
    try { return Object.assign(d, JSON.parse(localStorage.getItem(TKEY) || '{}')); }
    catch (e) { return d; }
  }
  function applyTweaks() {
    var tw = getTweaks();
    document.documentElement.style.setProperty('--fz', (tw.fontBump || 0) + 'px');
    var a = ACCENTS[tw.accent];
    if (a) {
      document.documentElement.style.setProperty('--accent', current() === 'light' ? a.light : a.dark);
    } else {
      document.documentElement.style.removeProperty('--accent');
    }
  }
  function setTweaks(edits) {
    var tw = getTweaks();
    for (var k in edits) tw[k] = edits[k];
    try { localStorage.setItem(TKEY, JSON.stringify(tw)); } catch (e) {}
    applyTweaks();
  }
  window.CHTweaks = { get: getTweaks, set: setTweaks, apply: applyTweaks, ACCENTS: ACCENTS };

  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    applyTweaks();
  }

  /* --- set theme ASAP (this script is in <head>, runs before body paints) --- */
  (function initial() {
    var t = null;
    try { t = localStorage.getItem(KEY); } catch (e) {}
    if (!t) {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', t);
  })();

  /* apply font-size + accent tweaks ASAP too (before paint) */
  applyTweaks();

  /* --- build the toggle + backdrop once the DOM exists --- */
  function build() {
    if (document.querySelector('.ch-theme-toggle')) return;

    var bg = document.createElement('div');
    bg.className = 'ch-bg-layer';
    document.body.insertBefore(bg, document.body.firstChild);

    var btn = document.createElement('button');
    btn.className = 'ch-theme-toggle';
    btn.type = 'button';
    btn.title = '切换亮 / 暗';
    btn.setAttribute('aria-label', 'Toggle light / dark theme');
    btn.innerHTML =
      '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' +
      '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="22"></line><line x1="2" y1="12" x2="5" y2="12"></line><line x1="19" y1="12" x2="22" y2="12"></line><line x1="4.6" y1="4.6" x2="6.7" y2="6.7"></line><line x1="17.3" y1="17.3" x2="19.4" y2="19.4"></line><line x1="4.6" y1="19.4" x2="6.7" y2="17.3"></line><line x1="17.3" y1="6.7" x2="19.4" y2="4.6"></line></svg>';
    btn.addEventListener('click', function () {
      apply(current() === 'light' ? 'dark' : 'light');
    });
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

  /* react to OS theme change only if the user hasn't chosen explicitly */
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
      var saved = null;
      try { saved = localStorage.getItem(KEY); } catch (err) {}
      if (!saved) { document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark'); applyTweaks(); }
    });
  }

  /* pick up tweak changes made in another tab/page (storage event) */
  window.addEventListener('storage', function (e) {
    if (e.key === TKEY) applyTweaks();
  });
})();

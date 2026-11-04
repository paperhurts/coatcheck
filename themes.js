/* Companion themes shared by the live forecast and scenario playground.
   Loaded without `defer` so the saved palette is on <html> before the first paint. */
(() => {
  'use strict';
  const STORAGE_KEY = 'cc_theme';
  const themes = [
    { id: 'pocket-paint-pals', name: 'Pocket Paint Pals', description: 'The original tiny pixel painting friends.' },
    { id: 'sister-sprinkles', name: 'Sister Sprinkles', artClass: 'sister-sprinkles', description: 'Little armored sisters, two thin coats, and a tiny crusade.' },
    { id: 'blueberry-battle-buddies', name: 'Blueberry Battle Buddies', artClass: 'blueberry-battle-buddies', description: 'Meet Poppy: a cheerful redhead in blue-and-gold armor, ready to protect your tiny coats.' },
    { id: 'greater-goodies', name: 'Greater Goodies', artClass: 'greater-goodies', description: 'Pip and a helpful hovering friend: a little teamwork for the greater good of your minis.' },
    { id: 'little-miss-heresy', name: 'Little Miss Heresy', artClass: 'little-miss-heresy', description: 'Hexie brings tiny horns, a mischievous grin, and suspiciously lovely thin coats.' },
    { id: 'nibbly-nids', name: 'Nibbly Nids', artClass: 'nibbly-nids', description: 'Niblet has small claws, a big painting appetite, and a very precious little miniature.' },
    { id: 'sleepy-tomb-beans', name: 'Sleepy Tomb Beans', artClass: 'sleepy-tomb-beans', description: 'Dozy has ancient bones, bright green eyes, and all the time in the world for another coat.' },
    { id: 'dakka-ducklings', name: 'Dakka Ducklings', artClass: 'dakka-ducklings', description: 'Gubbin is a happy green hobby buddy. More shaking, more painting, more happy little minis.' },
    { id: 'sunbeam-seraphs', name: 'Sunbeam Seraphs', artClass: 'sunbeam-seraphs', description: 'Sunny wraps your tiny projects in golden wings, gentle encouragement, and little blessings.' }
  ];
  const poses = { perfect: 0, good: 0, cloudy: 1, humid: 1, rainy: 2, cold: 3, hot: 4, bench: 5 };
  const poseLabels = ['painting a miniature', 'checking a varnish bottle', 'sheltering miniatures under an umbrella', 'keeping warm in a scarf', 'cooling off with a palette', 'shaking a primer can'];
  const findTheme = id => themes.find(theme => theme.id === id) || themes[0];
  let current;
  try { current = findTheme(localStorage.getItem(STORAGE_KEY)); }
  catch { current = themes[0]; }

  const themeColor = document.querySelector('meta[name="theme-color"]');
  const manifest = document.querySelector('link[rel="manifest"]');
  const touchIcon = document.querySelector('link[rel="apple-touch-icon"]');
  const setHref = (link, href) => { if (link && link.getAttribute('href') !== href) link.setAttribute('href', href); };
  function applyDocument() {
    const html = document.documentElement;
    html.dataset.companionTheme = current.id;
    html.dataset.companionStyle = current.artClass ? 'illustrated' : 'pixel';
    // Match the installed PWA's status bar to the palette.
    if (themeColor) themeColor.content = getComputedStyle(html).getPropertyValue('--primer').trim();
    // Install with the companion as the home-screen icon. Theme manifests share the root's start_url, so it stays one app.
    const folder = current.artClass ? `assets/themes/${current.id}/` : '';
    setHref(manifest, `${folder}manifest.webmanifest`);
    setHref(touchIcon, `${folder}icon-180.png`);
  }
  applyDocument();

  // Keep the app's original sprites so theme changes never rebuild forecast cards.
  const originals = new WeakMap();
  function paintCharacters() {
    document.querySelectorAll('[data-weather-sprite]').forEach(element => {
      const weather = element.dataset.weatherSprite;
      let original = originals.get(element);
      if (!original) {
        // A sprite first seen under the pixel theme is already showing its original art.
        original = { html: element.innerHTML, label: element.getAttribute('aria-label'), role: element.getAttribute('role'), theme: current.artClass ? null : current.id };
        originals.set(element, original);
      }
      const hasCharacter = element.firstElementChild?.classList.contains('theme-character');
      if (original.theme === current.id && (!current.artClass || hasCharacter)) return;
      if (current.artClass) {
        // The bench can initialize after this module; retain its freshly rendered pixel fallback.
        if (!hasCharacter) original.html = element.innerHTML;
        const pose = poses[weather] ?? 0;
        element.innerHTML = `<span class="theme-character ${current.artClass} theme-pose-${pose}" aria-hidden="true"></span>`;
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', `${current.name}: ${poseLabels[pose]}`);
      } else {
        element.innerHTML = original.html;
        for (const [attribute, value] of [['aria-label', original.label], ['role', original.role]]) {
          if (value === null) element.removeAttribute(attribute);
          else element.setAttribute(attribute, value);
        }
      }
      original.theme = current.id;
    });
  }

  function init() {
    const header = document.querySelector('header');
    if (!header) return;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'btn secondary theme-toggle';
    toggle.id = 'theme-toggle';
    toggle.textContent = '♡ Theme';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'theme-drawer');
    (header.querySelector('.header-actions') || header).append(toggle);

    const drawer = document.createElement('section');
    drawer.id = 'theme-drawer';
    drawer.className = 'theme-drawer';
    drawer.hidden = true;
    drawer.setAttribute('aria-labelledby', 'theme-title');
    drawer.innerHTML = `
      <div class="theme-drawer-heading"><h2 id="theme-title">Pick your little painting pal</h2><button type="button" class="btn secondary" id="theme-close">Done</button></div>
      <label for="theme-select">Companion theme</label>
      <select id="theme-select">${themes.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
      <p id="theme-description"></p>${manifest ? '<p id="theme-icon-note">Your pal also becomes the app icon when you add CoatCheck to your home screen. Already added it? Remove it and add it again to switch the icon.</p>' : ''}<p class="theme-feedback" id="theme-feedback" role="status"></p>
      <details class="theme-gallery"><summary>Meet all the painting pals</summary><div class="theme-choice-grid">${themes.map(t => `<button type="button" class="theme-choice" data-theme-choice="${t.id}" aria-pressed="false"><img src="${t.artClass ? `assets/themes/${t.id}/portrait.webp` : 'icon-180.png'}" alt="" width="88" height="88" loading="lazy"><span class="theme-choice-name">${t.name}</span></button>`).join('')}</div></details>`;
    header.after(drawer);
    const select = drawer.querySelector('select');
    const feedback = drawer.querySelector('#theme-feedback');
    function apply() {
      applyDocument();
      select.value = current.id;
      drawer.querySelector('#theme-description').textContent = current.description;
      drawer.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === current.id)));
      paintCharacters();
    }
    // The page's location and settings drawers share this space; keep one panel open at a time.
    function setOpen(open, returnFocus) {
      drawer.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        document.querySelectorAll('.drawer:not(.hidden)').forEach(other => other.classList.add('hidden'));
        select.focus();
      } else if (returnFocus) toggle.focus();
    }
    toggle.addEventListener('click', () => setOpen(drawer.hidden));
    header.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (button && button !== toggle && !drawer.hidden) setOpen(false);
    });
    drawer.querySelector('#theme-close').addEventListener('click', () => setOpen(false, true));
    drawer.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); } });
    function choose(id) {
      current = findTheme(id);
      let saved = true;
      try { localStorage.setItem(STORAGE_KEY, current.id); } catch { saved = false; }
      apply();
      feedback.textContent = saved ? `${current.name} is your painting companion.` : `${current.name} selected for this visit. Browser storage is unavailable.`;
    }
    select.addEventListener('change', () => choose(select.value));
    drawer.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => choose(button.dataset.themeChoice)));
    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY || event.key === null) {
        current = findTheme(event.newValue);
        apply();
        feedback.textContent = `${current.name} is your painting companion.`;
      }
    });
    apply();
    // Async forecast loads and calibration replace sprites; observe only their containers.
    const observer = new MutationObserver(paintCharacters);
    for (const id of ['days', 'sprite-gallery', 'can-sprite-holder']) {
      const target = document.getElementById(id);
      if (target) observer.observe(target, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

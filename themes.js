/* Companion themes shared by the live forecast and scenario playground. */
(() => {
  'use strict';
  const STORAGE_KEY = 'cc_theme';
  const themes = [
    { id: 'pocket-paint-pals', name: 'Pocket Paint Pals', ready: true, description: 'The original tiny pixel painting friends.' },
    { id: 'sister-sprinkles', name: 'Sister Sprinkles', ready: true, artClass: 'sister-sprinkles', description: 'Little armored sisters, two thin coats, and a tiny crusade.' },
    { id: 'blueberry-battle-buddies', name: 'Blueberry Battle Buddies', ready: true, artClass: 'blueberry-battle-buddies', reference: 'blueberry-battle-buddies.jpg', description: 'Meet Poppy: a cheerful redhead in blue-and-gold armor, ready to protect your tiny coats.' },
    { id: 'greater-goodies', name: 'Greater Goodies', ready: true, artClass: 'greater-goodies', reference: 'greater-goodies.jpg', description: 'Pip and a helpful hovering friend: a little teamwork for the greater good of your minis.' },
    { id: 'little-miss-heresy', name: 'Little Miss Heresy', ready: true, artClass: 'little-miss-heresy', reference: 'little-miss-heresy.jpg', description: 'Hexie brings tiny horns, a mischievous grin, and suspiciously lovely thin coats.' },
    { id: 'nibbly-nids', name: 'Nibbly Nids', ready: true, artClass: 'nibbly-nids', reference: 'nibbly-nids.jpg', description: 'Niblet has small claws, a big painting appetite, and a very precious little miniature.' },
    { id: 'sleepy-tomb-beans', name: 'Sleepy Tomb Beans', ready: true, artClass: 'sleepy-tomb-beans', reference: 'sleepy-tomb-beans.jpg', description: 'Dozy has ancient bones, bright green eyes, and all the time in the world for another coat.' },
    { id: 'dakka-ducklings', name: 'Dakka Ducklings', ready: true, artClass: 'dakka-ducklings', reference: 'dakka-ducklings.jpg', description: 'Gubbin is a happy green hobby buddy. More shaking, more painting, more happy little minis.' },
    { id: 'sunbeam-seraphs', name: 'Sunbeam Seraphs', ready: true, artClass: 'sunbeam-seraphs', reference: 'sunbeam-seraphs.jpg', description: 'Sunny wraps your tiny projects in golden wings, gentle encouragement, and little blessings.' }
  ];
  const poses = { perfect: 0, good: 0, cloudy: 1, humid: 1, rainy: 2, cold: 3, hot: 4, bench: 5 };
  const poseLabels = ['painting a miniature', 'checking a varnish bottle', 'sheltering miniatures under an umbrella', 'keeping warm in a scarf', 'cooling off with a palette', 'shaking a primer can'];
  const readyTheme = id => themes.find(theme => theme.id === id && theme.ready) || themes[0];
  let current;
  try { current = readyTheme(localStorage.getItem(STORAGE_KEY)); }
  catch { current = themes[0]; }
  document.documentElement.dataset.companionTheme = current.id;
  document.documentElement.dataset.companionStyle = current.artClass ? 'illustrated' : 'pixel';

  // Keep the app's original sprites so theme changes never rebuild forecast cards.
  const originals = new WeakMap();
  function paintCharacters() {
    document.querySelectorAll('[data-weather-sprite]').forEach(element => {
      const weather = element.dataset.weatherSprite;
      let original = originals.get(element);
      if (!original) {
        original = { html: element.innerHTML, label: element.getAttribute('aria-label'), role: element.getAttribute('role'), theme: null };
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
      <select id="theme-select">
        <optgroup label="Ready to paint">${themes.filter(t => t.ready).map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</optgroup>
      </select>
      <p id="theme-description"></p><p class="theme-feedback" id="theme-feedback" role="status"></p>
      <details class="theme-gallery"><summary>Meet all the painting pals</summary><div class="theme-choice-grid">${themes.filter(t => t.ready).map(t => `<button type="button" class="theme-choice" data-theme-choice="${t.id}" aria-pressed="false">${t.artClass ? `<span class="theme-character ${t.artClass} theme-pose-0" aria-hidden="true"></span>` : '<img src="icon-180.png" alt="" width="88" height="88" loading="lazy">'}<span class="theme-choice-name">${t.name}</span></button>`).join('')}</div></details>`;
    header.after(drawer);
    const select = drawer.querySelector('select');
    const feedback = drawer.querySelector('#theme-feedback');
    function apply() {
      document.documentElement.dataset.companionTheme = current.id;
      document.documentElement.dataset.companionStyle = current.artClass ? 'illustrated' : 'pixel';
      select.value = current.id;
      drawer.querySelector('#theme-description').textContent = current.description;
      drawer.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === current.id)));
      paintCharacters();
    }
    function close() { drawer.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    toggle.addEventListener('click', () => {
      drawer.hidden = !drawer.hidden;
      toggle.setAttribute('aria-expanded', String(!drawer.hidden));
      if (!drawer.hidden) select.focus();
    });
    drawer.querySelector('#theme-close').addEventListener('click', close);
    drawer.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
    function choose(id) {
      current = readyTheme(id);
      let saved = true;
      try { localStorage.setItem(STORAGE_KEY, current.id); } catch { saved = false; }
      apply();
      feedback.textContent = saved ? `${current.name} is your painting companion.` : `${current.name} selected for this visit. Browser storage is unavailable.`;
    }
    select.addEventListener('change', () => choose(select.value));
    drawer.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => choose(button.dataset.themeChoice)));
    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY || event.key === null) {
        current = readyTheme(event.newValue);
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

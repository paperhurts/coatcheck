/* Companion themes shared by the live forecast and scenario playground. */
(() => {
  'use strict';
  const STORAGE_KEY = 'cc_theme';
  const themes = [
    { id: 'pocket-paint-pals', name: 'Pocket Paint Pals', ready: true, description: 'The original tiny pixel painting friends.' },
    { id: 'sister-sprinkles', name: 'Sister Sprinkles', ready: true, artClass: 'sister-sprinkles', description: 'Little armored sisters, two thin coats, and a tiny crusade.' },
    { id: 'blueberry-battle-buddies', name: 'Blueberry Battle Buddies', ready: true, artClass: 'blueberry-battle-buddies', reference: 'blueberry-battle-buddies.jpg', description: 'Meet Poppy: a cheerful redhead in blue-and-gold armor, ready to protect your tiny coats.' },
    { id: 'greater-goodies', name: 'Greater Goodies', reference: 'greater-goodies.jpg', description: 'Blue little friends with a helpful hovering companion.' },
    { id: 'little-miss-heresy', name: 'Little Miss Heresy', reference: 'little-miss-heresy.jpg', description: 'A little mischief, a lot of tiny coats.' },
    { id: 'nibbly-nids', name: 'Nibbly Nids', reference: 'nibbly-nids.jpg', description: 'Small claws. Big painting appetite.' },
    { id: 'sleepy-tomb-beans', name: 'Sleepy Tomb Beans', reference: 'sleepy-tomb-beans.jpg', description: 'Cozy ancient metal beans with glowing green eyes.' },
    { id: 'dakka-ducklings', name: 'Dakka Ducklings', reference: 'dakka-ducklings.jpg', description: 'Happy green little noise enthusiasts.' },
    { id: 'sunbeam-seraphs', name: 'Sunbeam Seraphs', reference: 'sunbeam-seraphs.jpg', description: 'Golden wings and sunny little blessings.' }
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
        <optgroup label="Coming soon · weather poses in progress">${themes.filter(t => !t.ready).map(t => `<option value="${t.id}" disabled>${t.name}</option>`).join('')}</optgroup>
      </select>
      <p id="theme-description"></p><p class="theme-feedback" id="theme-feedback" role="status"></p>
      <details class="theme-future"><summary>Meet the next little companions</summary><p>Character references for future themes. Each will get a full set of weather poses before becoming selectable.</p><div class="theme-reference-grid">${themes.filter(t => !t.ready).map(t => `<figure><img src="assets/themes/references/${t.reference}" alt="${t.description}" width="160" height="160" loading="lazy"><figcaption>${t.name}<span>Coming soon</span></figcaption></figure>`).join('')}</div></details>`;
    header.after(drawer);
    const select = drawer.querySelector('select');
    const feedback = drawer.querySelector('#theme-feedback');
    function apply() {
      document.documentElement.dataset.companionTheme = current.id;
      document.documentElement.dataset.companionStyle = current.artClass ? 'illustrated' : 'pixel';
      select.value = current.id;
      drawer.querySelector('#theme-description').textContent = current.description;
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
    select.addEventListener('change', () => {
      current = readyTheme(select.value);
      let saved = true;
      try { localStorage.setItem(STORAGE_KEY, current.id); } catch { saved = false; }
      apply();
      feedback.textContent = saved ? `${current.name} is your painting companion.` : `${current.name} selected for this visit. Browser storage is unavailable.`;
    });
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

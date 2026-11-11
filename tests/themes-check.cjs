// Run with Playwright available, or set PLAYWRIGHT_MODULE to its absolute module path.
// A plain script (not a @playwright/test spec): `node tests/themes-check.cjs`.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const url = name => pathToFileURL(path.join(root, name)).href;
const illustrated = ['sister-sprinkles', 'blueberry-battle-buddies', 'greater-goodies', 'little-miss-heresy', 'nibbly-nids', 'sleepy-tomb-beans', 'dakka-ducklings', 'sunbeam-seraphs'];
const allThemes = ['pocket-paint-pals', ...illustrated];
const settle = page => page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
const noOverflow = async (page, label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, label);
const readManifest = folder => JSON.parse(fs.readFileSync(path.join(root, folder, 'manifest.webmanifest'), 'utf8'));
// Everything but these is the same app across theme manifests: name, display, and the icon file names.
const sharedFields = ({ start_url, theme_color, background_color, ...shared }) => shared;

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CC_BROWSER_CHANNEL ? { channel: process.env.CC_BROWSER_CHANNEL } : {}) });
  const errors = [];
  const watch = page => page.on('pageerror', error => errors.push(`${page.url().split('/').pop()}: ${error.message}`));
  try {
    const context = await browser.newContext({ timezoneId: 'America/New_York' });
    // A fixed winter day keeps the -05:00 fixtures inside the app's 8 am–6 pm local window all year.
    const today = '2026-01-15';
    await context.clock.setFixedTime(new Date(`${today}T10:00:00-05:00`));
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    await context.route('https://fonts.gstatic.com/**', route => route.abort());
    const page = await context.newPage();
    watch(page);
    const periods = Array.from({ length: 10 }, (_, i) => ({ startTime: `${today}T${String(8 + i).padStart(2, '0')}:00:00-05:00`, temperature: 74, relativeHumidity: { value: 55 }, probabilityOfPrecipitation: { value: 0 } }));
    await context.route('https://api.weather.gov/**', route => route.fulfill({ contentType: 'application/geo+json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(route.request().url().includes('/points/') ? { properties: { forecastHourly: 'https://api.weather.gov/test-hourly' } } : { properties: { periods } }) }));
    await page.goto(url('index.html'));
    await page.locator('.chip').first().waitFor();
    // Today's card carries the forecast for the hour we are in.
    assert.match(await page.locator('.chip').first().locator('.now-band').innerText(), /74°\s*F\s+55\s*% RH\s+Paint now/i);
    await page.locator('.chip').first().click();
    await page.locator('.hour-block').nth(4).click();
    const inspection = await page.locator('#inspect-0').innerHTML();
    assert.equal(await page.locator('#hourly-0 .hour-block').count(), 10);
    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('#theme-select option').count(), 9);
    assert.match(await page.locator('#theme-icon-note').innerText(), /app icon/);
    // A default manifest URL in the markup can be fetched first and stick, so only themes.js sets it.
    assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /<link rel="manifest">/, 'index.html must not give the manifest a default href');
    const rootManifest = readManifest('');
    assert.ok(['192x192', '512x512'].every(sizes => rootManifest.icons.some(icon => icon.sizes === sizes && !icon.purpose)), 'Chrome installs only with 192px and 512px icons');
    assert.ok(rootManifest.icons.some(icon => icon.purpose === 'maskable'), 'Android needs a maskable icon to fill its icon shape');
    const palettes = new Set();
    for (const theme of allThemes) {
      await page.locator('#theme-select').selectOption(theme);
      assert.equal(await page.locator('html').getAttribute('data-companion-theme'), theme);
      assert.equal(await page.evaluate(() => localStorage.getItem('cc_theme')), theme);
      assert.equal(await page.locator('#inspect-0').innerHTML(), inspection, `${theme}: selected hour changed`);
      assert.equal(await page.locator('#hourly-0').isVisible(), true, `${theme}: open day closed`);
      const primer = await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--primer').trim());
      assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), primer, `${theme}: PWA theme-color not synced`);
      palettes.add(primer);
      // Installing uses the theme's manifest and touch icon; only colors and the start_url spelling differ from the root's.
      const folder = theme === 'pocket-paint-pals' ? '' : `assets/themes/${theme}/`;
      assert.equal(await page.locator('link[rel="manifest"]').getAttribute('href'), `${folder}manifest.webmanifest`, `${theme}: manifest not swapped`);
      assert.equal(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'), `${folder}icon-180.png`, `${theme}: touch icon not swapped`);
      const manifest = readManifest(folder);
      assert.equal(new URL(manifest.start_url, url(`${folder}manifest.webmanifest`)).href, new URL(rootManifest.start_url, url('manifest.webmanifest')).href, `${theme}: manifest would install a different app`);
      assert.deepEqual(sharedFields(manifest), sharedFields(rootManifest), `${theme}: manifest differs from the root's`);
      assert.deepEqual([manifest.theme_color, manifest.background_color], [primer, primer], `${theme}: manifest colors`);
      const iconFiles = [...manifest.icons.map(icon => icon.src), 'icon-180.png'];
      const iconSizes = await page.evaluate(srcs => Promise.all(srcs.map(async src => { const image = new Image(); image.src = src; await image.decode(); return `${image.naturalWidth}x${image.naturalHeight}`; })), iconFiles.map(name => url(folder + name)));
      assert.deepEqual(iconSizes, [...manifest.icons.map(icon => icon.sizes), '180x180'], `${theme}: icon dimensions`);
    }
    assert.equal(palettes.size, 9, 'Each theme has its own surface palette');
    // Only one header panel at a time: the page's own drawers and the theme drawer close each other.
    await page.locator('#btn-toggle-settings').click();
    assert.equal(await page.locator('#theme-drawer').isVisible(), false, 'Settings drawer should close the theme drawer');
    assert.equal(await page.locator('#settings-drawer').isVisible(), true);
    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('#settings-drawer').isVisible(), false, 'Theme drawer should close the settings drawer');
    assert.equal(await page.locator('#theme-drawer').isVisible(), true);
    await page.locator('#theme-close').click();
    await page.reload();
    await page.locator('#days .sunbeam-seraphs.theme-character').first().waitFor();
    assert.equal(await page.locator('#theme-select').inputValue(), 'sunbeam-seraphs');
    assert.equal(await page.locator('link[rel="manifest"]').getAttribute('href'), 'assets/themes/sunbeam-seraphs/manifest.webmanifest');

    await page.goto(url('example.html'));
    await page.locator('#theme-toggle').waitFor();
    // The demo has no manifest, so it cannot be installed and makes no icon promise.
    assert.equal(await page.locator('#theme-icon-note').count(), 0);
    for (const theme of illustrated) {
      await page.locator('#theme-toggle').click();
      await page.locator('.theme-gallery summary').click();
      assert.equal(await page.locator('[data-theme-choice]').count(), 9);
      await page.locator(`[data-theme-choice="${theme}"]`).click();
      assert.equal(await page.locator('#theme-select').inputValue(), theme);
      assert.equal(await page.locator(`[data-theme-choice="${theme}"]`).getAttribute('aria-pressed'), 'true');
      await page.locator('#theme-close').click();
      assert.equal(await page.locator(`#days .${theme}.theme-character`).count(), 7);
      assert.equal(await page.locator(`#can-sprite-holder .${theme}.theme-pose-5`).count(), 1);
      for (const pose of [0, 1, 2, 3, 4, 5]) {
        const holder = pose === 5 ? '#can-sprite-holder' : '#days';
        const art = page.locator(`${holder} .${theme}.theme-pose-${pose}`).first();
        assert.ok(await art.count(), `${theme}: missing pose ${pose}`);
        await art.evaluate(async el => { const image = new Image(); image.src = getComputedStyle(el).backgroundImage.slice(5, -2); await image.decode(); if (image.naturalWidth !== 960 || image.naturalHeight !== 640) throw Error('Unexpected atlas dimensions'); });
      }
      for (const width of [320, 390, 1024]) {
        await page.setViewportSize({ width, height: 900 });
        await page.locator('#days .chip').first().click();
        const count = await page.locator('#hourly-0 .hour-block').count();
        assert.equal(await page.locator('#hourly-0 .hour-block:visible').count(), count);
        const tops = await page.locator('#hourly-0 .hour-block').evaluateAll(bs => bs.map(b => b.offsetTop));
        assert.equal(new Set(tops).size, 1, `${theme}: hours wrapped at ${width}px`);
        await page.locator('#hourly-0 .hour-block').nth(4).click();
        const advice = await page.locator('#inspect-0').innerHTML();
        await noOverflow(page, `${theme}: forecast overflow at ${width}px`);
        await page.locator('#theme-toggle').click();
        await page.locator('#theme-select').selectOption('pocket-paint-pals');
        assert.equal(await page.locator('#days .theme-character').count(), 0);
        assert.equal(await page.locator('#can-sprite-holder .pixel-sprite').count(), 1);
        await page.locator('#theme-select').selectOption(theme);
        assert.equal(await page.locator('#inspect-0').innerHTML(), advice, `${theme}: advice changed on theme switch`);
        await noOverflow(page, `${theme}: portrait picker overflow at ${width}px`);
        await page.locator('#theme-select').focus();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#theme-drawer').isVisible(), false);
        assert.equal(await page.locator('#theme-toggle').evaluate(el => document.activeElement === el), true);
        if (process.env.THEME_SCREENSHOTS && width === 390) {
          await settle(page);
          await page.locator('#days .chip').first().screenshot({ path: path.join(process.env.THEME_SCREENSHOTS, `${theme}-day.png`) });
          await page.locator('#sprite-gallery').screenshot({ path: path.join(process.env.THEME_SCREENSHOTS, `${theme}-poses.png`) });
        }
        await page.locator('#days .chip').first().click();
      }
      const limit = await page.locator('#slider-rhMax').inputValue() === '65' ? '60' : '65';
      await page.locator('#slider-rhMax').fill(limit);
      await page.locator('#slider-rhMax').dispatchEvent('input');
      await page.waitForFunction(id => document.querySelectorAll(`#days .${id}.theme-character`).length === 7, theme);
      await page.reload();
      await page.locator(`#days .${theme}.theme-character`).first().waitFor();
      assert.equal(await page.locator('#theme-select').inputValue(), theme);
      console.log(`PASS ${theme}: six poses, portrait selection, persistence, calibration, hour preservation and 320/390/1024px layouts`);
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator('#theme-toggle').click();
    await page.locator('.theme-gallery summary').click();
    // Portraits are small dedicated images, not the full atlases.
    for (const img of await page.locator('.theme-choice img').all()) {
      const size = await img.evaluate(async el => { await el.decode(); return [el.naturalWidth, el.naturalHeight, el.currentSrc.split('/').pop()]; });
      if (size[2] === 'portrait.webp') assert.deepEqual(size.slice(0, 2), [256, 256], 'Unexpected portrait dimensions');
    }
    assert.equal(await page.locator('.theme-choice img[src$="portrait.webp"]').count(), 8);
    if (process.env.THEME_SCREENSHOTS) await page.locator('#theme-drawer').screenshot({ path: path.join(process.env.THEME_SCREENSHOTS, 'all-companions-picker.png') });
    await page.locator('[data-theme-choice="greater-goodies"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#theme-select').inputValue(), 'greater-goodies');
    await page.keyboard.press('Escape');
    const other = await context.newPage();
    watch(other);
    await other.goto(url('example.html'));
    await other.evaluate(() => localStorage.setItem('cc_theme', 'nibbly-nids'));
    await page.waitForFunction(() => document.documentElement.dataset.companionTheme === 'nibbly-nids');
    await other.close();
    await page.evaluate(() => localStorage.setItem('cc_theme', 'theme-that-does-not-exist'));
    await page.reload();
    await page.locator('#theme-select').waitFor({ state: 'attached' });
    assert.equal(await page.locator('#theme-select').inputValue(), 'pocket-paint-pals');
    assert.equal(await page.locator('#days .theme-character').count(), 0);
    // The pixel theme leaves freshly rendered sprites alone instead of re-parsing them.
    assert.equal(await page.evaluate(async () => {
      renderMockups();
      const sprite = document.querySelector('#days .pixel-sprite');
      await new Promise(resolve => setTimeout(resolve));
      return sprite.isConnected;
    }), true, 'Pixel theme rebuilt a freshly rendered sprite');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#theme-toggle').click();
    for (const theme of allThemes) {
      await page.locator('#theme-select').selectOption(theme);
      assert.equal(await page.locator('#days .chip').first().evaluate(el => getComputedStyle(el).animationName), 'none');
      await page.locator('#interactive-spray-can').evaluate(el => el.classList.add('shaking'));
      assert.equal(await page.locator('#can-sprite-holder').evaluate(el => getComputedStyle(el).animationName), 'none', `${theme}: can shakes under reduced motion`);
      await page.locator('#interactive-spray-can').evaluate(el => el.classList.remove('shaking'));
    }
    // After 6 pm today's card has no window hours left: it says so instead of grading made-up numbers.
    const hour = (day, h) => ({ startTime: `2026-01-${day}T${String(h).padStart(2, '0')}:00:00-05:00`, temperature: 60 + h, relativeHumidity: { value: 84 }, probabilityOfPrecipitation: { value: 0 } });
    const evening = [...[20, 21, 22, 23].map(h => hour(15, h)), ...Array.from({ length: 24 }, (_, h) => hour(16, h))];
    await context.clock.setFixedTime(new Date(`${today}T20:30:00-05:00`));
    await context.route('https://api.weather.gov/test-hourly', route => route.fulfill({ contentType: 'application/geo+json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ properties: { periods: evening } }) }));
    await page.goto(url('index.html'));
    await page.locator('.chip.closed').waitFor();
    assert.equal(await page.locator('.chip').first().evaluate(el => el.classList.contains('closed')), true, 'Tonight should be the first card');
    assert.equal(await page.locator('.now-band').count(), 1, 'Only today shows a current reading');
    assert.match(await page.locator('.chip.closed .now-band').innerText(), /80°\s*F\s+84\s*% RH/i);
    assert.match(await page.locator('.chip.closed').innerText(), /window has closed/);
    assert.equal(await page.locator('.chip.closed .hourly-panel').count(), 0);
    await noOverflow(page, 'Closed card overflows');
    // Opening a later day still pairs each panel with its own card.
    await page.locator('.chip').nth(1).click();
    assert.equal(await page.locator('#hourly-1').isVisible(), true);
    assert.equal(await page.locator('.chip').nth(1).evaluate(el => el.classList.contains('expanded')), true);
    assert.equal(await page.locator('#hourly-1 .hour-block').count(), 10);
    await context.close();
    const blocked = await browser.newPage();
    watch(blocked);
    await blocked.setContent('<header></header><div id="days"><div data-weather-sprite="hot"><span>Original sprite</span></div></div>');
    await blocked.evaluate(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied'); } }));
    await blocked.addScriptTag({ path: path.join(root, 'themes.js') });
    await blocked.locator('#theme-toggle').click();
    await blocked.locator('#theme-select').selectOption('dakka-ducklings');
    assert.match(await blocked.locator('#theme-feedback').innerText(), /storage is unavailable/);
    assert.equal(await blocked.locator('#days .theme-character').count(), 1);
    await blocked.close();
    assert.deepEqual(errors, []);
    console.log('PASS: all nine themes, all 48 illustrated poses, palettes, theme-color, home-screen icons and manifests, drawer coordination, keyboard/portrait picker, cross-tab synchronization, invalid IDs, unavailable storage, and reduced motion.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

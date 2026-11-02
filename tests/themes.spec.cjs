// Run with Playwright available, or set PLAYWRIGHT_MODULE to its absolute module path.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const url = name => pathToFileURL(path.join(root, name)).href;
const illustrated = ['sister-sprinkles', 'blueberry-battle-buddies', 'greater-goodies', 'little-miss-heresy', 'nibbly-nids', 'sleepy-tomb-beans', 'dakka-ducklings', 'sunbeam-seraphs'];
const allThemes = ['pocket-paint-pals', ...illustrated];
const settle = page => page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
const noOverflow = async (page, label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, label);

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CC_BROWSER_CHANNEL ? { channel: process.env.CC_BROWSER_CHANNEL } : {}) });
  try {
    const context = await browser.newContext({ timezoneId: 'America/New_York' });
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    await context.route('https://fonts.gstatic.com/**', route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const periods = Array.from({ length: 10 }, (_, i) => ({ startTime: `${today}T${String(8 + i).padStart(2, '0')}:00:00-05:00`, temperature: 74, relativeHumidity: { value: 55 }, probabilityOfPrecipitation: { value: 0 } }));
    await context.route('https://api.weather.gov/**', route => route.fulfill({ contentType: 'application/geo+json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(route.request().url().includes('/points/') ? { properties: { forecastHourly: 'https://api.weather.gov/test-hourly' } } : { properties: { periods } }) }));
    await page.goto(url('index.html'));
    await page.locator('.chip').first().waitFor();
    await page.locator('.chip').first().click();
    await page.locator('.hour-block').nth(4).click();
    const inspection = await page.locator('#inspect-0').innerHTML();
    assert.equal(await page.locator('#hourly-0 .hour-block').count(), 10);
    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('#theme-select option:disabled').count(), 0);
    assert.equal(await page.locator('#theme-select option').count(), 9);
    const palettes = new Set();
    for (const theme of allThemes) {
      await page.locator('#theme-select').selectOption(theme);
      assert.equal(await page.locator('html').getAttribute('data-companion-theme'), theme);
      assert.equal(await page.evaluate(() => localStorage.getItem('cc_theme')), theme);
      assert.equal(await page.locator('#inspect-0').innerHTML(), inspection, `${theme}: selected hour changed`);
      assert.equal(await page.locator('#hourly-0').isVisible(), true, `${theme}: open day closed`);
      palettes.add(await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--primer').trim()));
    }
    assert.equal(palettes.size, 9, 'Each theme has its own surface palette');
    await page.locator('#theme-close').click();
    await page.reload();
    await page.locator('#days .sunbeam-seraphs.theme-character').first().waitFor();
    assert.equal(await page.locator('#theme-select').inputValue(), 'sunbeam-seraphs');

    await page.goto(url('example.html'));
    await page.locator('#theme-toggle').waitFor();
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
        await art.evaluate(async el => { const image = new Image(); image.src = getComputedStyle(el).backgroundImage.slice(5, -2); await image.decode(); if (image.naturalWidth !== 1536 || image.naturalHeight !== 1024) throw Error('Unexpected atlas dimensions'); });
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
    await page.locator('.theme-choice img').evaluate(img => img.decode());
    for (const art of await page.locator('.theme-choice .theme-character').all()) await art.evaluate(async el => { const image = new Image(); image.src = getComputedStyle(el).backgroundImage.slice(5, -2); await image.decode(); });
    if (process.env.THEME_SCREENSHOTS) await page.locator('#theme-drawer').screenshot({ path: path.join(process.env.THEME_SCREENSHOTS, 'all-companions-picker.png') });
    await page.locator('[data-theme-choice="greater-goodies"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#theme-select').inputValue(), 'greater-goodies');
    await page.keyboard.press('Escape');
    const other = await context.newPage();
    await other.goto(url('example.html'));
    await other.evaluate(() => localStorage.setItem('cc_theme', 'nibbly-nids'));
    await page.waitForFunction(() => document.documentElement.dataset.companionTheme === 'nibbly-nids');
    await other.close();
    await page.evaluate(() => localStorage.setItem('cc_theme', 'theme-that-does-not-exist'));
    await page.reload();
    await page.locator('#theme-select').waitFor({ state: 'attached' });
    assert.equal(await page.locator('#theme-select').inputValue(), 'pocket-paint-pals');
    assert.equal(await page.locator('#days .theme-character').count(), 0);
    assert.deepEqual(errors, []);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#theme-toggle').click();
    for (const theme of illustrated) {
      await page.locator('#theme-select').selectOption(theme);
      assert.equal(await page.locator('#days .chip').first().evaluate(el => getComputedStyle(el).animationName), 'none');
    }
    await context.close();
    const blocked = await browser.newPage();
    await blocked.setContent('<header></header><div id="days"><div data-weather-sprite="hot"><span>Original sprite</span></div></div>');
    await blocked.evaluate(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied'); } }));
    await blocked.addScriptTag({ path: path.join(root, 'themes.js') });
    await blocked.locator('#theme-toggle').click();
    await blocked.locator('#theme-select').selectOption('dakka-ducklings');
    assert.match(await blocked.locator('#theme-feedback').innerText(), /storage is unavailable/);
    assert.equal(await blocked.locator('#days .theme-character').count(), 1);
    await blocked.close();
    console.log('PASS: all nine themes, all 48 illustrated poses, palettes, keyboard/portrait picker, cross-tab synchronization, invalid IDs, unavailable storage, and reduced motion.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

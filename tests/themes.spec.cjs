// Run with Playwright available, or set PLAYWRIGHT_MODULE to its absolute module path.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const url = name => pathToFileURL(path.join(root, name)).href;

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CC_BROWSER_CHANNEL ? { channel: process.env.CC_BROWSER_CHANNEL } : {}) });
  try {
    const context = await browser.newContext({ timezoneId: 'America/New_York' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const periods = Array.from({ length: 10 }, (_, i) => ({
      startTime: `${today}T${String(8 + i).padStart(2, '0')}:00:00-05:00`, temperature: 74,
      relativeHumidity: { value: 55 }, probabilityOfPrecipitation: { value: 0 }
    }));
    await page.route('https://api.weather.gov/**', route => route.fulfill({
      contentType: 'application/geo+json', headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(route.request().url().includes('/points/')
        ? { properties: { forecastHourly: 'https://api.weather.gov/test-hourly' } }
        : { properties: { periods } })
    }));

    await page.goto(url('index.html'));
    await page.locator('.chip').first().waitFor();
    await page.locator('.chip').first().click();
    await page.locator('.hour-block').nth(4).click();
    const inspection = await page.locator('#inspect-0').innerHTML();
    assert.equal(await page.locator('#hourly-0 .hour-block').count(), 10);
    await page.locator('#theme-toggle').click();
    await page.locator('#theme-select').selectOption('sister-sprinkles');
    await page.locator('.theme-character').first().waitFor();
    assert.equal(await page.locator('#inspect-0').innerHTML(), inspection, 'Switching themes must preserve hour advice');
    assert.equal(await page.locator('#hourly-0').isVisible(), true, 'The open day must stay open');
    assert.equal(await page.locator('#theme-select option:disabled').count(), 7);
    assert.equal(await page.evaluate(() => localStorage.getItem('cc_theme')), 'sister-sprinkles');
    const src = await page.locator('.theme-character').first().evaluate(el => getComputedStyle(el).backgroundImage);
    assert.match(src, /sisters-atlas\.png/);
    await page.locator('#theme-close').click();
    await page.reload();
    await page.locator('.theme-character').first().waitFor();
    assert.equal(await page.locator('#theme-select').inputValue(), 'sister-sprinkles');
    if (process.env.THEME_SCREENSHOTS) {
      await page.setViewportSize({ width: 390, height: 1000 });
      await page.locator('.chip').first().click();
      await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
      await page.screenshot({ path: path.join(process.env.THEME_SCREENSHOTS, 'live-sister-theme.png'), fullPage: true });
    }

    // The theme choice carries into the demo; all weather states and bench are present.
    await page.goto(url('example.html'));
    await page.locator('.theme-character').first().waitFor();
    assert.equal(await page.locator('#days .theme-character').count(), 7);
    for (const pose of [0, 1, 2, 3, 4, 5]) {
      assert.ok(await page.locator(`.theme-pose-${pose}`).count(), `Missing weather pose ${pose}`);
    }
    await page.locator('#days .chip').first().click();
    const hourlyCount = await page.locator('#hourly-0 .hour-block').count();
    await page.locator('#theme-toggle').click();
    await page.locator('#theme-select').selectOption('pocket-paint-pals');
    assert.equal(await page.locator('.theme-character').count(), 0);
    assert.ok(await page.locator('#days .pixel-sprite').count());
    assert.equal(await page.locator('#can-sprite-holder .pixel-sprite').count(), 1, 'The original bench mascot must be restored');
    assert.equal(await page.locator('#hourly-0 .hour-block').count(), hourlyCount);
    assert.equal(await page.locator('#hourly-0').isVisible(), true);
    await page.locator('#theme-select').selectOption('sister-sprinkles');
    await page.locator('#theme-close').click();

    // Recalculating a forecast recreates sprites; the chosen theme must be reapplied.
    await page.locator('#slider-rhMax').fill('65');
    await page.locator('#slider-rhMax').dispatchEvent('input');
    await page.waitForFunction(() => document.querySelectorAll('#days .theme-character').length === 7);
    for (const width of [320, 390, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator('#days .chip').first().click();
      assert.equal(await page.locator('#hourly-0 .hour-block:visible').count(), hourlyCount);
      const overflowing = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(el => `${el.tagName}.${el.className}`));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px: ${overflowing.join(', ')}`);
      await page.locator('#theme-toggle').click();
      await page.locator('.theme-future summary').click();
      const images = page.locator('.theme-reference-grid img');
      assert.equal(await images.count(), 7);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(img => img.decode());
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Picker overflow at ${width}px`);
      await page.locator('.theme-future summary').click();
      await page.locator('#theme-select').focus();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#theme-drawer').isVisible(), false);
      assert.equal(await page.locator('#theme-toggle').evaluate(el => document.activeElement === el), true);
      await page.locator('#days .chip').first().click();
    }
    // Validate both atlases, including the corrected heat illustration.
    for (const pose of [0, 4]) {
      await page.locator(`.theme-pose-${pose}`).first().evaluate(async el => {
        const image = new Image(); image.src = getComputedStyle(el).backgroundImage.slice(5, -2);
        await image.decode();
        if (image.naturalWidth !== 1536 || image.naturalHeight !== 1024) throw Error('Unexpected atlas dimensions');
      });
    }
    await page.evaluate(() => localStorage.setItem('cc_theme', 'nibbly-nids'));
    await page.reload();
    await page.locator('#theme-select').waitFor({ state: 'attached' });
    assert.equal(await page.locator('#theme-select').inputValue(), 'pocket-paint-pals');
    assert.equal(await page.locator('.theme-character').count(), 0, 'Unfinished theme IDs must fall back');
    assert.deepEqual(errors, []);
    await context.close();

    // Test the theme module in isolation when browser storage is unavailable.
    const blocked = await browser.newPage();
    await blocked.setContent('<header></header><div id="days"><div data-weather-sprite="hot"><span>Original sprite</span></div></div>');
    await blocked.evaluate(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied'); } }));
    await blocked.addScriptTag({ path: path.join(root, 'themes.js') });
    await blocked.locator('#theme-toggle').click();
    await blocked.locator('#theme-select').selectOption('sister-sprinkles');
    assert.match(await blocked.locator('#theme-feedback').innerText(), /storage is unavailable/);
    assert.equal(await blocked.locator('.theme-character').count(), 1);
    await blocked.close();
    console.log('PASS: live/demo theme switching, persistence, weather poses, open-day preservation, recalculation, planned references, keyboard controls, invalid IDs, blocked storage, artwork loads, and mobile layouts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

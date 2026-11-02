// Builds the web copies of each companion atlas: atlas.webp (scaled) and portrait.webp (ready pose).
// Source atlases stay as the 1536x1024 masters. Run with Playwright available, or set PLAYWRIGHT_MODULE;
// set CC_BROWSER_CHANNEL=msedge to use installed Edge. Encoding happens in the browser's own canvas.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const themesDir = path.resolve(__dirname, '..', 'assets', 'themes');
const ATLAS_WIDTH = 960; // 320px cells: 3x the 106px card character.
const PORTRAIT_SIZE = 256; // About 3x the 88px picker portrait.
const QUALITY = 0.86;

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CC_BROWSER_CHANNEL ? { channel: process.env.CC_BROWSER_CHANNEL } : {}) });
  try {
    const page = await browser.newPage();
    const themeIds = fs.readdirSync(themesDir).filter(id => id !== 'references' && fs.statSync(path.join(themesDir, id)).isDirectory());
    for (const id of themeIds) {
      const dir = path.join(themesDir, id);
      const sources = fs.readdirSync(dir).filter(name => name.endsWith('-atlas.png'));
      if (sources.length !== 1) throw Error(`${id}: expected one *-atlas.png source, found ${sources.length}`);
      const png = fs.readFileSync(path.join(dir, sources[0])).toString('base64');
      const out = await page.evaluate(async ({ png, atlasWidth, portraitSize, quality }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${png}`;
        await image.decode();
        if (image.naturalWidth !== 1536 || image.naturalHeight !== 1024) throw Error(`Source atlas is ${image.naturalWidth}x${image.naturalHeight}, expected 1536x1024`);
        const encode = async (width, height, sx, sy, sw, sh) => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          context.imageSmoothingQuality = 'high';
          context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
          if (blob.type !== 'image/webp') throw Error('This browser cannot encode WebP');
          const bytes = new Uint8Array(await blob.arrayBuffer());
          let binary = '';
          for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return btoa(binary);
        };
        return {
          atlas: await encode(atlasWidth, atlasWidth * 2 / 3, 0, 0, 1536, 1024),
          portrait: await encode(portraitSize, portraitSize, 0, 0, 512, 512)
        };
      }, { png, atlasWidth: ATLAS_WIDTH, portraitSize: PORTRAIT_SIZE, quality: QUALITY });
      for (const [name, data] of [['atlas.webp', out.atlas], ['portrait.webp', out.portrait]]) {
        fs.writeFileSync(path.join(dir, name), Buffer.from(data, 'base64'));
      }
      const kb = name => (fs.statSync(path.join(dir, name)).size / 1024).toFixed(0);
      console.log(`${id}: atlas.webp ${kb('atlas.webp')} KB, portrait.webp ${kb('portrait.webp')} KB`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

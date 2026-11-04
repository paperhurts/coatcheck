// Builds the files the app loads from each companion's 1536x1024 source master: atlas.webp (scaled),
// portrait.webp (ready pose), and home-screen icons with a manifest.webmanifest that uses them.
// Pocket Paint Pals' icons are scaled from icon-180.png. Run with Playwright available, or set
// PLAYWRIGHT_MODULE; set CC_BROWSER_CHANNEL=msedge to use installed Edge. Encoding happens in the browser's own canvas.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const themesDir = path.join(root, 'assets', 'themes');
const ATLAS_WIDTH = 960; // 320px cells: 3x the 106px card character.
const PORTRAIT_SIZE = 256; // About 3x the 88px picker portrait.
const QUALITY = 0.86;
// The root manifest names the icons; every theme folder uses the same file names, plus the iOS touch icon.
const baseManifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
const ICONS = [{ src: 'icon-180.png', sizes: '180x180' }, ...baseManifest.icons].map(icon => ({ name: icon.src, size: parseInt(icon.sizes, 10), maskable: icon.purpose === 'maskable' }));
const css = fs.readFileSync(path.join(root, 'themes.css'), 'utf8');
function primer(id) {
  const match = css.match(new RegExp(`html\\[data-companion-theme="${id}"\\] \\{[^}]*--primer: (#[0-9a-f]{6})`));
  if (!match) throw Error(`${id}: no --primer in themes.css`);
  return match[1];
}
const save = (dir, files) => {
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), Buffer.from(data, 'base64'));
  return Object.keys(files).map(name => `${name} ${(fs.statSync(path.join(dir, name)).size / 1024).toFixed(0)} KB`).join(', ');
};
// Runs in the page: canvas -> base64 in the requested format.
const encoderSource = `async (canvas, type, quality) => {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
  if (blob.type !== type) throw Error('This browser cannot encode ' + type);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}`;

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CC_BROWSER_CHANNEL ? { channel: process.env.CC_BROWSER_CHANNEL } : {}) });
  try {
    const page = await browser.newPage();
    await page.evaluate(`window.encodeCanvas = ${encoderSource}`);

    // Pocket Paint Pals: icon-180.png is the 16x16 sprite on an 18-cell grid of 10px pixels. Whole-pixel
    // scaling with smoothing off keeps it crisp; the maskable copy fits the grid inside the 80% safe circle.
    const pixel = fs.readFileSync(path.join(root, 'icon-180.png')).toString('base64');
    const pixelIcons = await page.evaluate(async ({ pixel, icons }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${pixel}`;
      await image.decode();
      if (image.naturalWidth !== 180 || image.naturalHeight !== 180) throw Error('icon-180.png must be 180x180');
      const files = {};
      for (const { name, size, maskable } of icons) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, 1, 1, 0, 0, size, size); // The corner pixel is the background.
        context.imageSmoothingEnabled = false;
        const side = Math.floor((maskable ? size * 0.4 * Math.SQRT2 : size) / 18) * 18;
        const offset = (size - side) / 2;
        context.drawImage(image, offset, offset, side, side);
        files[name] = await encodeCanvas(canvas, 'image/png');
      }
      return files;
    }, { pixel, icons: ICONS.filter(icon => icon.name !== 'icon-180.png') });
    console.log(`pocket-paint-pals: ${save(root, pixelIcons)}`);

    const themeIds = fs.readdirSync(themesDir).filter(id => id !== 'references' && fs.statSync(path.join(themesDir, id)).isDirectory());
    for (const id of themeIds) {
      const dir = path.join(themesDir, id);
      const sources = fs.readdirSync(dir).filter(name => name.endsWith('-atlas.png'));
      if (sources.length !== 1) throw Error(`${id}: expected one *-atlas.png source, found ${sources.length}`);
      const png = fs.readFileSync(path.join(dir, sources[0])).toString('base64');
      const background = primer(id);
      const files = await page.evaluate(async ({ png, atlasWidth, portraitSize, quality, icons, background }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${png}`;
        await image.decode();
        if (image.naturalWidth !== 1536 || image.naturalHeight !== 1024) throw Error(`Source atlas is ${image.naturalWidth}x${image.naturalHeight}, expected 1536x1024`);
        const scaled = (width, height, sx, sy, sw, sh) => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          context.imageSmoothingQuality = 'high';
          context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
          return canvas;
        };
        const files = {
          'atlas.webp': await encodeCanvas(scaled(atlasWidth, atlasWidth * 2 / 3, 0, 0, 1536, 1024), 'image/webp', quality),
          'portrait.webp': await encodeCanvas(scaled(portraitSize, portraitSize, 0, 0, 512, 512), 'image/webp', quality)
        };

        // Frame the ready pose by its opaque pixels: the bounding box for plain icons, and the farthest
        // pixel from its centre for maskable ones, which launchers may crop to any shape inside the 80% circle.
        // The flat palette background matches the manifest's background_color on Android's launch screen.
        const cell = scaled(512, 512, 0, 0, 512, 512);
        const { data } = cell.getContext('2d').getImageData(0, 0, 512, 512);
        const opaque = [];
        for (let i = 3; i < data.length; i += 4) if (data[i] > 24) opaque.push((i - 3) / 4);
        let left = 512, top = 512, right = 0, bottom = 0;
        for (const p of opaque) {
          const x = p % 512, y = (p - x) / 512;
          left = Math.min(left, x); right = Math.max(right, x + 1); top = Math.min(top, y); bottom = Math.max(bottom, y + 1);
        }
        const cx = (left + right) / 2, cy = (top + bottom) / 2;
        let reach = 0;
        for (const p of opaque) reach = Math.max(reach, Math.hypot(p % 512 + 0.5 - cx, Math.floor(p / 512) + 0.5 - cy));
        for (const { name, size, maskable } of icons) {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = size;
          const context = canvas.getContext('2d');
          context.fillStyle = background;
          context.fillRect(0, 0, size, size);
          const scale = maskable ? size * 0.38 / reach : size * 0.86 / Math.max(right - left, bottom - top);
          context.imageSmoothingQuality = 'high';
          context.setTransform(scale, 0, 0, scale, size / 2 - cx * scale, size / 2 - cy * scale);
          context.drawImage(cell, 0, 0);
          files[name] = await encodeCanvas(canvas, 'image/png');
        }
        return files;
      }, { png, atlasWidth: ATLAS_WIDTH, portraitSize: PORTRAIT_SIZE, quality: QUALITY, icons: ICONS, background });
      // Same start_url as the root manifest, so browsers treat every theme's manifest as the same app.
      const manifest = { ...baseManifest, start_url: `${path.relative(dir, path.resolve(root, baseManifest.start_url)).split(path.sep).join('/')}/`, background_color: background, theme_color: background };
      fs.writeFileSync(path.join(dir, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(`${id}: ${save(dir, files)}`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

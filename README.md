# CoatCheck* 🎨⛈️

> **When the air lets you paint small worlds.**

**CoatCheck\*** is a smart, highly reactive, and playful weather desk built specifically for miniature painters, scale modelers, and hobbyists. It translates raw weather forecasts from the National Weather Service (NWS) into direct, actionable hobby advisories (ideal spray painting windows, dry-tip alerts, or clear-coat varnish frosting threats).

The live application is hosted at: **[paperhurts.github.io/coatcheck/](https://paperhurts.github.io/coatcheck/)**
And you can play with a full scenario playground at: **[paperhurts.github.io/coatcheck/example.html](https://paperhurts.github.io/coatcheck/example.html)**

---

## ✨ Features

### 1. Cyber-Brutalist Visual Design
*   Designed to seamlessly match the minimalist, utility-first style of **[paperhurts.dev\*](https://paperhurts.dev/)**.
*   Built with a deep, comfortable **midnight primer theme** (`#0c0814`) with a subtle hobbyist **cutting-mat grid pattern** background.
*   Employs highly legible typography ("DM Mono" for specs and "DM Serif Display" for card headings) with spinning asterisk hover animations!

### 2. Adorable Multi-Color Pixel Art Sprites
Includes **7 cute, custom-designed 16x16 pixel-art weather sprites** compiled directly as path-optimized, crisp, scalable vector SVGs:
*   `perfect`: A happy, smiling rattle primer spray can spraying sparkly mist.
*   `good`: A cheerful dropper bottle standing next to a wet paintbrush tip.
*   `cloudy`: A curious cloud with big eyes and pink blush cheeks holding a paintbrush.
*   `humid`: A sweating, worried dropper bottle dripping a giant water bead.
*   `rainy`: A tiny knight helmet looking sad in a heavy downpour of rain.
*   `cold`: A paintbrush frozen solid inside a shivering ice block shell.
*   `hot`: A melting, exhausted acrylic paint pot with dizzy cross-eyes and sweat beads.

### 3. Detailed Hourly Suitability timelines
Clicking on any day card expands an hour-by-hour visual timeline (from 8:00 AM to 6:00 PM). Clicking on any hour displays a custom-tailored **Miniature Painter's Field Report** explaining the climate:
*   **Varnish Frosting Alert:** Traps moisture when humidity exceeds safe thresholds, warning against clear-coating.
*   **Dry-Tip Warn:** Prompts wet palette usage when temperature spikes.
*   **Sputter Warning:** Advises warming up spray cans in warm water when the ambient temperature is too chilly.

### 4. Live Calibration Sliders
Open the **⚙ Customize** drawer to calibrate the application's math to your personal spray tolerance:
*   *Minimum Safe Temperature* (Default: `50°F`)
*   *Maximum Safe Temperature* (Default: `90°F`)
*   *Maximum Safe Humidity* (Default: `70%`)
*   *Maximum Rain Probability* (Default: `20%`)
*   *Recalculation:* Dragging any slider **instantly recalculates and redraws** both the live or offline dashboards in real-time!

### 5. Procedural Synthesizer Workbench Toy
Resting on the workshop bench is an interactive 3D-feeling rattle can:
*   **Shake Can 🫨**: Synthesizes the metallic clack-clack sound of a steel mixing ball hitting the inner walls using Web Audio wave sweeps.
*   **Test Spray 💨**: Synthesizes a high-pressure aerosol spray hiss and **emits physical, colorful paint splatters** flying across your screen!

---

## ♡ Pick a painting companion

Use **♡ Theme** on the live forecast or demo to choose among **nine completed themes**: the original **Pocket Paint Pals** and eight illustrated companion sets. Choose from the dropdown or open **Meet all the painting pals** to pick a portrait. Each illustrated theme has its own palette and six weather/bench poses. Your choice is remembered in this browser and shared between the two pages. Theme changes keep your open day, selected hour, and forecast advice in place.

Meet **Sister Sprinkles**, **Blueberry Battle Buddies**, **Greater Goodies**, **Little Miss Heresy**, **Nibbly Nids**, **Sleepy Tomb Beans**, **Dakka Ducklings**, and **Sunbeam Seraphs**. All are selectable now, with complete weather artwork. See [THEMES.md](THEMES.md) for their palettes, source prompts, and how to add another set.

The [interactive sisters sample](sisters-preview.html) includes six illustrative weather days, character quotes, and the primer-can bench. It shares artwork with the live theme; it does not request live forecasts.

## 📂 File Directory

*   `index.html` — The main weather application dashboard with live NWS API requests and browser Geolocation city-resolving.
*   `example.html` — A static demo playground featuring a sprite gallery and 7 pre-populated extreme weather cards (hot, freezing, humid, rainy, etc.) to showcase all app states side-by-side regardless of local weather.
*   `manifest.webmanifest` — Standard web manifest declaring PWA standalone launch parameters, colors, and icons. Each companion folder has its own copy with that theme's colors and icons.
*   `icon-180.png` — An adorable 180x180 PWA home screen icon featuring the custom "Perfect Spray Can" pixel mascot on our midnight primer background. `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` are pixel-perfect enlargements built from it.
*   `README.md` — This file!
*   `themes.js` / `themes.css` — Shared companion picker, persistence, character mapping, and theme styling.
*   `assets/themes/` — Eight complete illustrated companion sets (source masters plus the small `atlas.webp`/`portrait.webp` the app loads, and each companion's home-screen icons and manifest), artwork prompts/provenance, and original character references.
*   `tools/build-theme-art.cjs` — Optional Playwright script that rebuilds the web-size companion art, icons, and theme manifests from the source masters.
*   `tests/themes-check.cjs` — Optional Playwright regression check for the companion themes.
*   `THEMES.md` — Theme roster, asset contract, and verification instructions.

---

## 📱 Mobile PWA Installation

Pick your companion under **♡ Theme** first: it becomes the app icon when you install. To switch the icon later, remove CoatCheck from your home screen and add it again.

### On iOS (Safari)
1.  Navigate to your live link: `https://paperhurts.github.io/coatcheck/`
2.  Tap the **Share** button (the arrow-out-of-box icon).
3.  Scroll down and tap **Add to Home Screen**.
4.  Launch **CoatCheck\*** directly from your home screen as a full-screen, standalone app!

### On Android (Chrome)
1.  Navigate to your live link in Chrome.
2.  Tap the **three-dot menu** button in the top right.
3.  Tap **Install App** or **Add to Home Screen**.

---

## 🛠️ Local Development & Contributions
Since the entire application is written using **pure Vanilla HTML, CSS, and JS**, there are zero dependencies or build scripts to compile:
*   Simply clone the files and open `index.html` or `example.html` directly in any web browser!
*   To host it, simply push the repository to **GitHub Pages** (Settings → Pages → Source: Deploy from branch).

---

*“Clean primers, smooth brushes, and happy model building!”* 🌟

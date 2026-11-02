# Little painting companions

All nine themes are complete and selectable on `index.html` and `example.html`. Each of the eight illustrated sets has six character poses and its own palette. **Pocket Paint Pals**, the existing pixel art, remains the default until a visitor chooses a companion.

| Theme / artwork prompts | Companion | Palette |
| --- | --- | --- |
| Pocket Paint Pals | Original painting tools and weather sprites | Midnight primer and neon |
| [Sister Sprinkles](assets/themes/sister-sprinkles/artwork-notes.txt) | White-haired armored painting sisters | Aubergine, mint, and lavender |
| [Blueberry Battle Buddies](assets/themes/blueberry-battle-buddies/artwork-notes.txt) | Poppy, a cheerful redhead in blue-and-gold armor | Navy and warm gold |
| [Greater Goodies](assets/themes/greater-goodies/artwork-notes.txt) | Pip and a helpful hovering drone | Deep teal, cream, and coral |
| [Little Miss Heresy](assets/themes/little-miss-heresy/artwork-notes.txt) | Hexie, a mischievous little chaos companion | Dark plum, antique gold, and rose |
| [Nibbly Nids](assets/themes/nibbly-nids/artwork-notes.txt) | Niblet, a tiny ivory-and-purple space creature | Purple carapace and soft bone |
| [Sleepy Tomb Beans](assets/themes/sleepy-tomb-beans/artwork-notes.txt) | Dozy, an ancient robot with glowing green eyes | Tomb green, ivory, and lime |
| [Dakka Ducklings](assets/themes/dakka-ducklings/artwork-notes.txt) | Gubbin, an exuberant green hobby buddy | Olive workshop, brass, and warm red |
| [Sunbeam Seraphs](assets/themes/sunbeam-seraphs/artwork-notes.txt) | Sunny, a winged golden painting saint | Velvet plum, ivory, and gold |

The seven character references were supplied by the project owner. Every reference has now received the same complete weather treatment as Sister Sprinkles. The drawer’s **Meet all the painting pals** gallery uses the finished ready-pose artwork as selectable portraits, including a tile for the original pixel pals. There are no coming-soon or disabled choices.

See the [phone portrait picker](docs/previews/all-companions-picker.png) and rendered pose previews for [Pip](docs/previews/greater-goodies-poses.png), [Hexie](docs/previews/little-miss-heresy-poses.png), [Niblet](docs/previews/nibbly-nids-poses.png), [Dozy](docs/previews/sleepy-tomb-beans-poses.png), [Gubbin](docs/previews/dakka-ducklings-poses.png), and [Sunny](docs/previews/sunbeam-seraphs-poses.png).

## Shared behavior

`themes.js` owns the roster and the `cc_theme` browser preference. It validates stored IDs against the roster, falls back to Pocket Paint Pals for unknown themes, and handles unavailable storage without breaking its picker. A storage event updates the companion in other open tabs. Both dropdown and portrait selection update the same preference and accessible selection state. Pages load it without `defer`, so a saved palette is applied before the first paint; it also keeps the `theme-color` meta (the installed app's status bar) in step with the palette. The theme drawer and the live page's location/settings drawers close each other, so only one panel is open at a time.

The forecast engine owns weather data, thresholds, suitability, hourly advice, and expansion. The theme module changes only marked character holders and CSS variables. It retains original pixel markup so visitors can switch back without a forecast reload, losing their open day, or resetting the selected hour. A mutation observer reapplies the choice after async forecasts or calibration redraws. Page layout stays in each page's own styles; their glows and tints derive from the palette variables (`color-mix`), so every palette recolors them.

## Artwork contract

Character holders use `data-weather-sprite` with one of these states:

| Weather key | Companion pose | Atlas position |
| --- | --- | --- |
| `perfect`, `good` | Painting a miniature | Top left |
| `cloudy`, `humid` | Inspecting varnish | Top center |
| `rainy` | Sheltering miniatures | Top right |
| `cold` | Wrapped in a scarf | Bottom left |
| `hot` | Cooling off with a palette | Bottom center |
| `bench` | Shaking a primer can | Bottom right |

Each theme folder `assets/themes/<theme-id>/` holds one source master, `*-atlas.png`: three columns and two rows at 1536 × 1024 pixels, with alpha transparency (`sisters-atlas.png` and `blueberry-atlas.png` for the first two sets, `<theme-id>-atlas.png` for the rest). The pages never load the masters. `tools/build-theme-art.cjs` turns each one into the files the app uses:

| File | Size | Used for |
| --- | --- | --- |
| `atlas.webp` | 960 × 640 (320px cells, 3× the 106px card character), about 200 KB | Forecast cards, scenario demo, primer-can bench |
| `portrait.webp` | 256 × 256 crop of the ready pose, about 25 KB | **Meet all the painting pals** gallery |

Run it after adding or editing a master (same Playwright setup as the test below): `node tools/build-theme-art.cjs`. The links above record source prompts and edits, generated with the built-in OpenAI image-generation tool. Original owner-supplied references are preserved in `assets/themes/references/`; the app does not load them.

The six poses cover painting a miniature, inspecting varnish, sheltering a miniature from rain, shivering in a scarf, fanning with a palette, and shaking a primer can. Details suit the companion: Pip’s drone becomes a rain canopy, Niblet uses little claws, Dozy conveys emotion with glowing eyes, and Sunny folds her wings to fit the cards. Each hot pose has a clean little sun. All illustrated sets share compact character sizing and gallery layout through `data-companion-style="illustrated"`; the reduced-motion rule applies to every theme.

For each future theme, prepare all six poses with consistent scale, framing, and transparency, and save the master as `assets/themes/<theme-id>/<theme-id>-atlas.png`. Run the build tool, add a registry entry with an `artClass`, and add theme CSS for its `atlas.webp` and palette, including `--hot` and `--cold`. The generic character renderer uses that class and the six shared pose positions. Do not use a reference image as a fallback for missing poses. Themes must leave the whole-day card and full hourly strip together, honor reduced motion, and remain usable at 320px.

## Verification

The app still has no build step. Open either HTML page directly, or serve this directory using the machine’s registered server/port rules.

`tests/themes-check.cjs` is an optional browser regression check using Playwright. It is a plain Node script, not a `@playwright/test` spec. With Playwright installed in your development environment, run:

```sh
node tests/themes-check.cjs
```

If it is installed elsewhere, set `PLAYWRIGHT_MODULE` to the module path. Set `CC_BROWSER_CHANNEL=msedge` to use installed Edge instead of Playwright’s Chromium. The check uses local files, deterministic intercepted NWS responses, and a clock pinned to a fixed winter day, so it gives the same result in any season; it starts no server and contacts no weather service.

It checks both pages, all nine choices and palettes, the `theme-color` sync, drawer coordination, all 48 illustrated poses, atlas/portrait loading and dimensions, stored choices, cross-tab synchronization, open-day/selected-hour preservation, calibration redraws, returning to the original sprites, that the pixel theme leaves fresh sprites alone, invalid theme IDs, unavailable storage, keyboard/portrait selection, reduced motion for every theme, and 320/390/1024px layouts. Any page error on any tested page fails the run.

# Little painting companions

The completed illustrated sets are **Sister Sprinkles** and **Blueberry Battle Buddies**. Both `index.html` and `example.html` offer them alongside **Pocket Paint Pals**, the existing pixel art. The default remains Pocket Paint Pals until a visitor chooses a companion.

| Theme | Character family | Status |
| --- | --- | --- |
| Pocket Paint Pals | Original painting tools and weather sprites | Ready |
| Sister Sprinkles | White-haired armored painting sisters | Ready |
| Blueberry Battle Buddies | Poppy, the cheerful redhead in blue-and-gold armor | Ready |
| Greater Goodies | T’au and their hovering helpers | Reference ready |
| Little Miss Heresy | Chaos companions | Reference ready |
| Nibbly Nids | Tyranid little nibblers | Reference ready |
| Sleepy Tomb Beans | Necron companions | Reference ready |
| Dakka Ducklings | Ork companions | Reference ready |
| Sunbeam Seraphs | Winged golden saints | Reference ready |

The seven reference illustrations were supplied by the project owner. Blueberry Battle Buddies now has a complete weather atlas based on its reference; the remaining six references appear under “Meet the next little companions” with disabled options until their sets are complete. The remaining sets are intended for this same PR, following the redhead’s design pass.

## Shared behavior

`themes.js` owns the roster and the `cc_theme` browser preference. It validates stored IDs against completed sets, falls back to Pocket Paint Pals for unknown or unfinished themes, and handles unavailable storage without breaking its picker. A storage event updates the companion in other open tabs.

The forecast engine owns weather data, thresholds, suitability, hourly advice, and expansion. The theme module changes only marked character holders and CSS variables. It retains original pixel markup so visitors can switch back without a forecast reload, losing their open day, or resetting the selected hour. A mutation observer reapplies the choice after async forecasts or calibration redraws.

## Artwork contract

Character holders use `data-weather-sprite` with one of these states:

| Weather key | Sister pose | Atlas position |
| --- | --- | --- |
| `perfect`, `good` | Painting a miniature | Top left |
| `cloudy`, `humid` | Inspecting varnish | Top center |
| `rainy` | Sheltering miniatures | Top right |
| `cold` | Wrapped in a scarf | Bottom left |
| `hot` | Cooling off with a palette | Bottom center |
| `bench` | Shaking a primer can | Bottom right |

Both completed atlases have three columns and two rows at 1536 × 1024 pixels, with alpha transparency. Sister Sprinkles’ heat pose uses `sisters-heat-atlas-v2.png`, which has the cleaned-up sun. Every other sister pose uses the original atlas. Blueberry Battle Buddies uses one `blueberry-atlas.png` for all six poses, including a clean little sun on the heat pose. Each theme directory contains its artwork prompt and provenance.

Poppy’s six poses cover painting a tiny green miniature, inspecting a cloudy varnish bottle, sheltering her miniature under an umbrella, shivering in a scarf, fanning herself with a palette, and shaking a primer can. Her theme uses navy surfaces, warm gold caution accents, mint good conditions, and rose bench-day accents. Both illustrated sets share the same compact character sizing, gallery layout, and reduced-motion rules through `data-companion-style="illustrated"`.

For each future theme, prepare all six poses with consistent scale, framing, and transparency; give its registry entry an `artClass` and theme CSS for its atlas and layout; then mark it ready. The generic character renderer uses that class and the six shared pose positions. Do not use a reference image as a fallback for missing poses. Themes must leave the whole-day card and full hourly strip together, honor reduced motion, and remain usable at 320px.

## Verification

The app still has no build step. Open either HTML page directly, or serve this directory using the machine’s registered server/port rules.

`tests/themes.spec.cjs` is an optional browser regression check using Playwright. With Playwright installed in your development environment, run:

```sh
node tests/themes.spec.cjs
```

If it is installed elsewhere, set `PLAYWRIGHT_MODULE` to the module path. Set `CC_BROWSER_CHANNEL=msedge` to use installed Edge instead of Playwright’s Chromium. The check uses local files and deterministic intercepted NWS responses; it starts no server and contacts no weather service.

It checks both pages, stored choices, all poses and reference images, open-day/selected-hour preservation, calibration redraws, returning to the original sprites, invalid theme IDs, unavailable storage, keyboard dismissal, and narrow phone layouts.

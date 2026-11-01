# Little painting companions

The first illustrated set is **Sister Sprinkles**. Both `index.html` and `example.html` offer it alongside **Pocket Paint Pals**, the existing pixel art. The default remains Pocket Paint Pals until a visitor chooses a companion.

| Theme | Character family | Status |
| --- | --- | --- |
| Pocket Paint Pals | Original painting tools and weather sprites | Ready |
| Sister Sprinkles | White-haired armored painting sisters | Ready |
| Blueberry Battle Buddies | Blue-armored space marines | Reference ready |
| Greater Goodies | T’au and their hovering helpers | Reference ready |
| Little Miss Heresy | Chaos companions | Reference ready |
| Nibbly Nids | Tyranid little nibblers | Reference ready |
| Sleepy Tomb Beans | Necron companions | Reference ready |
| Dakka Ducklings | Ork companions | Reference ready |
| Sunbeam Seraphs | Winged golden saints | Reference ready |

The seven reference illustrations were supplied by the project owner. They are a direction for future full sets, not interchangeable weather poses. The picker shows them under “Meet the next little companions” and disables their options until those sets are complete.

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

The completed atlas has three columns and two rows at 1536 × 1024 pixels, with alpha transparency. The heat pose uses `sisters-heat-atlas-v2.png`, which has the cleaned-up sun. Every other pose uses the original atlas. Source prompts and edits are recorded in `assets/themes/sister-sprinkles/artwork-notes.txt`.

For each future theme, prepare all six poses with consistent scale, framing, and transparency; give its registry entry an `artClass` and theme CSS for its atlas and layout; then mark it ready. The generic character renderer uses that class and the six shared pose positions. Do not use a reference image as a fallback for missing poses. Themes must leave the whole-day card and full hourly strip together, honor reduced motion, and remain usable at 320px.

## Verification

The app still has no build step. Open either HTML page directly, or serve this directory using the machine’s registered server/port rules.

`tests/themes.spec.cjs` is an optional browser regression check using Playwright. With Playwright installed in your development environment, run:

```sh
node tests/themes.spec.cjs
```

If it is installed elsewhere, set `PLAYWRIGHT_MODULE` to the module path. Set `CC_BROWSER_CHANNEL=msedge` to use installed Edge instead of Playwright’s Chromium. The check uses local files and deterministic intercepted NWS responses; it starts no server and contacts no weather service.

It checks both pages, stored choices, all poses and reference images, open-day/selected-hour preservation, calibration redraws, returning to the original sprites, invalid theme IDs, unavailable storage, keyboard dismissal, and narrow phone layouts.

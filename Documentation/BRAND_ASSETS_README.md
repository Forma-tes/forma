# Pocket brand assets

All assets are original vector artwork created for the Pocket personal-finance web app.

## Files
- `pocket-logo-horizontal.svg` / `.png` — primary horizontal wordmark for headers, documents and marketing.
- `pocket-logo-horizontal-dark.svg` / `.png` — horizontal wordmark for dark backgrounds.
- `pocket-logo-stacked.svg` / `.png` — stacked lockup for centered layouts and splash screens.
- `pocket-mark.svg` / `.png` — standalone brand mark for compact UI placements.
- `pocket-app-icon.svg` / `.png` — light app icon.
- `pocket-app-icon-dark.svg` / `.png` — dark app icon.
- `favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon-180.png`, `favicon-192.png`, `favicon-512.png` — raster icon sizes for browser and app contexts.

## Web app integration
- The sidebar, auth/loading screens, and first-account setup wizard use `/brand/pocket-mark.svg`.
- `public/favicon.svg` is registered as the browser favicon in `index.html`.
- `index.html` also registers the app icon as an Apple touch icon.

The SVGs are scalable and recommended for the web wherever supported. PNGs are included for design handoff and platforms that need raster assets.

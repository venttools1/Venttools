# Vent Tools v4 development

This is the first split-file build:

- `index.html` — page structure
- `style.css` — appearance and mobile layout
- `script.js` — calculators and live SVG diagrams

The calculation logic was carried over from the current site build.

## Safe testing workflow

1. Keep the current `main` branch live.
2. Create a branch named `v4-development`.
3. Upload all three files to that branch.
4. Test the Cloudflare preview deployment.
5. Merge into `main` only after site testing.

## Upload rule

All three files must stay together in the repository root.


## Current v4 drawing update

- Diameter up to 250 mm: pressed-bend visual style.
- Diameter above 250 mm: segmented/lockseamed visual style.
- Calculator mathematics remains unchanged.
- The fitting appearance is an original schematic, not a copied manufacturer drawing.


## Technical drawing revision 2

The offset SVG was rebuilt around the actual two-bend arrangement:
horizontal spiral → bend → cut straight L → bend → horizontal spiral.
The selected bend angle now controls the visible bend geometry. The drawing is an
original Vent Tools schematic and the calculator maths remains unchanged.


## Bend measurement database update

The supplied manufacturer data has now been added for BFU lockseamed bends:

- 15°: 250–1250 mm
- 30°: 250–1250 mm
- 45°: 250–1250 mm
- 60°: 250–1250 mm
- 90°: 250–1250 mm

The supplied BU pressed 45° data is used for listed sizes up to and including
250 mm. Exact listed combinations show “Manufacturer table”; unsupported sizes,
22.5°, and custom angles fall back to `rm × tan(angle/2)` and are clearly marked
as estimates.

Important: the 112 mm BU 45° table entry has been transcribed as 81 mm exactly
as displayed in the supplied sheet. It should be physically checked before that
specific combination is relied upon, because it differs sharply from adjacent sizes.


## Branding update

- Compact Vent Tools brand header added to every calculator page.
- Logo mark, tool name and v4 Beta badge remain visible while scrolling.
- Browser favicon added using the Vent Tools symbol.
- Footer branding standardised across the site.


## Live homepage update

- Removed the “v4 development build” banner.
- Added professional live-site wording and feature badges.
- Homepage now separates live tools, tools in development and technical resources.
- Removed unclear bend-calculator placeholders.
- Technical resources are described as links to official manuals and guidance rather than copied standards.

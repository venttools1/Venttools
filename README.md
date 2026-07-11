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

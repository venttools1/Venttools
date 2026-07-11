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


## Homepage duplication fix

- Removed the duplicated legacy “In development” block.
- Homepage now contains exactly three sections: Live tools, Coming soon and Technical resources.
- Removed repeated “Coming soon” badges from cards.
- Updated the browser title for the live site.


## BSB fire damper calculator beta
Supports FSD-TD methods M5, M6, M9, M10 and M11, plus FSD-C M9, M10 and M11. Each result links to the official BSB manual and includes a verification warning.


## Accuracy correction before release

- FSD-C uses M9 for drywall, M10 for masonry wall/floor, and M14 for flexible fire curtain.
- FSD-C M10 is fixed at nominal diameter +20 mm; the user-selectable allowance was removed.
- FSD-C M14 is presented as nominal damper size with a +10 mm trimming tolerance.
- FSD-TD M5, M6, M9, M10 and M11 opening rules were checked against the official BSB IOM.


## v4.2 — Actionair CSS beta

Added a manufacturer-aware fire-damper framework and the first Actionair by Swegon product: CSS.

Supported CSS methods from Actionair CSS Installation Guide LNNN00356 v6.0 dated 27 May 2025:
- Vertical plasterboard wall: square finished opening casing diameter +10–40 mm; cut size adds two aperture-lining board thicknesses.
- Vertical masonry wall: square opening casing diameter +10–40 mm, or circular opening +10–30 mm.
- Horizontal concrete slab: square opening casing diameter +10–30 mm. Circular slab mode is intentionally disabled because the guide prose and drawing show conflicting maximum allowances.

The user selects an allowance within the published permitted range. Default is 20 mm total (10 mm nominal each side). Results display the official drawing reference, guide revision and direct official-manual link.


## v4.3 Actionair DWFX-F beta

Added DWFX-F / DWFX-3F methods from Actionair guide LNNN00354 v6.0 dated 17 March 2026. Inputs use measured overall casing dimensions; SmokeShield width must include the 28 mm PTC shroud. Supported automatic methods include plasterboard wall, plasterboard under slab, masonry under slab, shaftwall and composite panel. Masonry wall and timber-stud methods are link-only until a safe universal opening rule is confirmed from the official sizing tool/drawing.

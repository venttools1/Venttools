# VentTools V5 development

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
- Logo mark, tool name and V5 Beta badge remain visible while scrolling.
- Browser favicon added using the Vent Tools symbol.
- Footer branding standardised across the site.


## Live homepage update

- Removed the “V5 Beta build” banner.
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


## V5 — Actionair CSS beta

Added a manufacturer-aware fire-damper framework and the first Actionair by Swegon product: CSS.

Supported CSS methods from Actionair CSS Installation Guide LNNN00356 v6.0 dated 27 May 2025:
- Vertical plasterboard wall: square finished opening casing diameter +10–40 mm; cut size adds two aperture-lining board thicknesses.
- Vertical masonry wall: square opening casing diameter +10–40 mm, or circular opening +10–30 mm.
- Horizontal concrete slab: square opening casing diameter +10–30 mm. Circular slab mode is intentionally disabled because the guide prose and drawing show conflicting maximum allowances.

The user selects an allowance within the published permitted range. Default is 20 mm total (10 mm nominal each side). Results display the official drawing reference, guide revision and direct official-manual link.


## V5 Actionair DWFX-F beta

Added DWFX-F / DWFX-3F methods from Actionair guide LNNN00354 v6.0 dated 17 March 2026. Inputs use measured overall casing dimensions; SmokeShield width must include the 28 mm PTC shroud. Supported automatic methods include plasterboard wall, plasterboard under slab, masonry under slab, shaftwall and composite panel. Masonry wall and timber-stud methods are link-only until a safe universal opening rule is confirmed from the official sizing tool/drawing.


## V5 — Actionair HEVAC/HVCA Installation Frame beta

- Vertical installation frame in masonry wall:
  - SmokeShield PTC — AA/F10702
  - FireShield — AA/F10703
- Horizontal installation frame in concrete slab:
  - FireShield — AA/F10701

Enter the measured outside dimensions of the installation-frame upstand, excluding building ties. The official drawing permits a 5–75 mm clear mortar gap on every side, so the result adds twice the selected side gap to both frame dimensions.


## Vent Tools v5 polish pass 1

- Official manufacturer manual link is now a prominent blue button.
- Button text changes automatically between BSB and Actionair.
- Copy Result and New Calculation buttons use clearer labels and icons.
- Builder's Opening result card is more visually prominent.
- Mobile action buttons stack vertically for easier site use.


## VentTools V5 visual identity build

- Rebuilt the homepage as a professional mobile-first HVAC dashboard.
- Replaced generic emoji-only cards with real installation photography supplied by the site owner.
- Added real spiral offset, segmented bend, branch and full-system imagery.
- Ductwrap now uses a round segmented bend image rather than a rectangular fitting.
- Removed remaining V4 labels and changed the visible release badge to V5 Beta.
- Added latest updates, supported manufacturers and an authentic “built by a duct fitter” section.
- Existing calculators and calculations remain intact.


## V5 mobile-upload package

All homepage photographs are now embedded directly into the website files as data URIs.

This means GitHub mobile users only need to upload four files:

- index.html
- style.css
- script.js
- README.md

No assets folder is required.


## VentTools V5 live-ready package

This package is ready for the development branch and includes:

- Full VentTools V5 visual homepage
- Embedded site photography, so no assets folder is required
- BSB and Actionair fire damper calculators
- CSS, DWFX-F / DWFX-3F and HEVAC / HVCA support
- Prominent official-manual buttons
- All visible version labels standardised to V5 Beta
- Cloudflare Workers configuration in `wrangler.jsonc`

### Cloudflare build settings

- Build command: none
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

The `wrangler.jsonc` file supplies the Worker name, compatibility date and static-assets directory.


## V5.1 offset improvement

- Added automatic minimum-rise calculation for the selected minimum straight between bends.
- Shows the exact rise needed with the current offset/over measurement.
- Shows how much the current rise must increase.
- Warning messages now give a practical target instead of requiring trial and error.
- Removed the Northern Ireland wording from the homepage/footer.


## V5.2 Professional Web / PWA release

- Added installable web app manifest.
- Added 192 px and 512 px VentTools app icons.
- Added Install VentTools button with Android install prompt support.
- Added iPhone/iPad Add to Home Screen instructions.
- Added service worker for offline access to the core app.
- Added robots.txt and sitemap.xml.
- Added Open Graph sharing metadata.


## V5.3 Actionair opening-data phase 1

- CSS now defaults to the official mean opening allowance of +30 mm.
- CSS retains minimum/mean/maximum choices where the installation method permits them.
- Added Actionair SmokeShield SPAN calculator:
  - SmokeShield 501 PTC rectangular
  - SmokeShield 601 PTC circular
- SPAN shows recommended opening plus permitted minimum and maximum range.
- Calculations were independently coded from factual dimensions in the uploaded Actionair Builders Work Opening Calculator V5.
- No Actionair spreadsheet layout, images or branded presentation are reproduced.


## V5.4 corrected image build

The first V5.4 package accidentally altered characters inside the embedded base64 photographs while removing old version labels. This corrected build starts from V5.3 and changes only known visible labels, leaving every embedded image untouched.


## VentTools V5.5 — Lindab phase 1

- Removed the homepage version badge; the release number is now shown only in the footer.
- Added Lindab as a manufacturer.
- Logged and coded first-phase opening rules for:
  - FNC1
  - WH25
  - WH45
  - WK45
  - WKS25
- Logged WK25 but left it as an official-method check because its booklet contains many installation-specific rules and no safe universal opening formula.
- Added range warnings and nominal-size checks for circular Lindab products.
- Results remain independent calculations and must be verified against the current official Lindab installation booklet.


## V5.5 Lindab selector correction

The Lindab calculation data was present in the first V5.5 build, but the visible manufacturer dropdown still contained only BSB and Swegon/Actionair. This corrected package adds Lindab to the manufacturer selector and refreshes the PWA cache.


## VentTools V5.6 — Official Lindab booklet links

- Added the exact official Lindab installation booklet link for:
  - FNC1
  - WH25
  - WH45
  - WK25
  - WK45
  - WKS25
- The manual button now names the selected Lindab product.
- The service-worker cache was updated so installed users receive the new links.


## VentTools V5.7 — WK25 Professional
Detailed WK25 installation routes, opening ranges, wall/seal requirements, pairing eligibility, orientation checks, minimum distances and official references.


## VentTools V5.7.3 — Clean test build

- Starts from the working V5.7 WK25 Professional package.
- Adds a visible life-safety notice inside the Fire Damper page.
- Highlights that the section is for people competent in fire damper work, or those under their direct supervision.
- Adds a visible final-verification panel above the result actions.
- Adds a concise independent-tool disclaimer.
- Updates the service-worker cache so the development build does not reuse an older interface.


## VentTools V5.7.4 — Clean upload build

- Moved the Fire Damper Safety Notice below the calculator heading.
- Shortened the notice so it does not dominate the page.
- Removed the Beta badge from the Fire Damper page.
- Kept the WK25 Professional wizard, final-verification panel and professional disclaimer.
- Updated the service-worker cache.


## VentTools V5.7.5 — Actionair SmokeShield nominal-size workflow

- Added a nominal-duct input mode to the Actionair DWFX-F SmokeShield PTC calculator.
- For rectangular SmokeShield sizes from 200 × 200 to 1000 × 1000 mm, VentTools now explains and calculates:
  - ordered nominal duct size
  - 5 mm undersize spigot
  - base damper casing
  - separate 28 mm PTC shroud projection
  - casing dimension used for the opening calculation
  - overall peripheral flange
  - finished opening and lined cut size
- Added a measured-casing fallback for small, older or unusual units.
- FireShield remains on measured-casing input because the SmokeShield PTC conversion must not be applied to it.
- Added 120 mm actuator-removal clearance and 200/75 mm separation reminders.


## VentTools V5.8 — Fire Damper Professional Standard

- Rebuilt the fire-damper result hierarchy around:
  1. structural hole to cut
  2. certified installation method
  3. nominal duct
  4. damper assembly
  5. finished opening
  6. structural cut size
- Added traceability status:
  - calculated from selected manufacturer method
  - derived from published manufacturer dimensions
  - manual measurement / official drawing required
- Added manufacturer-specific critical installation rules.
- The Actionair SmokeShield PTC DWFX-F result now clearly separates:
  - nominal duct
  - casing including the 28 mm PTC shroud
  - finished opening
  - board build-up
  - hole to cut
- Copy Result now includes every calculation stage and traceability status.
- No manufacturer image or drawing is embedded; image spaces remain a future permission-based enhancement.


## VentTools V5.8.1 — Live polish

- Removed duplicate Product/Damper and Manufacturer Reference cards.
- Renamed Calculation Rule to Calculation Summary.
- Reduced Source Document to a compact source strip.
- Converted Critical Installation Rules into a clear checklist.
- Shortened traceability badges.
- Added a dedicated Official Manufacturer Resources section.
- Made the official manufacturer installation manual the primary full-width button.
- Kept Copy Result and New Calculation as secondary VentTools actions.
- Updated service-worker cache for clean deployment.


## VentTools V5.9 — Lindab Professional

- Upgraded Lindab results to the VentTools Professional traceability standard.
- Added professional calculation stages and critical-rule checklists for circular and rectangular Lindab dampers.
- Expanded WK45 with certified options for rigid walls, light walls, safety walls, gypsum blocks, sandwich walls and floors.
- Included wet, dry and Fire Batt/Weichschott installation routes where published.
- Preserved the detailed WK25 single/paired wizard.
- Added a visible Lindab method-selection notice.
- Kept official Lindab installation booklets as the primary resource buttons.
- No manufacturer-owned photographs or installation drawings are embedded.


## VentTools V6.0 — BSB Professional

- Added AT-FSD, FD-C, FSD-C, FSD-TD and MFD-IC product routes.
- Standardised BSB results with Actionair and Lindab Professional layouts.
- Separates nominal size, finished aperture and structural cut.
- Applies drywall lining only where the selected BSB method requires it.
- Explicitly marks MFD-IC M9 as an unlined drywall opening.
- Adds tested support, sealing, spacing, edge-distance and access requirements.
- Keeps AT-FSD as official-drawing-required rather than inventing a universal formula.
- No BSB-owned images or drawings are embedded.

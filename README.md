# VentTools V1.0.17

Release label: Advanced Air post-render clear fix

- Prevents duplicate Android lifecycle/select refreshes from wiping a completed Advanced Air result.
- Keeps the diagram, verification banner and setting-out values visible after recalculation.
- True manufacturer, product and method changes still clear stale UI before recalculating.

# VentTools V1.0.17

**Internal release label:** Advanced Air Render-Lock Hotfix

This package keeps the public interface clean: the website shows only `VentTools V1.0.17` in the footer. The descriptive release label is retained here for development and change tracking.

## V1.0.14 changes

- Isolated and corrected the Advanced Air render/recalculation state fault.
- Prevented stale diagrams, banners and installation notes from another manufacturer remaining on screen.
- Added controlled recalculation after selection and mobile-keyboard changes.
- Kept the public version display to the footer only.

---

# VentTools V1.0 Engineering Edition — Four Manufacturer Audit

- BSB supported methods audited
- Advanced Air supported methods audited
- Swegon/Actionair OPE-backed and drawing-backed methods audited
- Lindab FNC1, WH25, WH45, WK25, WK45 and WKS25 supported methods audited
- Offline engineering library included with SHA-256 document manifest
- Unsupported/drawing-specific methods remain locked rather than guessed

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


## VentTools V6.0.1 — Trust Breakdown

- Replaced the vague BSB “Nominal + case/frame build-up” text with the actual arithmetic.
- BSB rectangular results now show:
  - nominal duct dimensions
  - the exact published width and height allowances
  - the resulting finished aperture
  - the lining-board thickness on each side
  - the final structural-cut arithmetic
- Renamed the flow stage to “Damper / frame build-up”.
- Added a short traceability note beneath the calculation flow.
- Updated the service-worker cache for clean deployment.


## VentTools V6.0.2 — Unified Interface Standard

- Replaced manufacturer-branded method-selector wording with the neutral heading:
  “Select Certified Installation Method”.
- Added one consistent explanation for Actionair, Lindab and BSB.
- Standardised the fire-damper workflow headings:
  - Select Manufacturer
  - Select Product
  - Select Certified Installation Method
  - Calculation Results
  - Nominal Damper Size
  - Damper / Frame Build-up
  - Finished Opening
  - Structural Hole to Cut
  - Critical Installation Requirements
  - Official Manufacturer Resources
  - Copy Results
  - Start New Calculation
- Added a clear independent-use notice stating that VentTools presents manufacturer-published tested methods and does not replace the current official manual.
- Removed wording that could imply a manufacturer owns or endorses the VentTools selector.
- No calculation logic was changed.
- Updated the service-worker cache for clean deployment.


## VentTools V6.1 — Advanced Air and usability update

- Added Advanced Air as a manufacturer.
- Added safe, source-table-based support for:
  - 0160 AFS wall methods
  - 0160 Trimoterm
  - 2530 AFS
  - 2530 HEVAC
  - 0400MAN
  - 0400FME
  - 0500MAN
- Kept 26SCD as official-table-required until its exact dimensional table is implemented.
- Added a prominent Square to Round shortcut in the homepage hero.
- Hid detailed calculation stages behind “Show Calculation Details”.
- Made the structural-hole heading dynamic:
  - “Structural Hole to Cut (including aperture lining)” when VentTools adds lining
  - “Opening Required by Selected Method” when the manufacturer table already defines the formed opening
- BSB lining calculations now name the selected aperture-lining thickness.
- Removed duplicate warning/disclaimer blocks and kept one clear independent-use notice.
- Updated the service-worker cache.


## VentTools V6.1.1 — Advanced Air official manual links

- Added a reusable Advanced Air document library.
- Linked 0160 directly to its official IOM.
- Linked 2530 directly to its official IOM.
- Linked 0400MAN, 0400FME and 0500MAN to the shared official 0400/0500 IOM.
- Linked 26SCD directly to its official IOM.
- Manual-button text now identifies the exact document being opened.
- Source-document text now matches the linked official document.
- Updated the service-worker cache.


## VentTools V6.1.2 — Manufacturer dropdown fix

- Added Advanced Air to the visible manufacturer dropdown.
- Retained Swegon — Actionair products, Lindab and BSB.
- No calculator logic changed.
- Updated the service-worker cache so the corrected dropdown is fetched.


## VentTools V6.1.3 — explicit opening ranges
- Added a dedicated Permitted Opening Range panel.
- Shows minimum and maximum width and height separately.
- Enabled for Advanced Air 0160 AFS, 2530 AFS and 2530 HEVAC.
- The main result remains the minimum published opening.
- Fixed-opening and tolerance-only methods remain unchanged.
- Updated the service-worker cache.


## VentTools V6.1.4 — Contact page

- Added a dedicated Contact page.
- Added a Contact link in the footer.
- Public contact address: info@venttools.com.
- Left the owner's personal name off the page.
- Added guidance for reporting calculator and installation-method issues.
- Added a clear independent-resource statement.
- Updated index.html, README, sitemap and the service-worker cache.


## VentTools V6.2.0 — professional site foundation

Added:
- About page
- Contact page using info@venttools.com
- Privacy Policy using privacy@venttools.com
- Cookie Policy
- Terms of Use
- Technical Disclaimer
- Complete footer navigation
- Cookie consent banner with equally accessible essential-only and analytics choices
- Reopenable cookie-preferences panel
- Consent event hook: `venttools:consent`
- Hash-aware legal-page navigation
- Network-first navigation handling in the service worker to reduce stale-version problems

Important:
- This release does not include Google Analytics, Microsoft Clarity or advertising code.
- Any future analytics code must read the recorded analytics consent before loading.
- Before AdSense is enabled for visitors in regions where consent is required, configure an appropriate consent-management platform and update the live privacy/cookie disclosures.
- Legal pages are practical website templates and should be reviewed if the business structure, data collection or services change.


## VentTools V6.2.1 — Google Analytics

- Added Google Analytics Measurement ID `G-KWBWNN0WCB`.
- Analytics only loads after a visitor chooses **Accept analytics**.
- Essential-only visitors are not sent to Google Analytics.
- Added consent updates and single-page page-view tracking.
- Advertising consent remains denied.
- Updated the Privacy and Cookie wording.
- Updated the index version and service-worker cache.

### Test after deployment

1. Upload this release to GitHub.
2. Open VentTools in a private/incognito window.
3. Choose **Accept analytics**.
4. Return to Google Analytics and press **Test installation**.
5. Check Realtime after opening several VentTools sections.


## VentTools V6.3.0 — Standalone legal and trust pages

- Reviewed the V6.2.1 Google Analytics implementation and retained consent-gated loading for Measurement ID `G-KWBWNN0WCB`.
- Added crawlable standalone About, Contact, Privacy, Cookie Policy, Terms and Disclaimer HTML files.
- Converted footer information links to normal links so search engines and AdSense reviewers can reach the pages without JavaScript.
- Retained the in-app versions of the same pages for installed/PWA use.
- Added every public information page to sitemap.xml.
- Updated the service-worker cache and visible release label to V6.3.0.
- Updated policy dates to 16 July 2026.


## VentTools V6.3.2 — Homepage and cache refresh

- Updated the homepage Latest updates panel to reflect the current release.
- Added Lindab and Advanced Air to the visible Supported manufacturers panel.
- Replaced the outdated More manufacturers planned card with a neutral under-review message.
- Updated visible version labels to V6.3.2.
- Changed the service-worker cache key so existing visitors receive the refreshed homepage and assets.
- Retained the existing install-app button and PWA behaviour.


## VentTools V6.3.2 — BSB drywall lining clarification

- Clarified that the two 12.5 mm D&F boards on each wall face form the tested drywall construction.
- Clarified that the aperture itself is lined with one board thickness at each internal edge.
- Structural cut remains finished aperture plus two lining-board thicknesses overall in width and height.
- Updated result wording and input guidance to prevent users adding the wall-face layers twice.
- Bumped the service-worker cache so existing users receive the corrected wording.


## VentTools V6.4.2 — Manual-led quick setting out

- Replaced the centred/custom-position controls with a manufacturer-led setting-out answer.
- Added the plain-site instruction: “mark the bottom of the structural opening X mm below the bottom of the nominal duct.”
- The answer is displayed only where the selected official method records enough information to split the opening above and below the duct.
- Where that position has not been verified, VentTools now says not to guess and directs the user to the official drawing.
- Added direct AFFL calculation from the known bottom-of-duct level.
- Aperture-lining thickness is automatically included below the finished opening where the selected method requires lining.
- Retained the prominent official manual link, traceability details and collapsible technical information.
- Updated the service-worker cache and visible version labels.


## VentTools V6.4.2 — Casing-mapped setting out

- Corrects the setting-out model so manufacturer clearance is measured from the damper casing, not automatically from the nominal duct.
- Maps BSB FSD-TD M5 as a complete dimension chain: nominal duct edge → 38 mm casing projection → 10 mm finished-aperture clearance → aperture-lining thickness.
- With the default 12.5 mm lining, M5 now instructs the fitter to start the structural opening 60.5 mm below the bottom of the nominal duct.
- Other methods remain locked to “Manual check required” until their casing projection and directional clearances are verified.
- The expanded explanation shows the full dimension breakdown without cluttering the main site instruction.
# VentTools V6.5 RC9

This build consolidates the four original manufacturers into one codebase:

- BSB
- Actionair
- Lindab
- Advanced Air

## Main change

VentTools now treats a result as a chain of verified geometry rather than one hole-size formula:

1. nominal duct;
2. actual casing or installation-frame geometry;
3. tested finished aperture;
4. structural opening, including lining only where required;
5. practical setting-out offsets;
6. support, penetration-seal, access and breakaway requirements.

## Safety behaviour

- No free-choice centring rule is presented as a manufacturer requirement.
- Asymmetric methods retain separate top, bottom, actuator-side and non-actuator-side values.
- Guidance-only methods do not return a fabricated opening.
- Audit conflicts remain visible.

## Release status

This is a regression-test beta, not an instruction to depart from the current manufacturer IOM or project fire strategy.


## Beta 3 interface update
The result page now places “Damper & Opening Details” and “Installation Requirements” immediately below the certified method, before Site Setting Out.


## V6.5 RC9 — main-site refresh release

- Removed the repeated post-result “Select Certified Installation Method” information panel.
- Moved the verified manufacturer-method message directly beneath the site setting-out results.
- Reworded the verified message to confirm that published casing build-up and installation/expansion gaps are included where applicable.
- Updated all public version labels from V7 beta to V6.5 RC9.
- Bumped the service-worker cache and retained skipWaiting/client claim so returning visitors receive the new files after refresh.


## V6.5 RC9
- Updated all visible version labels.
- Added verified nominal-duct-edge setting-out support for BSB FD-C M9 and FSD-C M9.
- Structural opening offset now includes the published 10 mm gap plus the selected aperture-lining board.
- Bumped browser asset and service-worker cache versions.


## V6.5 RC9 BSB engineering database
Structured source: `data/bsb-engineering-database.json`. The live calculator retains an embedded runtime copy for offline reliability.

## V6.5 RC12 DEV 8 — Official Resource Manager

Replaced the manual-banner lookup with stable manufacturer/product resource IDs. Advanced Air 0160 and 2530 are resolved from both stored values and visible product codes, and a failed lookup now clears rather than retaining the previous banner.

## RC12 DEV 10 — Actionair dimensional coordination

Actionair CSS, supported SmokeShield DWFX-F methods and HEVAC/HVCA installation-frame methods now carry coordinated nominal-duct, casing/frame, opening and builder setting-out data from the current uploaded guides. Drawing-led and measured-only methods remain review controlled.


## V1 Engineering Audit
BSB audit complete for enabled calculators. Advanced Air audit complete for enabled calculators; drawing/table-led methods remain amber by design.


## Public document policy

This deployment package contains links to official manufacturer resources only. It does not bundle manufacturer manuals, spreadsheets, drawings or product photographs. Keep any audit source copies in a separate private archive.


## V1.0.14 — Advanced Air Product-Key Fix

- Uses the registered product select value as the single authoritative key.
- Prevents Advanced Air numeric model codes from being re-derived from display labels.
- Keeps product, method, diagram, verification and setting-out state aligned.
- Public pages show only VentTools V1.0.17.


## V1.0.17 — Advanced Air synchronous render fix

- Removed the false post-calculation selection-token retry that trapped Advanced Air on Android in “Selection changed — recalculating”.
- Advanced Air 0160/2530 table-based methods now complete their centred setting-out calculation and respond to AFFL changes.
- Public UI shows only VentTools V1.0.17.

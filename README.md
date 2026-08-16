# VentTools V2.0.0

Production release of VentTools, a mobile-first set of practical ventilation and ductwork calculators.

## Public calculator pages

- `/ductwork-offset-calculator/`
- `/round-rectangular-duct-converter/`
- `/fire-damper-opening-calculator/`

The homepage is a crawlable tool directory. Old homepage hashes redirect in the browser to the matching permanent calculator URL.

## Release safeguards

- Existing offset and fire-damper calculation logic is retained and regression-tested.
- The duct converter accepts either a round or rectangular source and lets the user change either proposed width or height.
- Paired rectangular dimensions round upward in 25 mm steps so the proposed free area is not smaller than the issued duct.
- Fire-damper results keep nominal duct, casing/frame, finished aperture, lining and structural cut separate.
- Review-only and official-drawing methods remain locked instead of receiving invented dimensions.
- Project Pack and Site Instruction Sheet remain `noindex,follow` and preserve their browser-storage workflow.

## Advertising state

The AdSense publisher meta tag and authorised `ads.txt` are present. The AdSense ad-serving script is intentionally disabled until the site has been approved and an appropriate Google-certified consent-management platform is configured where required.

## Deployment

The repository is configured for Cloudflare Workers static assets through `wrangler.jsonc`.

- Build command: none
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

After deployment, verify the three calculator URLs, `robots.txt`, `sitemap.xml`, `ads.txt`, Project Pack save/reopen/share and the cookie choices before requesting a new AdSense review.

See `docs/RELEASE-NOTES-V2.0.0.md` for the production change record.

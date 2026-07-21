# Cross-Platform Chart Fingerprint Design

## Problem

The React Ziwei chart artifact fingerprint is calculated from raw source bytes. A Windows checkout with CRLF produces a different hash from the LF checkout used by Cloudflare Pages, so CI can reject a freshly generated artifact as stale.

## Design

Normalize text input line endings to LF before hashing in both `scripts/esbuild-ziwei-chart.mjs` and `test/react-iztro-runtime-tests.js`. Keep the existing fingerprint inputs and banner format unchanged. Rebuild `js/vendor/react-iztro-chart.js`, its CSS, and source map with the normalized fingerprint.

## Verification

Run the focused runtime/artifact test first, then `npm test`. Confirm the generated JS and CSS banners match the normalized fingerprint and that all existing tests pass.

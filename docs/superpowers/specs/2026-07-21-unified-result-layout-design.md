# Unified Result Layout Design

## Goal

Make the Zhiming, Qiming, Ceming, and Hehun result experiences use the same outer width and report layout on desktop, tablet, and mobile screens.

## Scope

The change covers the live on-page result layout. It does not change calculations, AI prompts, report content, PDF generation, or the information unique to each feature.

## Shared Workspace

When a result panel has the `show` class, all four feature workspaces use the Zhiming layout:

- Desktop: a maximum width of `1440px`.
- Desktop columns: a `minmax(300px, 360px)` input sidebar and a `minmax(0, 1fr)` result column.
- At `768px` and below: a single column with `width: 100%` and the existing compact page gutters.
- The result column and all direct children must allow shrinking with `min-width: 0` so long AI content and charts do not force page overflow.

The expansion remains conditional on a visible result. Before calculation, each form keeps the existing compact two-column page composition.

## Shared Report Shell

All four result panels use the same shell rules:

- Full width within the result column.
- The same responsive padding, border radius, border treatment, and card shadow.
- A vertical `.result-content` flow with the same section gap.
- The same header alignment, title scale, metadata treatment, and bottom divider.
- The same spacing and alignment for report actions and download controls.

The shared shell follows the current Zhiming visual hierarchy. Feature-specific accent colors may remain inside specialized sections.

## Feature-Specific Content

The internal content remains distinct:

- Zhiming keeps the BaZi chart, solar-time correction, luck cycles, Zi Wei chart, and AI interpretation.
- Qiming keeps verified name candidates, rankings, sources, and naming analysis.
- Ceming keeps the AI score, five-grid evidence, three-talents evidence, and name analysis.
- Hehun keeps the relationship score, paired evidence, and marriage analysis.

Specialized grids may keep their own responsive rules, but their outer section width and spacing must conform to the shared report shell.

## Responsive Behavior

- Above `768px`, the four visible-result workspaces use the same two-column dimensions.
- At and below `768px`, all four workspaces use one column and identical available width.
- At and below `560px`, all result panels and nested AI output areas retain the compact padding introduced by the mobile-width work.
- Wide Zi Wei chart content remains horizontally scrollable inside its section and must not widen the page.

## Testing

- Add a CSS contract test covering the shared visible-result selector and desktop column dimensions.
- Add a CSS contract test covering the shared mobile single-column override.
- Retain the existing mobile padding assertions.
- Run the usability tests, feature-specific result tests, PDF tests, and the complete `npm test` suite.
- Inspect representative desktop and mobile widths in the local browser and verify that all four result panels report the same computed width when shown.

## Success Criteria

- At the same desktop viewport width, all four visible result panels occupy the same result-column width.
- At the same mobile viewport width, all four result panels occupy the same available page width.
- No feature loses content, controls, or its specialized responsive behavior.
- The page has no new horizontal overflow.


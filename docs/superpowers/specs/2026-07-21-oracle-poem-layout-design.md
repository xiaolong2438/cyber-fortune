# Oracle Poem Layout Design

## Problem

The AI can return the oracle poem as a LaTeX `aligned` block. The application renders AI output with Markdown only, so the LaTeX source is displayed literally.

## Design

Require future AI responses to use plain Markdown and explicitly forbid LaTeX for the oracle poem. Before Markdown rendering, detect legacy `$$ \\begin{aligned} ... \\end{aligned} $$` blocks, extract the escaped `\\text{}` verses, and render them as sanitized paired poem lines. Style the pairs in two columns on wide screens and one column on narrow screens.

## Verification

Add a regression test using the reported LaTeX response. Verify that rendered output contains poem-line markup and no visible `$$`, `\\text`, or `aligned` commands. Run the complete test suite.

# Mobile Content Width Design

## Goal

Increase usable content width on phones without changing the desktop layout or causing wide charts to overflow the page.

## Design

- At widths up to 768px, reduce each page section's horizontal gutter from `0.9rem` to `0.5rem` and make `.content-container` explicitly fill the available width.
- At widths up to 560px, use `0.75rem` padding for result cards, nested AI result sections, and AI output blocks.
- Keep forms readable by retaining their existing `1.2rem` internal padding.
- Preserve the existing one-column oracle poem layout and the scrollable Zi Wei chart behavior.
- Do not change desktop rules.

## Success Criteria

- A 375px viewport leaves 8px page gutters.
- Result and AI content no longer lose excessive width to nested padding.
- Existing usability, oracle poem, PDF, and full project tests pass.


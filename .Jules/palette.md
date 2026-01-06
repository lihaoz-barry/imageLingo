## 2024-05-23 - Accessibility of Hover-Only Controls
**Learning:** Elements hidden with `opacity-0` and revealed on hover are inaccessible to keyboard users unless they also have `focus:opacity-100`.
**Action:** Always include focus styles when implementing hover-reveal patterns.

## 2024-05-23 - Interactive Element Identification
**Learning:** Icon-only buttons must have `aria-label` to be accessible to screen readers.
**Action:** Audit all icon buttons for labels.

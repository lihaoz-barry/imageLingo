## 2024-05-23 - Keyboard Accessibility for Hover-Only Actions
**Learning:** Interactive elements that rely solely on `group-hover:opacity-100` are invisible to keyboard users.
**Action:** Always pair `group-hover:opacity-100` with `focus:opacity-100` (or `focus-within`) to ensure keyboard users can perceive and access the control when they tab to it.

## 2024-05-23 - [Opacity and Keyboard Focus]
**Learning:** Elements using `opacity-0` for hover interactions are invisible to keyboard users even when focused, creating a confusing navigation experience.
**Action:** Always pair `opacity-0` with `focus:opacity-100` and ensure visible focus indicators (like `focus-visible:ring`) are present for interactive elements.

## 2024-05-23 - Custom Buttons Need Custom Focus
**Learning:** Custom buttons (like gradient or floating buttons) that don't use the standard UI library button component often lack default focus styles, making them inaccessible to keyboard users.
**Action:** Always check custom `button` or `div` interactive elements for `focus-visible` styles. A safe default for dark/gradient backgrounds is `focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20`.

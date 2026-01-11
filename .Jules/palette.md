## 2024-05-23 - Accessibility of Hover-Only Actions
**Learning:** Elements that appear only on hover (using `opacity-0 group-hover:opacity-100`) are invisible to keyboard users.
**Action:** Always add `focus:opacity-100` alongside hover classes, and ensure the element has `focus-visible` styles so keyboard users can perceive and interact with it.

## 2024-05-23 - Clickable Divs
**Learning:** Using `div` with `onClick` for main interactions excludes keyboard users.
**Action:** Always add `role="button"`, `tabIndex={0}`, and `onKeyDown` handlers for Enter/Space, or better yet, wrap in a `<button>` element if possible.

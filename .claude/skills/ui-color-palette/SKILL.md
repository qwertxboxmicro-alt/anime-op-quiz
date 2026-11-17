---
name: ui-color-palette
description: Build a UI color system (dark + light mode) using HSL/OKLCH shades, neutral backgrounds/text, a brand color, and semantic colors, with CSS variables, gradients, highlights and shadows. Use when picking colors, theming, or adding dark/light mode to para-app, investor-edu-app/web, sharefloor (DealRail), anime-op-quiz, or any UI here.
---

# UI color palette (from "The Easy Way to Pick UI Colors" — Sajid, youtu.be/vvPklRN0Tco)

Don't become a color scientist. You only ever need three groups:

1. **Neutrals** — backgrounds, text, borders (most of the UI).
2. **Brand/primary** — main actions, a bit of character.
3. **Semantic** — success / warning / error / info states.

"Colors" really means **shades** (hover states, gradients). So pick a format where shades are math, not guesswork.

## 1. Use HSL (or OKLCH), never hex/RGB, for palettes
- HSL = hue (0–360), saturation (0–100), lightness (0–100). Shades differ only in lightness.
- Neutral palette: **saturation 0** (hue then doesn't matter). Add hue/saturation last.

## 2. Backgrounds and text (start with dark mode)
| Role | Lightness | Use |
|------|-----------|-----|
| base bg | 0% | page background |
| surface | 5% | cards, surfaces |
| raised | 10% | most important / raised elements |

- Lighter = closer to the user, so only use for important elements.
- Text: sharp high-contrast shade for headings/important, slightly muted for body. **Never 100% lightness** — too harsh.

## 3. Light mode
- Start by flipping: `lightness = 100 − dark lightness`, then adjust by eye.
- Light comes from above, so the **top/raised element is lightest, base is darkest**.
- Name backgrounds `bg-dark` / `bg-base` / `bg-light` (darkest → lightest) so names hold in both themes. Text can't follow that rule — use names that make sense in both modes (e.g. `text-main` / `text-muted`).

## 4. CSS wiring
```css
:root { /* default (dark) theme */
  --bg-dark: hsl(0 0% 0%);
  --bg: hsl(0 0% 5%);
  --bg-light: hsl(0 0% 10%);
  --text: hsl(0 0% 95%);
  --text-muted: hsl(0 0% 70%);
}
body.light { /* or: @media (prefers-color-scheme: light) { :root { ... } } */
  --bg-dark: hsl(0 0% 90%);
  --bg: hsl(0 0% 95%);
  --bg-light: hsl(0 0% 100%);
  --text: hsl(0 0% 5%);
  --text-muted: hsl(0 0% 30%);
}
```
- Toggle with one line of JS (`document.body.classList.toggle('light')`) or the `prefers-color-scheme` media query for auto-adapt. Choice depends on framework / how much control users get. The main job is defining the variables.
- In React Native (Expo) apps here: same idea, but as a theme object keyed by `useColorScheme()` instead of CSS vars.

## 5. Add depth (four more properties)
- **border**: clearly visible, not distracting.
- **gradient**: from the bg shades (e.g. `bg` → `bg-dark`); tone it down, reveal full gradient on hover. Reads as light from above.
- **highlight**: lighter color for the **top border** only (shiny-edge effect).
- **shadow**: "where there's light, there's shadow." Needs alpha (0–1). **Mix a darker, shorter shadow with a lighter, longer one** for realism.

Light-mode fixes:
- Highlight must be much lighter (bump lightness to ~100) or it just looks like a border.
- Then the normal border looks wrong → add a separate full-border variable and set it to the **card's background color** in light mode so it blends in.
- Gradients/highlight must be redefined for light mode; copying dark values leaves the dark version showing.

## 6. Hue and saturation (last)
Only after contrast, gradient, highlight, shadow are set: tint neutrals with a hue + small saturation (cool/vibrant vs warm/neutral). Re-check light mode, and especially primary/secondary colors used on buttons and hover states.

## 7. OKLCH vs HSL
- OKLCH = **L**ightness (0–1), **C**hroma (≈ saturation; 0–0.4, UI rarely needs >0.15–0.2), **H**ue (0–360). Tailwind v4 defaults to it.
- HSL's flaw: very dark/light shades lose saturation. LCH/OKLCH steps look more natural. OKLCH is the improved LCH.
- Either is fine; HSL is the simpler default, OKLCH if you want perceptually even ramps.

## Quick procedure
1. Neutral ramp in HSL, sat 0: bg 0/5/10, text ~95 + muted.
2. Flip for light (100 − L), reorder so base is darkest, rename bg-dark/bg-light.
3. Define CSS vars (or RN theme) + toggle.
4. Add border, gradient, top highlight, two-layer shadow; fix each for light mode.
5. Then add hue/saturation tint, brand primary, semantic colors; check both modes.

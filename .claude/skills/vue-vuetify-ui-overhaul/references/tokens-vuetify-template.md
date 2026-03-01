# Tokens + Vuetify Mapping Template

## Color Tokens

- `color.bg.canvas`
- `color.bg.surface`
- `color.text.primary`
- `color.text.secondary`
- `color.brand.primary`
- `color.brand.accent`
- `color.success`
- `color.warning`
- `color.error`
- `color.info`
- `color.border.default`
- `color.focus.ring`

## Spacing Tokens

- `space.1 = 4`
- `space.2 = 8`
- `space.3 = 12`
- `space.4 = 16`
- `space.5 = 24`
- `space.6 = 32`
- `space.7 = 48`
- `space.8 = 64`

## Radius Tokens

- `radius.sm = 8`
- `radius.md = 12`
- `radius.lg = 16`
- `radius.xl = 24`

## Shadow Tokens

- `shadow.sm`
- `shadow.md`
- `shadow.lg`

Use low-alpha neutral shadows; avoid heavy default elevations everywhere.

## Typography Tokens

- `type.display`
- `type.h1`
- `type.h2`
- `type.h3`
- `type.body.lg`
- `type.body.md`
- `type.body.sm`
- `type.label`

Define explicit line-height and letter-spacing for each level.

## Motion Tokens

- `motion.fast = 120ms`
- `motion.base = 200ms`
- `motion.slow = 320ms`
- `motion.ease.standard = cubic-bezier(.2,.8,.2,1)`

## Vuetify Theme Mapping (Example)

- Map brand semantic colors to `theme.themes.light.colors`.
- Keep contrast-safe `on-*` colors explicit.
- Override component defaults (`VBtn`, `VCard`, `VTextField`, `VAlert`) to reflect tokens.
- Keep all brand values in one place; avoid duplicate ad-hoc CSS vars.

## Component Rules Baseline

- Button: define primary/secondary/tertiary + disabled/loading.
- Input: define label, helper, error, focus ring behavior.
- Card: define padding/radius/elevation tiers by use-case.
- Dialog: define layout and destructive confirmation pattern.
- Table: define row density, hover/focus, empty/loading/error patterns.

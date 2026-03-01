# Redesign Checklist

## Product + Business Alignment

- Define target audience segment and top jobs-to-be-done.
- Define primary business metric for this redesign cycle.
- Define secondary guardrail metrics (drop-off, errors, support tickets).

## UX Audit

- Verify global navigation clarity and route integrity.
- Verify task hierarchy per page (primary action obvious in 3 seconds).
- Verify copy clarity and decision friction in critical flows.
- Verify dead ends, broken transitions, and missing recovery actions.

## UI Audit

- Verify consistent typography scale across pages.
- Verify spacing rhythm and alignment to one grid system.
- Verify tokenized color usage (no random hard-coded values).
- Verify visual weight distribution (headline, body, CTAs).
- Verify component style consistency across public/auth/admin areas.

## Component States

- Verify all core controls support: `default`, `hover`, `focus-visible`, `disabled`.
- Verify async interactions support: `loading`, `success`, `error`, `empty`.
- Verify destructive actions use explicit confirmation patterns.

## Conversion Flows

- Verify `listing -> details -> add to cart -> checkout`.
- Verify authentication interruptions have safe return path.
- Verify cart summary and total are visible at all times on mobile/desktop.
- Verify checkout has clear progress and validation feedback.

## Mobile

- Verify touch target size >= 44x44.
- Verify sticky CTA for critical conversion actions.
- Verify minimized keyboard/input friction in forms.
- Verify key actions reachable with one-thumb ergonomics.

## Accessibility (WCAG 2.2 AA)

- Verify contrast ratios for text and controls.
- Verify keyboard-only navigation for all primary flows.
- Verify visible focus indicator.
- Verify icon-only buttons have accessible names.
- Verify form labels, helper text, and errors are programmatically linked.
- Verify motion is reduced when user prefers reduced motion.

## Release Readiness

- Verify top-10 issues are prioritized by impact/effort.
- Verify 2-3 sprint rollout plan with dependencies and risk notes.
- Verify KPI instrumentation exists before release.

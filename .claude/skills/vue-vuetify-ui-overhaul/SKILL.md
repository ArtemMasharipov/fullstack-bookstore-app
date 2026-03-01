---
name: vue-vuetify-ui-overhaul
description: Professional UX/UI audit and premium redesign implementation playbook for Vue 3 + Vuetify e-commerce/content platforms. Use when asked to audit, redesign, or implement bold non-template UI improvements with consistency, best practices, WCAG 2.2 AA, mobile UX, design tokens, screen-by-screen changes, and rollout roadmap/KPIs.
---

# Vue + Vuetify UI Overhaul

Use this skill to execute redesign tasks professionally, concisely, and consistently without full project rewrite.

## Execution Standard

- Prioritize business outcomes: conversion, average order value, retention.
- Fix broken flows before visual polish.
- Preserve current stack and architecture (Vue 3 + Vuetify + existing stores/router).
- Avoid generic SaaS visuals; propose an intentional visual direction.
- Keep recommendations implementation-ready.

## Workflow

1. Audit current state first.
2. Identify and prioritize critical issues.
3. Propose 2-3 visual directions and select one with rationale.
4. Define design tokens and component rules.
5. Specify screen-by-screen before/after changes.
6. Add mobile UX improvements and meaningful micro-interactions.
7. Validate accessibility (WCAG 2.2 AA) and implementation risks.
8. Build 2-3 sprint rollout plan with measurable KPIs.

If codebase access is available, base findings on real files/components/routes, not assumptions.

## Audit Rules

- Evaluate UX: navigation, hierarchy, readability, cognitive load, CTA clarity, scenario errors.
- Evaluate UI: typography, spacing/grid, contrast, component consistency, and interaction states.
- Include all states for critical components: `default`, `hover`, `focus-visible`, `disabled`, `loading`, `error`, `empty`.
- Capture top-10 issues with:
  - severity (`High/Medium/Low`)
  - impact
  - effort
  - affected screen/flow

Use [redesign-checklist.md](references/redesign-checklist.md) for detailed checks.

## Visual Direction Rules

- Generate 2-3 clearly different concepts.
- Select one concept and justify by:
  - fit to audience and brand positioning
  - differentiation from template competitors
  - implementation feasibility in Vuetify
- Define concrete visual language: typography, palette, card/buttons/forms/table style, motion tone.

Use [screen-playbook.md](references/screen-playbook.md) for screen patterns.

## Design System Rules

- Keep one source of truth for tokens.
- Map tokens to Vuetify theme and CSS variables.
- Standardize:
  - color roles
  - spacing scale
  - radius scale
  - shadow scale
  - typography scale
  - motion durations/easing
- Explicitly define component behavior and states.

Use [tokens-vuetify-template.md](references/tokens-vuetify-template.md) as baseline.

## Mobile UX Rules

- Use breakpoint-specific behavior, not only responsive resizing.
- Ensure touch targets >= 44x44.
- Add sticky CTA on conversion-critical screens.
- Reduce steps/friction in cart and checkout scenarios.
- Keep primary task reachable with one-thumb usage.

## Accessibility Rules (WCAG 2.2 AA)

- Verify text/background contrast.
- Ensure keyboard navigation and visible focus.
- Add `aria-label` for icon-only actions.
- Keep semantic headings/landmarks consistent.
- Attach form errors to inputs (`aria-describedby`) and use clear error copy.
- Respect reduced-motion preference for animations.

## Output Contract

When the user asks for audit/redesign strategy, return:

1. Executive summary
2. Table of issues (screen, issue, impact, priority, effort)
3. Proposed visual concept
4. Screen-by-screen concrete changes
5. Design tokens + component rules
6. Sprint rollout plan
7. Post-redesign KPI framework

When the user asks to implement, apply the same structure internally, then ship minimal-risk incremental code changes.

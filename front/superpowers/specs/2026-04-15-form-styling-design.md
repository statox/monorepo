# Form Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make form pages look modern, elegant, and minimalist while working consistently across mobile and desktop.

**Architecture:** All changes are scoped to the three shared form components (`FormLayout`, `FormGrid`, `FormSubmitButton`). No global CSS files are modified. Individual form files (`ClipboardForm`, `ReactorForm`, etc.) receive a small addition per validated field to wire up the `.error` class. All styling uses existing CSS variables from `new_theme.css` so both light (dayfox) and dark (nightfox) themes work automatically.

**Tech Stack:** Svelte 5, scoped CSS, CSS custom properties (`--nc-*` variables), CSS Grid

---

## Design Decisions

### Layout

- Single stacked column everywhere — label above field, no responsive layout switch.
- Removes the 2-column grid that caused a different experience on desktop vs mobile.

### Card Container

- `padding: 24px` (up from 16px)
- `border-radius: 26px` (unchanged)
- `background: var(--nc-bg-1)` (unchanged)
- No `box-shadow`
- Remove `max-height: 90%; overflow: auto` — these were modal holdovers that clip long forms
- Title bar: `border-bottom: 1px solid var(--nc-bg-2)` to anchor it visually
- Back button: ghost style (`background: none`, link color) — lighter than a full button

### Labels

- `font-size: 0.8rem`
- `font-weight: 600`
- `letter-spacing: 0.04em`
- `text-transform: uppercase`
- `color: var(--nc-tx-2)`
- Small-caps feel creates hierarchy without visual noise

### Field Group Spacing

The grid stays a single flat grid (no nested wrappers, no changes to individual form files). Spacing is achieved in the grid CSS:

- `row-gap: 0.4rem` — tight label-to-input gap within each field pair
- All labels except `:first-child` get `margin-top: 1.1rem` — creates visual group separation without DOM wrappers

### Inputs, Textareas, Selects

Scoped inside `.form-grid :global(input)` etc. — only affects controls inside these forms:

- `width: 100%`
- `padding: 14px 16px`
- `background: var(--nc-bg-3)`
- `border: 2px solid transparent` (prevents layout shift on focus)
- `border-radius: 8px`
- `color: var(--nc-tx-1)`
- `font-size: 1rem`
- `transition: border-color 0.15s ease`
- `margin-bottom: 0` (zero out new.css margin to avoid double spacing)
- Focus: `border-color: var(--nc-lk-1); outline: none`
- Textarea keeps `resize: vertical`

### Error States

- `.field-error`: `font-size: 0.8rem`, `color: var(--nc-error)`, `margin-top: -0.75rem`
- Input with error: `border-color: var(--nc-error)` via `class:error={!!fieldErrors.fieldName}` on the input + `.form-grid :global(input.error)` rule
- Same `.error` class applied to `textarea` and `select` elements where validated

### Submit Button

- `padding: 14px 24px`
- `border-radius: 8px` (matches inputs)
- Mobile (`max-width: 600px`): `width: 100%`
- Desktop: `width: auto`, left-aligned
- Color unchanged — uses `--nc-lk-1` from `new.css`

---

## Files Modified

- `src/lib/components/FormLayout/FormLayout.svelte` — card padding, title bar border, back button style, remove max-height/overflow
- `src/lib/components/FormLayout/FormGrid.svelte` — single-column layout, label styles, input/textarea/select styles, field-error styles
- `src/lib/components/FormLayout/FormSubmitButton.svelte` — padding, border-radius, mobile full-width
- `src/routes/(apps)/clipboard/components/ClipboardForm.svelte` — add `class:error` to name input
- `src/routes/(apps)/reactor/components/ReactorForm.svelte` — add `class:error` to name input
- `src/routes/(apps)/webwatcher/components/WatcherForm.svelte` — add `class:error` to name, notificationMessage, url, cssSelector
- `src/routes/(apps)/cookbook/components/RecipeForm.svelte` — add `class:error` to name, content textarea
- `src/routes/(apps)/songbook/edit/components/ChordForm.svelte` — add `class:error` to title, artist, url inputs

---

## What Does Not Change

- Global CSS files (`new.css`, `new_override.css`, `new_theme.css`) — untouched
- CSS variable names — all reuse existing `--nc-*` tokens
- Form logic, validation, API calls — untouched
- `DurationPicker`, `IngredientInput`, `IngredientsList`, `FormFileInput` — untouched (they sit inside the grid but are not standard inputs)

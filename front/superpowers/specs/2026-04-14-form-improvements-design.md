# Form Improvements Design

**Date:** 2026-04-14  
**Scope:** All data-entry forms using the `FormLayout > FormGrid` pattern (excluding PersonalTracker forms)

## Context

The app has 5 similar "create" forms rendered as dedicated pages:

| Form            | Route                   | Fields                                                                      |
| --------------- | ----------------------- | --------------------------------------------------------------------------- |
| `ClipboardForm` | `/clipboard/create`     | Content, Name, File, TTL, Visibility                                        |
| `ReactorForm`   | `/reactor/create`       | Name, Tags, File                                                            |
| `WatcherForm`   | `/webwatcher/create`    | Name, Check interval, Notification message, Watcher type, URL, CSS selector |
| `RecipeForm`    | `/cookbook/add`         | Name, Ingredients, Instructions                                             |
| `ChordForm`     | `/songbook/edit/create` | Artist, Title, URL, Tags                                                    |

All share the `FormLayout > FormGrid > FormSubmitButton` component structure.

## Goals

- Fix HTML bugs and code inconsistencies
- Improve layout on large screens (centered narrow form, inputs that fill their column)
- Add inline field validation (errors next to fields, not only at top)
- Keep forms as single pages (scrolling allowed, no wizard/multi-step)

## Implementation Phases

The user wants Phase 1 implemented and validated before Phase 2 begins.

---

## Phase 1 — Bug Fixes

### 1. Replace invalid `input type="textarea"` with real `<textarea>`

`input type="textarea"` is not valid HTML — it renders as a single-line text input. The following fields must be replaced with `<textarea>`:

- `ClipboardForm`: `content` field
- `ReactorForm`: `commaSeparatedTags` field
- `WatcherForm`: `notificationMessage`, `url`, `cssSelector` fields

`RecipeForm` already uses a proper `<textarea>` for its Instructions field and requires no change.

### 2. Fix broken `label for` / `id` pairs

Every label currently has a `for="..."` attribute pointing to no corresponding `id` on any input — the association is broken. Add a matching `id` attribute to each input in all 5 forms.

### 3. Fix copy-paste label text errors

- `ReactorForm` line 55: `<label for="content">Tags</label>` → `<label for="tags">Tags</label>`
- `WatcherForm` line 112: `<label for="content">URL</label>` → `<label for="url">URL</label>`

### 4. Fix Enter key submission

All forms use a button `onclick` handler. Pressing Enter in any input does nothing.

- `FormGrid` accepts an optional `onsubmit` prop and passes it to its `<form>` element (with `preventDefault` handled inside)
- `FormSubmitButton` gets `type="submit"` so it participates in native form submission
- Each form passes its submit handler to `<FormGrid onsubmit={upload}>`

### 5. Standardize tag variable naming

Both tag fields use different local variable names for the same concept:

- `ReactorForm`: rename `commaSeparatedTags` → `tags` (local state only, no API change)
- `ChordForm`: rename `tagsStr` → `tags` (local state only, no API change)

---

## Phase 2 — Layout + Inline Validation

### 1. `FormLayout` — centered narrow container

Add to `.form-layout` in `FormLayout.svelte`:

```css
max-width: 600px;
margin: 0 auto;
```

The form centers on large screens and stays full-width on mobile. Existing `padding`, `border-radius`, and `max-height` unchanged.

### 2. `FormGrid` — fixed label column, stretching inputs

Change in `FormGrid.svelte`:

```css
/* before */
grid-template-columns: auto auto;

/* after */
grid-template-columns: minmax(80px, 120px) 1fr;
```

Add label alignment:

```css
.form-grid :global(label) {
    text-align: right;
}
```

The existing mobile breakpoint (`grid-template-columns: 100%` at `max-width: 600px`) stays unchanged.

### 3. Inline field validation

Each form gets a `fieldErrors` record alongside `noticeMessages`:

```typescript
let fieldErrors: Record<string, string> = $state({});
```

Validation is split:

- **On blur**: validate only the field that lost focus, update `fieldErrors[fieldName]`
- **On submit**: validate all fields, populate both `fieldErrors` and `noticeMessages` (API/network errors only go to `noticeMessages`)

Each input gets an error span below it:

```svelte
<input id="name" type="text" bind:value={name} onblur={validateName} />
{#if fieldErrors.name}
    <span class="field-error">{fieldErrors.name}</span>
{/if}
```

The `field-error` style is added to `FormGrid.svelte`'s CSS:

```css
.form-grid :global(.field-error) {
    grid-column: 2;
    color: var(--nc-error);
    font-size: 0.85em;
    margin-top: -0.5em;
}
```

On mobile (single column), `grid-column: 2` has no effect — the error appears below the input naturally.

`noticeMessages` notices are kept but scoped to API/network errors only. Validation errors live exclusively in `fieldErrors`.

### 4. `FormSubmitButton` — type="submit"

Add `type="submit"` to the `<button>` in `FormSubmitButton.svelte` so it participates in native form submission and Enter key works.

---

## Files Changed

**Phase 1:**

- `src/lib/components/FormLayout/FormSubmitButton.svelte` — add `type="submit"`
- `src/routes/(apps)/clipboard/components/ClipboardForm.svelte` — textarea, label ids, enter key
- `src/routes/(apps)/reactor/components/ReactorForm.svelte` — textarea, label ids, tag rename, enter key
- `src/routes/(apps)/webwatcher/components/WatcherForm.svelte` — textarea, label ids, label text fix, enter key
- `src/routes/(apps)/cookbook/components/RecipeForm.svelte` — label ids, enter key
- `src/routes/(apps)/songbook/edit/components/ChordForm.svelte` — label ids, tag rename, enter key

**Phase 2:**

- `src/lib/components/FormLayout/FormLayout.svelte` — max-width + centering
- `src/lib/components/FormLayout/FormGrid.svelte` — column sizing + label alignment + field-error style
- All 5 form files — add `fieldErrors` state, blur handlers, error spans, migrate validation errors out of `noticeMessages`

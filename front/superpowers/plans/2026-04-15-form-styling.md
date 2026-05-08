# Form Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all form pages look modern, elegant, and minimalist — stacked single-column layout, filled inputs, ghost back button, full-width submit on mobile — using only existing CSS variables.

**Architecture:** All layout and visual changes are confined to the three shared `FormLayout` components (`FormLayout.svelte`, `FormGrid.svelte`, `FormSubmitButton.svelte`). Individual form files each get one small addition: a `class:error` binding on validated inputs/textareas to wire up the red-border error state. No global CSS files are touched. All styles use existing `--nc-*` CSS variables from `new_theme.css`, so both the light (dayfox) and dark (nightfox) themes work automatically.

**Tech Stack:** Svelte 5, scoped CSS with `:global()`, CSS Flexbox, CSS custom properties

---

## Important CSS Note

All form-grid selectors use the **direct-child combinator** (`>`):

```css
.form-grid > :global(input) { ... }
```

This prevents styles leaking into nested components (`DurationPicker`, `IngredientInput`) whose own inputs and selects are NOT direct children of the form-grid element. Descendant-only selectors (no `>`) are used only for `.field-error` and `label` since those are always direct children in every form and the nesting is safe.

---

## Files Modified

- `src/lib/components/FormLayout/FormLayout.svelte` — card padding, title bar border, ghost back button, remove max-height/overflow
- `src/lib/components/FormLayout/FormGrid.svelte` — single-column flex, label styles, input/textarea/select fill + focus styles, error border, field-error
- `src/lib/components/FormLayout/FormSubmitButton.svelte` — bigger padding, border-radius, full-width on mobile, remove unused `spanTwoColumns` prop
- `src/routes/(apps)/clipboard/components/ClipboardForm.svelte` — add `class:error` to name input
- `src/routes/(apps)/reactor/components/ReactorForm.svelte` — add `class:error` to name input
- `src/routes/(apps)/webwatcher/components/WatcherForm.svelte` — add `class:error` to name, notificationMessage, url, cssSelector
- `src/routes/(apps)/cookbook/components/RecipeForm.svelte` — add `class:error` to name input and content textarea
- `src/routes/(apps)/songbook/edit/components/ChordForm.svelte` — add `class:error` to artist, title, url inputs

---

## Task 1: Update FormLayout — card, title bar, back button

**Files:**

- Modify: `src/lib/components/FormLayout/FormLayout.svelte`

**What changes:**

- `padding` increases from `16px` → `24px`
- Remove `max-height: 90%` and `overflow: auto` (these were modal holdovers that clip tall forms)
- Title bar gets `padding-bottom: 0.75em; border-bottom: 1px solid var(--nc-bg-2)`
- Back button becomes a ghost: `background: none; color: var(--nc-lk-1)` (overrides new.css button defaults)

- [ ] **Step 1: Replace the full content of `FormLayout.svelte`**

```svelte
<script lang="ts">
    import { goto } from '$app/navigation';
    import { AuthGuard } from '$lib/components/AuthGuard';
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    interface Props {
        title: string;
        backUrl: string;
        authMessage?: string;
        noticeMessages?: NoticeItem[];
        children: import('svelte').Snippet;
    }

    let {
        title,
        backUrl,
        authMessage = 'Login to add an entry',
        noticeMessages = [],
        children
    }: Props = $props();
</script>

<div class="form-layout">
    <h2 class="title-bar">
        {title}
        <button class="back-button" onclick={() => goto(backUrl)}>Back</button>
    </h2>

    <AuthGuard message={authMessage} requiredScope="admin">
        {#each noticeMessages as item}
            <Notice {item} />
        {/each}

        {@render children()}
    </AuthGuard>
</div>

<style>
    .form-layout {
        min-width: 240px;
        max-width: 600px;
        margin: 0 auto;
        padding: 24px;
        background: var(--nc-bg-1);
        border-radius: 26px;
    }

    .title-bar {
        margin-bottom: 1em;
        padding-bottom: 0.75em;
        border-bottom: 1px solid var(--nc-bg-2);
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .back-button {
        background: none;
        color: var(--nc-lk-1);
        padding: 4px 8px;
        font-size: 0.9rem;
    }

    .back-button:enabled:hover,
    .back-button:focus {
        background: none;
        color: var(--nc-lk-2);
    }
</style>
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: no errors related to FormLayout.

---

## Task 2: Update FormGrid — single column, label styles, input styles, error styles

**Files:**

- Modify: `src/lib/components/FormLayout/FormGrid.svelte`

**What changes:**

- Grid → flex column. Single column on all screen sizes, no responsive breakpoint needed.
- Labels styled as small-caps (`0.8rem`, `600` weight, `0.04em` letter-spacing, uppercase, `--nc-tx-2`).
- All labels except the first get `margin-top: 1.25rem` to create visual grouping between fields.
- Direct-child inputs/textareas/selects get filled style: `background: --nc-bg-3`, `border: 2px solid transparent`, `border-radius: 8px`, `padding: 14px 16px`, focus ring changes border-color to `--nc-lk-1`.
- `.error` class on an input/textarea/select changes border-color to `--nc-error`.
- `.field-error` is now full-width (no `grid-column: 2` needed).
- Remove the `@media (max-width: 600px)` block — not needed with single column.

- [ ] **Step 1: Replace the full content of `FormGrid.svelte`**

```svelte
<script lang="ts">
    interface Props {
        children: import('svelte').Snippet;
        onsubmit?: () => void | Promise<void>;
    }

    let { children, onsubmit }: Props = $props();
</script>

<form
    class="form-grid"
    onsubmit={(e) => {
        e.preventDefault();
        onsubmit?.();
    }}
>
    {@render children()}
</form>

<style>
    .form-grid {
        display: flex;
        flex-direction: column;
    }

    .form-grid :global(label) {
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--nc-tx-2);
        margin-top: 1.25rem;
        margin-bottom: 0.3rem;
    }

    .form-grid :global(label:first-child) {
        margin-top: 0;
    }

    .form-grid > :global(input),
    .form-grid > :global(textarea),
    .form-grid > :global(select) {
        width: 100%;
        padding: 14px 16px;
        background: var(--nc-bg-3);
        border: 2px solid transparent;
        border-radius: 8px;
        color: var(--nc-tx-1);
        font-size: 1rem;
        transition: border-color 0.15s ease;
        margin-bottom: 0;
        box-sizing: border-box;
    }

    .form-grid > :global(input:focus),
    .form-grid > :global(textarea:focus),
    .form-grid > :global(select:focus) {
        border-color: var(--nc-lk-1);
        outline: none;
    }

    .form-grid > :global(input.error),
    .form-grid > :global(textarea.error),
    .form-grid > :global(select.error) {
        border-color: var(--nc-error);
    }

    .form-grid > :global(textarea) {
        resize: vertical;
    }

    .form-grid :global(.field-error) {
        font-size: 0.8rem;
        color: var(--nc-error);
        margin-top: 0.25rem;
    }
</style>
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: no errors.

---

## Task 3: Update FormSubmitButton — padding, border-radius, mobile full-width

**Files:**

- Modify: `src/lib/components/FormLayout/FormSubmitButton.svelte`

**What changes:**

- `padding` changes to `14px 24px` (taller, wider — better tap target)
- `border-radius: 8px` to match the filled inputs
- Mobile (`max-width: 600px`): `width: 100%` for maximum hit-box
- Remove `spanTwoColumns` prop and `span-two` class — no longer needed with flex column layout (no grid to span)

- [ ] **Step 1: Replace the full content of `FormSubmitButton.svelte`**

```svelte
<script lang="ts">
    import { Spinner } from '$lib/components/Spinner';

    interface Props {
        onclick?: () => void | Promise<void>;
        loading?: boolean;
        disabled?: boolean;
        label?: string;
    }

    let { onclick, loading = false, disabled = false, label = 'Submit' }: Props = $props();
</script>

<button class="form-submit-button" type="submit" {onclick} disabled={disabled || loading}>
    {#if loading}
        <Spinner size={0.5} unit="em" durationSeconds={0.5} />
    {:else}
        {label}
    {/if}
</button>

<style>
    .form-submit-button {
        margin-top: 1.5rem;
        padding: 14px 24px;
        border-radius: 8px;
        min-width: 120px;
        width: auto;
    }

    @media screen and (max-width: 600px) {
        .form-submit-button {
            width: 100%;
        }
    }
</style>
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: no errors. If `spanTwoColumns` was passed anywhere, the check will flag it — search the codebase:

```bash
grep -r "spanTwoColumns" src/
```

Expected: no matches (the prop was only defined in the component, never passed from outside).

---

## Task 4: Add `.error` class wiring to form files

**Files:**

- Modify: `src/routes/(apps)/clipboard/components/ClipboardForm.svelte`
- Modify: `src/routes/(apps)/reactor/components/ReactorForm.svelte`
- Modify: `src/routes/(apps)/webwatcher/components/WatcherForm.svelte`
- Modify: `src/routes/(apps)/cookbook/components/RecipeForm.svelte`
- Modify: `src/routes/(apps)/songbook/edit/components/ChordForm.svelte`

**What changes:** Add `class:error={!!fieldErrors.fieldName}` to each validated input/textarea so it shows a red border when an error is set. This is a one-liner addition per field — no logic changes.

- [ ] **Step 1: Edit `ClipboardForm.svelte` — add `class:error` to name input**

Find (around line 101):

```svelte
<input id="name" type="text" bind:value={name} onblur={validateName} />
```

Replace with:

```svelte
<input
    id="name"
    type="text"
    bind:value={name}
    onblur={validateName}
    class:error={!!fieldErrors.name}
/>
```

- [ ] **Step 2: Edit `ReactorForm.svelte` — add `class:error` to name input**

Find (around line 60):

```svelte
<input id="name" type="text" bind:value={name} onblur={validateName} />
```

Replace with:

```svelte
<input
    id="name"
    type="text"
    bind:value={name}
    onblur={validateName}
    class:error={!!fieldErrors.name}
/>
```

- [ ] **Step 3: Edit `WatcherForm.svelte` — add `class:error` to four fields**

Find (around line 103):

```svelte
<input id="name" type="text" bind:value={name} onblur={validateName} />
```

Replace with:

```svelte
<input
    id="name"
    type="text"
    bind:value={name}
    onblur={validateName}
    class:error={!!fieldErrors.name}
/>
```

Find (around line 118):

```svelte
<textarea
    id="notification-message"
    bind:value={notificationMessage}
    rows="2"
    onblur={validateNotificationMessage}
></textarea>
```

Replace with:

```svelte
<textarea
    id="notification-message"
    bind:value={notificationMessage}
    rows="2"
    onblur={validateNotificationMessage}
    class:error={!!fieldErrors.notificationMessage}
></textarea>
```

Find (around line 130):

```svelte
<textarea id="url" bind:value={url} rows="2" onblur={validateUrl}></textarea>
```

Replace with:

```svelte
<textarea id="url" bind:value={url} rows="2" onblur={validateUrl} class:error={!!fieldErrors.url}
></textarea>
```

Find (around line 137):

```svelte
<textarea id="css-selector" bind:value={cssSelector} rows="2" onblur={validateCssSelector}
></textarea>
```

Replace with:

```svelte
<textarea
    id="css-selector"
    bind:value={cssSelector}
    rows="2"
    onblur={validateCssSelector}
    class:error={!!fieldErrors.cssSelector}
></textarea>
```

- [ ] **Step 4: Edit `RecipeForm.svelte` — add `class:error` to name input and content textarea**

Find (around line 78):

```svelte
<input id="name" type="text" bind:value={name} onblur={validateName} />
```

Replace with:

```svelte
<input
    id="name"
    type="text"
    bind:value={name}
    onblur={validateName}
    class:error={!!fieldErrors.name}
/>
```

Find (around line 94):

```svelte
<textarea id="content" bind:value={content} rows="10" cols="50" onblur={validateContent}></textarea>
```

Replace with:

```svelte
<textarea
    id="content"
    bind:value={content}
    rows="10"
    cols="50"
    onblur={validateContent}
    class:error={!!fieldErrors.content}
></textarea>
```

- [ ] **Step 5: Edit `ChordForm.svelte` — add `class:error` to artist, title, and url inputs**

Find (around line 75):

```svelte
<input id="artist" type="text" bind:value={artist} onblur={validateArtist} />
```

Replace with:

```svelte
<input
    id="artist"
    type="text"
    bind:value={artist}
    onblur={validateArtist}
    class:error={!!fieldErrors.artist}
/>
```

Find (around line 81):

```svelte
<input id="title" type="text" bind:value={title} onblur={validateTitle} />
```

Replace with:

```svelte
<input
    id="title"
    type="text"
    bind:value={title}
    onblur={validateTitle}
    class:error={!!fieldErrors.title}
/>
```

Find (around line 87):

```svelte
<input id="url" type="text" bind:value={url} onblur={validateUrl} />
```

Replace with:

```svelte
<input id="url" type="text" bind:value={url} onblur={validateUrl} class:error={!!fieldErrors.url} />
```

- [ ] **Step 6: Run type check and lint**

```bash
npm run check && npm run lint
```

Expected: no errors or warnings.

---

## Task 5: Visual verification and build

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open each form in a browser at `https://localhost:5173` and verify:

| Form        | URL                     | Check                                                              |
| ----------- | ----------------------- | ------------------------------------------------------------------ |
| Clipboard   | `/clipboard/create`     | Stacked fields, filled inputs, ghost back button, title bar border |
| Reactor     | `/reactor/create`       | Same structure, file input unaffected                              |
| Web Watcher | `/webwatcher/create`    | DurationPicker inputs look normal (not over-styled)                |
| Cookbook    | `/cookbook/add`         | IngredientInput internal styling untouched                         |
| Songbook    | `/songbook/edit/create` | Three validated fields show red border on blur if empty            |

Also verify on a narrow viewport (≤600px): submit button should be full width.

- [ ] **Step 2: Test error state**

On any form: blur out of a required field without filling it. Confirm:

- `.field-error` text appears below the field in red
- The field itself shows a red border (2px solid `--nc-error`)

- [ ] **Step 3: Rebuild the static site**

```bash
npm run build
```

Expected: `✓ built` with no errors. Output goes to `docs/`.

- [ ] **Step 4: Commit**

```bash
git add \
  src/lib/components/FormLayout/FormLayout.svelte \
  src/lib/components/FormLayout/FormGrid.svelte \
  src/lib/components/FormLayout/FormSubmitButton.svelte \
  src/routes/\(apps\)/clipboard/components/ClipboardForm.svelte \
  src/routes/\(apps\)/reactor/components/ReactorForm.svelte \
  src/routes/\(apps\)/webwatcher/components/WatcherForm.svelte \
  src/routes/\(apps\)/cookbook/components/RecipeForm.svelte \
  src/routes/\(apps\)/songbook/edit/components/ChordForm.svelte \
  docs/

git commit -m "Forms - Modern styling: stacked layout, filled inputs, ghost back button"
```

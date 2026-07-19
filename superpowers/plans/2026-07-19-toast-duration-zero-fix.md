# Toast duration:0 Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `toast.push(msg, { duration: 0 })` persist the toast until the user manually dismisses it, instead of auto-closing it on the same tick it's created.

**Architecture:** Single targeted fix in `front/src/lib/components/Toast/ToastItem.svelte`: when a toast's `duration` is `0`, skip the tween-driven `progress.set(next).then(autoclose)` call so the progress bar stays static (full) and `autoclose()` never fires from the tween. Toasts with a non-zero duration are unaffected. The now-fixed `duration: 0` behavior gets a permanent example button on the Playground page, and the README note documenting the bug as an open TODO is removed since it's fixed.

**Tech Stack:** SvelteKit 5 / Svelte 5 runes, TypeScript, no test framework present in `front/` (verification is manual + `npm run check` / `npm run lint`).

## Global Constraints

- Run all npm commands from inside `front/`, never from the repo root (project CLAUDE.md).
- Only change `front/src/lib/components/Toast/ToastItem.svelte`, `front/src/lib/components/Toast/README.md`, and `front/src/routes/(apps)/playground/components/ToastsSection.svelte`. No changes to `ClipboardForm.svelte`, `formErrorHandler.ts`, or `auth/api.ts` (per spec's "Out of scope").
- No automated test suite exists for the Toast component; verification is manual (dev server) plus `npm run check` and `npm run lint` (per spec's "Testing" section).

---

### Task 1: Fix `duration: 0` auto-close bug in ToastItem.svelte

**Files:**
- Modify: `front/src/lib/components/Toast/ToastItem.svelte:57-68`
- Modify: `front/src/lib/components/Toast/README.md`

**Interfaces:**
- Consumes: `item: Partial<SvelteToastOptions> & { id: number }` prop (existing, unchanged shape). Relevant fields: `item.duration` (`number | undefined`), `item.next` (`number | undefined`, default `0`), `item.initial` (`number | undefined`, default `1`).
- Produces: no new exports. Behavior change only: when `item.duration === 0`, the toast no longer self-closes via the progress tween.

- [ ] **Step 1: Read the current effect to confirm line numbers**

Run: `grep -n "next !== item.next" -A 12 front/src/lib/components/Toast/ToastItem.svelte`

Expected output (confirms the block to edit):
```
        if (next !== item.next) {
            next = item.next;
            prev = $progress;
            paused = false;
            if (next === undefined) {
                throw Error('Toast with undefined next');
            }
            progress.set(next).then(autoclose);
        }
    });
```

- [ ] **Step 2: Edit the effect to skip the tween when duration is 0**

In `front/src/lib/components/Toast/ToastItem.svelte`, change:

```svelte
    $effect(() => {
        if (next !== item.next) {
            next = item.next;
            prev = $progress;
            paused = false;
            if (next === undefined) {
                throw Error('Toast with undefined next');
            }
            progress.set(next).then(autoclose);
        }
    });
```

to:

```svelte
    $effect(() => {
        if (next !== item.next) {
            next = item.next;
            prev = $progress;
            paused = false;
            if (next === undefined) {
                throw Error('Toast with undefined next');
            }
            // duration: 0 means "persist until manually dismissed" - skip the
            // tween so autoclose() never fires from a same-tick 0ms transition.
            if (item.duration === 0) {
                return;
            }
            progress.set(next).then(autoclose);
        }
    });
```

- [ ] **Step 3: Note in the README that the bug is fixed**

In `front/src/lib/components/Toast/README.md`, leave the existing bullet (currently line 17, the last bullet in the "Update 01/2025" list) as-is, and add a new bullet directly after it noting the fix:

```
- Potentially introduced a bug: passing `duration: 0` close the toast immediately maybe before it allowed a never closing toast.
- **Update 07/2026:** Fixed - `duration: 0` now persists the toast until manually dismissed instead of auto-closing immediately.
```

Only add the new line; do not remove or otherwise edit the existing bullet.

- [ ] **Step 4: Type-check and lint**

Run: `cd front && npm run check && npm run lint`
Expected: both commands exit with no errors.

- [ ] **Step 5: Commit**

```bash
cd /workdir
git add front/src/lib/components/Toast/ToastItem.svelte front/src/lib/components/Toast/README.md
git commit -m "Fix duration:0 toasts auto-closing immediately instead of persisting"
```

---

### Task 2: Add a `duration: 0` example to the Playground and verify manually

**Files:**
- Modify: `front/src/routes/(apps)/playground/components/ToastsSection.svelte`

**Interfaces:**
- Consumes: `toast.push(msg: string, opts?: Partial<SvelteToastOptions>)` from `$lib/components/Toast` (existing export, unchanged).
- Produces: no new exports; adds one new UI trigger function and button, following the exact pattern of the existing `showLongToast`/`showShortToast` functions in this file.

- [ ] **Step 1: Add a new trigger function**

In `front/src/routes/(apps)/playground/components/ToastsSection.svelte`, add this function next to `showShortToast` (after its closing brace, before `showInfoToast`):

```svelte
    function showPersistentToast() {
        toast.push('This toast stays until you dismiss it (duration: 0)', { duration: 0 });
    }
```

- [ ] **Step 2: Add the button to the "Basic Toasts" group**

Change:

```svelte
            <div class="control-group">
                <h3>Basic Toasts</h3>
                <div class="button-grid">
                    <button onclick={showBasicToast}>Basic Toast</button>
                    <button onclick={showLongToast}>Long Duration (8s)</button>
                    <button onclick={showShortToast}>Short Duration (2s)</button>
                </div>
            </div>
```

to:

```svelte
            <div class="control-group">
                <h3>Basic Toasts</h3>
                <div class="button-grid">
                    <button onclick={showBasicToast}>Basic Toast</button>
                    <button onclick={showLongToast}>Long Duration (8s)</button>
                    <button onclick={showShortToast}>Short Duration (2s)</button>
                    <button onclick={showPersistentToast}>Persistent (duration: 0)</button>
                </div>
            </div>
```

(Match indentation to the file's actual current formatting — it uses 4-space indents per the project's Prettier config.)

- [ ] **Step 3: Type-check and lint**

Run: `cd front && npm run check && npm run lint`
Expected: both commands exit with no errors.

- [ ] **Step 4: Manually verify using the new Playground button**

Run: `cd front && npm run dev` (leave running), then open `/playground` in a browser.

1. Click "Persistent (duration: 0)".
   Expected: the toast appears and **stays on screen** — progress bar full/static, not shrinking — until you click its dismiss button (✕). It must not flash and disappear immediately (that was the bug fixed in Task 1).
2. Click "Short Duration (2s)".
   Expected: the toast appears and auto-dismisses on its own after ~2 seconds (regression check — non-zero durations still work).

- [ ] **Step 5: Manually verify the original real-world bug path is fixed**

With the dev server still running:
1. Navigate to `/clipboard/create`.
2. Fill in a name and some content so client-side validation passes.
3. Open browser devtools → Network tab → set throttling to "Offline".
4. Click submit. The `uploadToClipboard` call fails with a network error, which `handleFormError` reports via `toast.push(message, { duration: 0, ... })`.
5. Set throttling back to "Online".

Expected: a red-bordered error toast ("Entry not created ...") appears and stays on screen until manually dismissed, confirming the fix resolves the originally reported issue.

Stop the dev server (Ctrl+C) once all checks pass.

- [ ] **Step 6: Commit**

```bash
cd /workdir
git add "front/src/routes/(apps)/playground/components/ToastsSection.svelte"
git commit -m "Add persistent (duration:0) toast example to Playground"
```

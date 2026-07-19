# Fix `duration: 0` auto-closing toasts immediately

## Origin

Started as a request to make `ClipboardForm.svelte`'s submit button: stay on
the page and show the error on failure, navigate back to `/clipboard` on
success. Investigation showed both behaviors are already implemented
correctly in `ClipboardForm.svelte` — no changes needed there.

The actual bug: when `uploadToClipboard` fails (e.g. a 400 `FILE_TOO_LARGE`
response), `handleFormError` calls `toast.push(message, { duration: 0, ... })`
intending "never auto-dismiss," but the toast flashes and disappears
immediately, so the user never sees the error.

## Root cause

In `front/src/lib/components/Toast/ToastItem.svelte`:

- The tweened progress store is created with `duration: item.duration ?? 0`.
  When the caller passes `duration: 0` (as `handleFormError` and
  `src/lib/auth/api.ts` both do, intending "persist until dismissed"), the
  tween itself is configured to complete in 0ms.
- A separate `$effect` animates `progress` from `item.initial` (default 1) to
  `item.next` (default 0) via `progress.set(next).then(autoclose)`.
- With a 0ms tween, that `set()` resolves on the same tick, `autoclose()` runs
  immediately, sees `$progress === 0`, and calls `close()` — popping the toast
  before it's visible.

This is a pre-existing, documented bug: the component's own README says
"Potentially introduced a bug: passing `duration: 0` close the toast
immediately maybe before it allowed a never closing toast. TODO Fix that."

## Fix

In `ToastItem.svelte`, special-case `item.duration === 0` to mean "never
auto-close": skip the tween-triggered `progress.set(next).then(autoclose)`
call entirely when duration is 0, leaving the progress bar static (full) and
the toast on screen until the user dismisses it manually (via the close
button) or it's removed programmatically (`toast.pop(...)`).

This fixes the bug at its source for every current and future caller of
`toast.push(..., { duration: 0 })`, including the existing usage in
`src/lib/auth/api.ts` that has the same latent issue.

No changes to `ClipboardForm.svelte`, `handleFormError`, or any other call
site are required.

## Testing

- Manual verification: trigger a form error that calls `handleFormError`
  (e.g. upload a clipboard entry that the backend rejects) and confirm the
  error toast appears and stays visible until dismissed.
- Manual verification: trigger a normal toast with a non-zero duration (e.g.
  a success toast) and confirm it still auto-dismisses after its configured
  duration, to make sure the fix doesn't regress the existing behavior.
- No existing automated test suite covers the Toast component; adding one is
  out of scope for this fix (small, isolated change, verified manually).

## Out of scope

- Any change to `ClipboardForm.svelte` (already correct).
- Any change to `handleFormError` or other toast call sites.
- Broader refactor of the Toast component beyond this one bug.

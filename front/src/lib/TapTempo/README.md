# TapTempo

A tap tempo tool that computes BPM from user taps and maps the result to classical music tempo markings.

## How it works

### BPM Calculation (`TapTempo.svelte.ts`)

The `TapTempo` class tracks a sliding window of taps over the last 15 seconds (`keptDuration = 15000ms`). On each call to `addBeat()`:

1. The current timestamp is pushed into `taps[]`.
2. Taps older than `keptDuration` are dropped from the front of the array.
3. `computeBPM()` is called.

`computeBPM()` uses a **ground-zero counter approach**:

- On the first tap (or after a 3-second gap resets `lastTap` to 0), `groundZero` is set to the current time and `counter` is reset to 0.
- BPM is derived from the elapsed time since `groundZero` and the number of beats counted: `bpm = round(60000 * counter / (now - groundZero))`.
- If more than 3 seconds pass between taps, `lastTap` is reset to 0, which triggers a new ground-zero on the next tap.

### UI (`+page.svelte`)

An info banner (`Notice`) tells the user to press Space or tap anywhere to get a BPM.

Input handling:
- Any `pointerdown` event on the page triggers `addBeat()`.
- `Space` always **clears pause** first, then triggers `addBeat()` — so Space resumes and counts in one gesture.
- `Enter` toggles pause. While paused, `addBeat` returns early so taps are ignored.
- `c` / Reset button calls `reset()`, zeroing `taps`, `bpm`, and `lastTap`, and clears pause.

Reactivity: `bpm` and `taps` are declared with `$state` inside `TapTempo.svelte.ts`, so mutations to those properties directly trigger Svelte's reactive graph. No manual reassignment workaround is needed.

The BPM display flashes briefly (`.tapped` CSS class for 100ms) on each beat. User selection is disabled on the container to prevent text highlighting during mouse/touch taps.

### Beats visualizer (`Beats.svelte`)

A p5.js canvas (600×100px, responsive width) draws a vertical line for each tap in the current window. Taps are mapped left-to-right from oldest (left edge) to newest (right edge) using `p5.map`. The canvas respects the active CSS theme via computed style variables. When paused, `p5.noLoop()` stops the draw loop.

### Tempo reference (`TempoList.svelte`)

A three-column grid lists 19 classical tempo markings (Larghissimo → Prestissimo) with their BPM ranges and descriptions. The row matching the current BPM is highlighted in bold.

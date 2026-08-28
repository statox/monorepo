<script lang="ts">
    import { tick } from 'svelte';
    import { computeLayout, chunkItems, type LayoutResult } from './layout';

    interface Props {
        content: string;
    }

    let { content }: Props = $props();

    const lines = $derived(content.split('\n'));
    const maxLineLength = $derived(Math.max(0, ...lines.map((line) => line.length)));

    const BOTTOM_MARGIN_PX = 16;

    let containerEl: HTMLDivElement | undefined = $state();
    let probeEl: HTMLSpanElement | undefined = $state();

    let layout: LayoutResult = $state({ mode: 'single', itemsPerColumn: 0, columnsPerRow: 1 });

    // Measures the pixel width of one monospace character via a hidden
    // 1ch-wide probe, since ch-to-px conversion depends on the actual
    // rendered font.
    const measureCharWidthPx = (): number => probeEl?.getBoundingClientRect().width ?? 0;

    const recompute = () => {
        if (!containerEl) return;

        const style = getComputedStyle(containerEl);
        const lineHeightPx = parseFloat(style.lineHeight);
        const gapPx = parseFloat(style.columnGap) || 0;
        const bodyWidthPx = containerEl.clientWidth;
        const charWidthPx = measureCharWidthPx();
        const availableHeightPx =
            window.innerHeight - containerEl.getBoundingClientRect().top - BOTTOM_MARGIN_PX;

        if (!lineHeightPx || !charWidthPx) return;

        layout = computeLayout({
            totalItems: lines.length,
            columnWidthPx: maxLineLength * charWidthPx,
            itemHeightPx: lineHeightPx,
            bodyWidthPx,
            availableHeightPx,
            gapPx
        });
    };

    const chunks = $derived(chunkItems(lines, layout.itemsPerColumn || lines.length));

    $effect(() => {
        // Wait a tick so the DOM reflects the current content before measuring it.
        tick().then(recompute);
    });

    const SINGLE_COLUMN_SCROLL_FRACTION = 0.6;

    // With a single column (modes 'wrap'/'single'), there's no next row to
    // measure - just scroll by a fraction of the viewport instead. With
    // multiple columns, every row is the same height (uniform
    // linesPerColumn), so scrolling by one column's height plus the row gap
    // moves exactly one row down.
    const scrollToNextRow = () => {
        if (!containerEl) return;

        if (layout.mode !== 'multi') {
            window.scrollBy({
                top: window.innerHeight * SINGLE_COLUMN_SCROLL_FRACTION,
                behavior: 'smooth'
            });
            return;
        }

        const firstColumn = containerEl.querySelector<HTMLElement>(':scope > .column-wrapper');
        if (!firstColumn) return;

        const rowGapPx = parseFloat(getComputedStyle(containerEl).rowGap) || 0;
        const rowHeightPx = firstColumn.getBoundingClientRect().height + rowGapPx;
        if (rowHeightPx <= 0) return;

        window.scrollBy({ top: rowHeightPx, behavior: 'smooth' });
    };

    const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']);

    // Shared by both the keydown and click handlers: never intercept
    // interactions with form controls, links, or other editable content, so
    // buttons like "Edit"/"Back" and the external song link keep working.
    const isInteractiveTarget = (target: EventTarget | null): boolean =>
        target instanceof HTMLElement &&
        (FORM_TAGS.has(target.tagName) ||
            target.isContentEditable ||
            target.closest('a, button, input, textarea, select') !== null);

    const onKeydown = (event: KeyboardEvent) => {
        if (event.code !== 'Space') return;
        if (isInteractiveTarget(event.target)) return;

        event.preventDefault();
        scrollToNextRow();
    };

    // Scoped to the content container (not window) so clicks anywhere else
    // on the page - buttons, links, the header - never trigger a scroll.
    // Skip while the user has an active text selection so copying chords
    // isn't disrupted.
    const onContentClick = (event: MouseEvent) => {
        if (isInteractiveTarget(event.target)) return;
        if ((window.getSelection()?.toString().length ?? 0) > 0) return;

        scrollToNextRow();
    };
</script>

<svelte:window onresize={recompute} onkeydown={onKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- Space-to-scroll is already handled globally via onkeydown above. -->
<div
    bind:this={containerEl}
    class="monospace-columns"
    style:max-width={layout.mode === 'multi'
        ? `calc(${layout.columnsPerRow} * ${maxLineLength}ch + ${layout.columnsPerRow - 1} * var(--monospace-columns-gap))`
        : 'none'}
    onclick={onContentClick}
>
    <span bind:this={probeEl} class="char-probe"></span>
    {#each chunks as chunk, i (i)}
        <div
            class="column-wrapper"
            style:width={layout.mode === 'wrap' ? '100%' : `${maxLineLength}ch`}
        >
            <div class="page-indicator">{i + 1}/{chunks.length}</div>
            <pre class="column" class:wrap={layout.mode === 'wrap'}>{chunk.join('\n')}</pre>
        </div>
    {/each}
</div>

<style>
    .monospace-columns {
        --monospace-columns-gap: 2em;
        display: flex;
        flex-wrap: wrap;
        gap: 1em var(--monospace-columns-gap);
        font-family: var(--nc-font-mono);
        line-height: 1.4;
    }

    .column-wrapper {
        flex: 0 0 auto;
    }

    .column {
        /* new.css and new_override.css style all <pre> elements
           (background, border, padding, font-size, max-width, max-height,
           overflow); reset them so column width stays exactly
           maxLineLength ch, height is never capped, and no column ever
           gets its own scrollbar. */
        margin: 0;
        padding: 0;
        border: none;
        border-top: solid 1px var(--nc-tx-3);
        border-radius: 0;
        background: none;
        font-size: inherit;
        width: 100%;
        max-width: none;
        max-height: none;
        overflow: visible;
        white-space: pre;
    }

    .column.wrap {
        white-space: pre-wrap;
        word-break: break-word;
    }

    .page-indicator {
        text-align: center;
        color: var(--nc-tx-3);
    }

    .char-probe {
        position: absolute;
        visibility: hidden;
        width: 1ch;
    }
</style>

<script lang="ts">
    /*
     *  This component is fully vibe coded and needs an appropriate human review
     */

    import { tick } from 'svelte';
    import ChordSheetJS from 'chordsheetjs';
    import { computeLayout, chunkItems, type LayoutResult } from '../MonospaceColumns/layout';

    interface Props {
        content: string | undefined;
    }

    let { content }: Props = $props();

    // POC: naive chordsheetjs transform preview, no format detection/cleanup.
    // One HTML string per source row (chord line + lyrics line), extracted
    // from HtmlDivFormatter's output so each row can be measured and
    // distributed across columns independently, the same way MonospaceColumns
    // distributes plain text lines.
    const rowsHtml = $derived.by((): string[] | undefined => {
        if (!content) {
            return undefined;
        }
        try {
            const parser = new ChordSheetJS.ChordsOverWordsParser();
            const song = parser.parse(content);
            const formatter = new ChordSheetJS.HtmlDivFormatter();
            const html = formatter.format(song);
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return Array.from(doc.querySelectorAll('.row')).map((row) => row.outerHTML);
        } catch (e) {
            return [
                `<p>chordsheetjs failed to parse this content: ${e instanceof Error ? e.message : String(e)}</p>`
            ];
        }
    });

    const BOTTOM_MARGIN_PX = 16;

    let containerEl: HTMLDivElement | undefined = $state();
    let probeEl: HTMLDivElement | undefined = $state();

    let layout: LayoutResult = $state({ mode: 'single', itemsPerColumn: 0, columnsPerRow: 1 });
    let columnWidthPx = $state(0);

    // Measures every row's natural (unwrapped) width/height in a hidden probe
    // holding all rows stacked, so column sizing is based on real rendered
    // dimensions (rows aren't a fixed character grid like plain text lines).
    const recompute = () => {
        if (!containerEl || !probeEl || !rowsHtml || rowsHtml.length === 0) return;

        const rowEls = Array.from(probeEl.children) as HTMLElement[];
        const measuredWidthPx = Math.max(
            0,
            ...rowEls.map((el) => el.getBoundingClientRect().width)
        );
        const itemHeightPx = rowEls[0]?.getBoundingClientRect().height ?? 0;

        if (!measuredWidthPx || !itemHeightPx) return;

        const style = getComputedStyle(containerEl);
        const gapPx = parseFloat(style.columnGap) || 0;
        const bodyWidthPx = containerEl.clientWidth;
        const availableHeightPx =
            window.innerHeight - containerEl.getBoundingClientRect().top - BOTTOM_MARGIN_PX;

        columnWidthPx = measuredWidthPx;
        layout = computeLayout({
            totalItems: rowsHtml.length,
            columnWidthPx: measuredWidthPx,
            itemHeightPx,
            bodyWidthPx,
            availableHeightPx,
            gapPx
        });
    };

    const chunks = $derived(
        rowsHtml ? chunkItems(rowsHtml, layout.itemsPerColumn || rowsHtml.length) : []
    );

    $effect(() => {
        // Synchronous read establishes the reactive dependency so this effect
        // re-runs when the preview is toggled on/off, not just on mount.
        const currentRows = rowsHtml;
        if (!currentRows) return;

        // Wait a tick so the DOM reflects the current rows before measuring.
        // Unlike MonospaceColumns (always the page's main content, near the
        // top of the viewport), this preview renders further down the page,
        // so containerEl's top offset can be large or even past the fold -
        // scroll it to the top first so the "how many rows fit on screen"
        // math below sees a realistic available height.
        tick().then(() => {
            containerEl?.scrollIntoView({ block: 'start' });
            recompute();
        });
    });

    const SINGLE_COLUMN_SCROLL_FRACTION = 0.6;

    // With a single column (modes 'wrap'/'single'), there's no next row to
    // measure - just scroll by a fraction of the viewport instead. With
    // multiple columns, every row is the same height (uniform
    // itemsPerColumn), so scrolling by one column's height plus the row gap
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

        const firstColumn = containerEl.querySelector<HTMLElement>(':scope > .page-column');
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

{#if rowsHtml}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- Space-to-scroll is already handled globally via onkeydown above. -->
    <div
        bind:this={containerEl}
        class="chordsheetjs-preview"
        style:max-width={layout.mode === 'multi'
            ? `calc(${layout.columnsPerRow} * ${columnWidthPx}px + ${layout.columnsPerRow - 1} * var(--chordsheetjs-preview-gap))`
            : 'none'}
        onclick={onContentClick}
    >
        <div bind:this={probeEl} class="row-probe" aria-hidden="true">
            {#each rowsHtml as rowHtml, k (k)}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- POC only, content generated from our own DB via chordsheetjs formatter -->
                {@html rowHtml}
            {/each}
        </div>
        {#each chunks as chunk, i (i)}
            <div class="page-column" style:width={`${columnWidthPx}px`}>
                <div class="page-indicator">{i + 1}/{chunks.length}</div>
                {#each chunk as rowHtml, j (j)}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- POC only, content generated from our own DB via chordsheetjs formatter -->
                    {@html rowHtml}
                {/each}
            </div>
        {/each}
    </div>
{/if}

<style>
    .chordsheetjs-preview {
        --chordsheetjs-preview-gap: 2em;
        display: flex;
        flex-wrap: wrap;
        gap: 1em var(--chordsheetjs-preview-gap);
        font-family: monospace;
        overflow-x: auto;
    }

    .page-column {
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;

        padding-bottom: 1em;
        border: none;
        border-top: solid 1px var(--nc-tx-3);
        border-radius: 0;
    }

    .row-probe {
        position: absolute;
        visibility: hidden;
    }

    .page-indicator {
        text-align: center;
        color: var(--nc-tx-3);
        font-weight: normal;
    }

    /* Markup below comes from chordsheetjs's HtmlDivFormatter, inserted via
       {@html} - these rules use :global since that markup isn't scoped by
       Svelte. flex-shrink/nowrap keep a row's natural width stable so the
       probe measurement above matches what's actually rendered. */
    :global(.chordsheetjs-preview .row) {
        display: flex;
        flex-wrap: nowrap;
    }

    :global(.chordsheetjs-preview .row .column) {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        white-space: pre;
    }

    /* A chord with no lyrics under it (e.g. an interlude line like
       "Em  C  D  Em") gets a column sized purely by its own chord text,
       so back-to-back chords otherwise touch with zero gap. Only add
       breathing room here, not on every column, so normal lyric spacing
       (which already separates words) isn't affected - margin is part of
       a flex item's box, so it's still picked up by the row-width probe. */
    :global(.chordsheetjs-preview .row .column:has(.lyrics:empty)) {
        margin-right: 0.75em;
    }

    /* Fixed (not min-) height and line-height, identical for chord and
       lyrics lines, on every column: this is what keeps every word's
       baseline aligned across a row. A min-height alone still lets a
       column's actual rendered height vary a hair from its neighbours
       (e.g. bold vs regular font metrics, empty vs non-empty text), and
       since each column independently stacks its own chord+lyrics
       top-to-bottom, that tiny per-column difference is what staggers
       individual words up/down within what should be one straight line. */
    :global(.chordsheetjs-preview .row .column .chord),
    :global(.chordsheetjs-preview .row .column .lyrics) {
        height: 1.4em;
        line-height: 1.4em;
    }

    :global(.chordsheetjs-preview .row .column .chord) {
        font-weight: bold;
        color: var(--nc-tx-3);
    }

    /* chordsheetjs renders a chordless column as a literal empty
       <div class="chord"></div>, so :empty reliably tells apart columns
       that have a chord above their lyrics from ones that don't. */
    :global(.chordsheetjs-preview .row .column:has(.chord:not(:empty)) .lyrics) {
        color: var(--nc-tx-3);
    }
</style>

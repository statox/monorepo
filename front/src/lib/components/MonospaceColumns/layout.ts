export interface LayoutParams {
    totalLines: number;
    maxLineLength: number;
    charWidthPx: number;
    lineHeightPx: number;
    bodyWidthPx: number;
    availableHeightPx: number;
    gapPx: number;
    maxColumns?: number;
}

export type LayoutMode = 'wrap' | 'single' | 'multi';

export interface LayoutResult {
    mode: LayoutMode;
    // Number of lines each column chunk holds. For 'wrap' and 'single' this
    // equals totalLines (there is only ever one chunk).
    linesPerColumn: number;
    // Cap on how many columns may share a row. 1 for 'wrap'/'single'. For
    // 'multi' this is used to cap the flex container's own width so that
    // CSS wrapping - not JS arithmetic - decides how many columns share a
    // row, and any columns beyond this cap flow to a new row.
    columnsPerRow: number;
}

const DEFAULT_MAX_COLUMNS = 4;
// Small safety margin subtracted from the available width before flooring,
// so that a rounding error at a width boundary makes us under-count the
// columns that fit rather than over-count them (over-counting is what
// caused columns to overflow in the previous column-count implementation).
const WIDTH_EPSILON_PX = 2;

export function computeLayout(params: LayoutParams): LayoutResult {
    const {
        totalLines,
        maxLineLength,
        charWidthPx,
        lineHeightPx,
        bodyWidthPx,
        availableHeightPx,
        gapPx,
        maxColumns = DEFAULT_MAX_COLUMNS
    } = params;

    if (maxLineLength === 0 || charWidthPx === 0 || lineHeightPx === 0) {
        return { mode: 'single', linesPerColumn: totalLines, columnsPerRow: 1 };
    }

    const columnWidthPx = maxLineLength * charWidthPx;

    // Not even one column fits without horizontal scrolling: wrap instead.
    if (columnWidthPx > bodyWidthPx) {
        return { mode: 'wrap', linesPerColumn: totalLines, columnsPerRow: 1 };
    }

    const maxColsByWidth = Math.max(
        1,
        Math.floor((bodyWidthPx - WIDTH_EPSILON_PX + gapPx) / (columnWidthPx + gapPx))
    );

    // Only one unwrapped column fits: show it at its natural height.
    if (maxColsByWidth === 1) {
        return { mode: 'single', linesPerColumn: totalLines, columnsPerRow: 1 };
    }

    const effectiveMax = Math.min(maxColsByWidth, maxColumns);

    // Prefer the fewest columns (starting at 1) that still avoid vertical
    // scrolling within a single row.
    for (let n = 1; n <= effectiveMax; n++) {
        const rowsNeeded = Math.ceil(totalLines / n);
        if (rowsNeeded * lineHeightPx <= availableHeightPx) {
            return { mode: 'multi', linesPerColumn: rowsNeeded, columnsPerRow: n };
        }
    }

    // Even effectiveMax columns in one row can't fit the content within the
    // page height: cap each column at as many lines as fit the available
    // height, and let extra columns flow to additional rows below.
    const linesPerColumn = Math.max(1, Math.floor(availableHeightPx / lineHeightPx));
    return { mode: 'multi', linesPerColumn, columnsPerRow: effectiveMax };
}

export function chunkLines(lines: string[], linesPerColumn: number): string[][] {
    if (linesPerColumn <= 0 || lines.length === 0) return [lines];

    const chunks: string[][] = [];
    for (let i = 0; i < lines.length; i += linesPerColumn) {
        chunks.push(lines.slice(i, i + linesPerColumn));
    }
    return chunks;
}

export interface LayoutParams {
    totalItems: number;
    // Pixel width of a single column. Callers compute this however makes
    // sense for their content (e.g. maxLineLength * charWidthPx for
    // monospace text, or the widest rendered row for arbitrary HTML rows).
    columnWidthPx: number;
    // Pixel height of a single item (line, row, ...). Items are assumed to
    // all share this height, which is what makes "how many items fit in
    // availableHeightPx" a simple division.
    itemHeightPx: number;
    bodyWidthPx: number;
    availableHeightPx: number;
    gapPx: number;
    maxColumns?: number;
}

export type LayoutMode = 'wrap' | 'single' | 'multi';

export interface LayoutResult {
    mode: LayoutMode;
    // Number of items each column chunk holds. For 'wrap' and 'single' this
    // equals totalItems (there is only ever one chunk).
    itemsPerColumn: number;
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
        totalItems,
        columnWidthPx,
        itemHeightPx,
        bodyWidthPx,
        availableHeightPx,
        gapPx,
        maxColumns = DEFAULT_MAX_COLUMNS
    } = params;

    if (columnWidthPx === 0 || itemHeightPx === 0) {
        return { mode: 'single', itemsPerColumn: totalItems, columnsPerRow: 1 };
    }

    // Not even one column fits without horizontal scrolling: wrap instead.
    if (columnWidthPx > bodyWidthPx) {
        return { mode: 'wrap', itemsPerColumn: totalItems, columnsPerRow: 1 };
    }

    const maxColsByWidth = Math.max(
        1,
        Math.floor((bodyWidthPx - WIDTH_EPSILON_PX + gapPx) / (columnWidthPx + gapPx))
    );

    // Only one unwrapped column fits: show it at its natural height.
    if (maxColsByWidth === 1) {
        return { mode: 'single', itemsPerColumn: totalItems, columnsPerRow: 1 };
    }

    const effectiveMax = Math.min(maxColsByWidth, maxColumns);

    // Prefer the fewest columns (starting at 1) that still avoid vertical
    // scrolling within a single row.
    for (let n = 1; n <= effectiveMax; n++) {
        const rowsNeeded = Math.ceil(totalItems / n);
        if (rowsNeeded * itemHeightPx <= availableHeightPx) {
            return { mode: 'multi', itemsPerColumn: rowsNeeded, columnsPerRow: n };
        }
    }

    // Even effectiveMax columns in one row can't fit the content within the
    // page height: cap each column at as many items as fit the available
    // height, and let extra columns flow to additional rows below.
    const itemsPerColumn = Math.max(1, Math.floor(availableHeightPx / itemHeightPx));
    return { mode: 'multi', itemsPerColumn, columnsPerRow: effectiveMax };
}

export function chunkItems<T>(items: T[], itemsPerColumn: number): T[][] {
    if (itemsPerColumn <= 0 || items.length === 0) return [items];

    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += itemsPerColumn) {
        chunks.push(items.slice(i, i + itemsPerColumn));
    }
    return chunks;
}

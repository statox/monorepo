import { JSDOM } from 'jsdom';

export const name = 'boiteachansons';

export const matches = (url: string): boolean => {
    return /(^|\.)boiteachansons\.net$/.test(new URL(url).hostname);
};

export const extract = (html: string): string | null => {
    const dom = new JSDOM(html);
    const container = dom.window.document.querySelector('#divPartition');
    if (!container) return null;

    const lineEls = Array.from(container.children).filter((el) => el.classList.contains('pL'));
    if (lineEls.length === 0) return null;

    return lineEls.map(renderLine).join('\n\n');
};

const renderLine = (lineEl: Element): string => {
    let lyric = '';
    const chordPositions: { column: number; chord: string }[] = [];

    for (const node of lineEl.childNodes) {
        if (node.nodeType === 3) {
            lyric += node.textContent ?? '';
            continue;
        }
        if (node.nodeType !== 1) continue;

        const el = node as Element;
        const anchor = el.matches('span.a[data-a]') ? el : el.querySelector('span.a[data-a]');
        if (anchor) {
            chordPositions.push({
                column: lyric.length,
                chord: anchor.getAttribute('data-a') ?? ''
            });
        }
        lyric += el.textContent ?? '';
    }

    let chordLine = '';
    for (const { column, chord } of chordPositions) {
        const minCol = chordLine.length === 0 ? 0 : chordLine.length + 1;
        const target = Math.max(column, minCol);
        chordLine = chordLine.padEnd(target, ' ') + chord;
    }

    return `${chordLine}\n${lyric}`;
};

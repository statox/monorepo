import { JSDOM } from 'jsdom';

export const name = 'ultimate-guitar';

export const matches = (url: string): boolean => {
    return /(^|\.)ultimate-guitar\.com$/.test(new URL(url).hostname);
};

export const extract = (html: string): string | null => {
    const match = html.match(/class="js-store" data-content="([^"]*)"><\/div>/s);
    if (!match) return null;

    try {
        const jsonText = unescapeHtml(match[1]);
        const data = JSON.parse(jsonText);
        const content = data?.store?.page?.data?.tab_view?.wiki_tab?.content;
        if (typeof content !== 'string') return null;

        return content
            .replace(/\r\n/g, '\n')
            .replace(/\[\/?ch\]/g, '')
            .replace(/\[\/?tab\]/g, '');
    } catch {
        return null;
    }
};

const unescapeHtml = (s: string): string => {
    return JSDOM.fragment(s).textContent ?? '';
};

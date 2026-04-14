import { InvalidUrlError } from './errors.js';

export const getPageTitle = async (url: string): Promise<string> => {
    try {
        new URL(url);
    } catch {
        throw new InvalidUrlError();
    }

    const response = await fetch(url);
    const html = await response.text();

    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match?.[1]?.trim() ?? '';
};

import { fetchPageTitle } from './api';

export class InvalidUrlError extends Error {
    constructor(url: string) {
        super(`Invalid URL: ${url}`);
    }
}

/**
 * Fetches and returns the <title> of the page at the given URL.
 * Throws InvalidUrlError if the string is not a valid URL.
 */
export const getPageTitle = async (url: string): Promise<string> => {
    try {
        new URL(url);
    } catch {
        throw new InvalidUrlError(url);
    }

    return fetchPageTitle(url);
};

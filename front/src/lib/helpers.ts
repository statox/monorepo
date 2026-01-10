import { PUBLIC_API_URL_PROD, PUBLIC_API_URL_LOCAL } from '$env/static/public';
import { get } from 'svelte/store';
import { apiUrlTypeStore } from '$lib/api/apiUrlStore';

export const alphaSort = (a: string, b: string) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
};

export const alphaLowerSort = (a: string, b: string) => {
    const _a = a.toLowerCase();
    const _b = b.toLowerCase();
    return alphaSort(_a, _b);
};

export const getApiUrl = () => {
    const selectedType = get(apiUrlTypeStore);
    return selectedType === 'local' ? PUBLIC_API_URL_LOCAL : PUBLIC_API_URL_PROD;
};

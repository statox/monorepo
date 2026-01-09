import { PUBLIC_API_URL } from '$env/static/public';

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
    return PUBLIC_API_URL;
};

import { client2 } from '$lib/api';

export const fetchPageTitle = async (url: string): Promise<string> => {
    const result = await client2.webReader.getPageTitle({ url });
    return result.title;
};

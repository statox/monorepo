import { client2 } from '$lib/api';
import type { Youtube_Subscriptions_Output } from '$vendor/statox-api';

export const fetchSubscriptions = async (): Promise<Youtube_Subscriptions_Output> => {
    return await client2.youtube.subscriptions();
};

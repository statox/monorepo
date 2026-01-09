import { getApiUrl } from '$lib/helpers';
import { APIClient } from '$vendor/statox-api';

export const client2 = new APIClient({
    baseURL: getApiUrl(),
    credentials: 'include'
});

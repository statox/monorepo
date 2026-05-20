import { getApiUrl } from '$lib/helpers';
import { APIClient } from 'statox-api';

export const client2 = APIClient({
    baseURL: getApiUrl()
});

import { PUBLIC_API_URL } from '$env/static/public';
import { APIClient } from '$vendor/statox-api';

export const client2 = new APIClient({
    baseURL: PUBLIC_API_URL,
    credentials: 'include'
});

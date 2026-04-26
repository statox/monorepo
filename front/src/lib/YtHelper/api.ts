import type { SubscriptionsResponse } from './types';

const SUBSCRIPTIONS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/subscriptions';

export async function fetchSubscriptions(token: string): Promise<string[]> {
    const params = new URLSearchParams({
        part: 'snippet',
        mine: 'true',
        maxResults: '50'
    });

    const response = await fetch(`${SUBSCRIPTIONS_ENDPOINT}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`YouTube API error (${response.status}): ${text}`);
    }

    const data: SubscriptionsResponse = await response.json();
    return data.items.map((item) => item.snippet.title);
}

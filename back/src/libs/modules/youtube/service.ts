type Subscription = {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
};

type YouTubeApiResponse = {
    items: Array<{
        id: string;
        snippet: {
            title: string;
            description: string;
            thumbnails?: { default?: { url: string } };
        };
    }>;
};

export const fetchSubscriptions = async (accessToken: string): Promise<Subscription[]> => {
    const url = new URL('https://www.googleapis.com/youtube/v3/subscriptions');

    url.search = new URLSearchParams({
        part: 'snippet',
        mine: 'true',
        maxResults: '1000',
        order: 'alphabetical'
    }).toString();

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as YouTubeApiResponse;

    return data.items.map((item) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails?.default?.url ?? null
    }));
};

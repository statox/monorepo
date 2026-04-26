export type AuthStatus = 'unauthenticated' | 'loading' | 'authenticated';

export interface AuthState {
    status: AuthStatus;
    token: string | null;
    subscriptions: string[];
    error: string | null;
}

export interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export interface SubscriptionItem {
    snippet: {
        title: string;
    };
}

export interface SubscriptionsResponse {
    items: SubscriptionItem[];
    nextPageToken?: string;
}

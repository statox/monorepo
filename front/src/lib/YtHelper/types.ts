import type { Youtube_Subscriptions_Output } from '$vendor/statox-api';

export type AuthStatus = 'unauthenticated' | 'loading' | 'authenticated';

export interface AuthState {
    status: AuthStatus;
    subscriptions: Youtube_Subscriptions_Output;
    error: string | null;
}

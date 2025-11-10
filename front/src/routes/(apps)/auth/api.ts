import { client } from '$lib/api';

export type UserProfile = {
    status: 'logged_out' | 'logged_in';
    user: {
        id: number;
        username: string;
    };
};

export const getProfile = client.auth.me;

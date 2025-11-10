import { requestAPIPost } from '$lib/api';

export type UserProfile = {
    status: 'logged_out' | 'logged_in';
    user: {
        id: number;
        username: string;
    };
};

export const getProfile = () =>
    requestAPIPost<UserProfile>({
        path: '/auth/me',
        data: {}
    });

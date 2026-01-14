// List of possible scopes
export type Scope = 'admin' | 'public' | 'homeTracker';

export type User = {
    id: number;
    username: string;
    scopes: Scope[];
};

export type UserProfile = {
    status: 'logged_out' | 'logged_in';
    user: User;
};

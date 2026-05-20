// List of possible scopes
// TODO Extract that directly from statox-api
export type Scope = 'admin' | 'public' | 'homeTracker' | 'personalTracker';

export type User = {
    id: number;
    username: string;
    scopes: Scope[];
};

export type UserProfile = {
    status: 'logged_out' | 'logged_in';
    user: User;
};

import { PRNG } from 'simple-prng';
import type { Scope, UserProfile } from './types';

const rng = new PRNG();

export const isAllowedForUser = (scope: Scope, userProfile: UserProfile | undefined) => {
    if (!userProfile) {
        return false;
    }

    if (userProfile.user.scopes.includes('admin')) {
        return true;
    }
    return userProfile.user.scopes.includes(scope);
};

const stringToSeed = (str: string) => {
    return str.split('').reduce((total, letter, i) => {
        return total + (i + 1) * letter.charCodeAt(0);
    }, 1);
};

export const usernameToColor = (username: string | undefined) => {
    if (!username) {
        return '#990000';
    }

    const seed = stringToSeed(username);
    rng.initialize(seed);

    const R = Math.floor(rng.random() * 255)
        .toString(16)
        .padStart(2, '0');
    const G = Math.floor(rng.random() * 255)
        .toString(16)
        .padStart(2, '0');
    const B = Math.floor(rng.random() * 255)
        .toString(16)
        .padStart(2, '0');

    return `#${R}${G}${B}`;
};

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
    const getComplementaryColor = (hexColor: string) => {
        const hex = hexColor.replace('#', '');

        const R = parseInt(hex.substring(0, 2), 16);
        const G = parseInt(hex.substring(2, 4), 16);
        const B = parseInt(hex.substring(4, 6), 16);

        const compR = (255 - R).toString(16).padStart(2, '0');
        const compG = (255 - G).toString(16).padStart(2, '0');
        const compB = (255 - B).toString(16).padStart(2, '0');

        return `#${compR}${compG}${compB}`;
    };

    if (!username) {
        const color = '#990000';
        return { main: color, complementary: getComplementaryColor(color) };
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

    const color = `#${R}${G}${B}`;
    return { main: color, complementary: getComplementaryColor(color) };
};

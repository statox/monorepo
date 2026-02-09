import { isProd, isTests } from './env.js';

/*
 * This is a dummy env variable setup to test dotenvx.
 * TO BE REMOVED once dotenvx is properly integrated.
 */

const DUMMY_PROD = process.env.DUMMY!;
const DUMMY_DEV = 'dummy dev';
const DUMMY_TESTS = 'dummy tests';

let dummy: string;
if (isProd) {
    dummy = DUMMY_PROD;
} else if (isTests) {
    dummy = DUMMY_TESTS;
} else {
    dummy = DUMMY_DEV;
}

export const DUMMY = dummy;

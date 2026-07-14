import { describe, expect, it } from 'vitest';
import {
    clampToMinInterval,
    fromMilliseconds,
    getMinInterval,
    resolveIsPaused,
    toMilliseconds
} from './refresh-interval-utils.js';

describe('fromMilliseconds', () => {
    it('picks hours when the value exceeds an hour and no unit is forced', () => {
        expect(fromMilliseconds(2 * 60 * 60 * 1000)).toEqual({ units: 'h', value: 2 });
    });

    it('picks minutes when the value exceeds a minute and no unit is forced', () => {
        expect(fromMilliseconds(90 * 1000)).toEqual({ units: 'm', value: 1.5 });
    });

    it('falls back to seconds', () => {
        expect(fromMilliseconds(500)).toEqual({ units: 's', value: 0.5 });
    });

    it('respects a forced unit', () => {
        expect(fromMilliseconds(500, 'm')).toEqual({ units: 'm', value: 0.01 });
    });
});

describe('toMilliseconds', () => {
    it('converts hours', () => {
        expect(toMilliseconds('h', 2)).toBe(2 * 60 * 60 * 1000);
    });

    it('converts minutes', () => {
        expect(toMilliseconds('m', 1.5)).toBe(90 * 1000);
    });

    it('converts seconds', () => {
        expect(toMilliseconds('s', 0.5)).toBe(500);
    });
});

describe('getMinInterval', () => {
    it('returns 0 when no minInterval is given', () => {
        expect(getMinInterval()).toBe(0);
    });

    it('rounds the minInterval up into the given unit so the displayed floor never permits a value below the real minimum', () => {
        // 90s = 1.5m; flooring to 1m would let a user apply a 60s interval,
        // which is below the actual 90s minimum.
        expect(getMinInterval(90 * 1000, 'm')).toBe(2);
    });
});

describe('clampToMinInterval', () => {
    it('leaves the value unchanged when it is already at or above the minimum', () => {
        expect(clampToMinInterval(120 * 1000, 60 * 1000)).toBe(120 * 1000);
    });

    it('bumps the value up to the minimum when it is below it', () => {
        expect(clampToMinInterval(30 * 1000, 90 * 1000)).toBe(90 * 1000);
    });

    it('treats a missing minInterval as no floor', () => {
        expect(clampToMinInterval(30 * 1000)).toBe(30 * 1000);
    });
});

describe('resolveIsPaused', () => {
    it('forces paused when the resolved interval is zero, even if resuming was requested', () => {
        expect(resolveIsPaused(0, false)).toBe(true);
    });

    it('forces paused when the resolved interval is negative', () => {
        expect(resolveIsPaused(-1, false)).toBe(true);
    });

    it('honors the requested paused state when the interval is positive', () => {
        expect(resolveIsPaused(1000, false)).toBe(false);
        expect(resolveIsPaused(1000, true)).toBe(true);
    });
});

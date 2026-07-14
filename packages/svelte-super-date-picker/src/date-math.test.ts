import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import {
    DATE_MODES,
    INVALID_DATE,
    getDateMode,
    hasRangeChanged,
    isRelativeToNow,
    parse,
    parseRelativeParts,
    toAbsoluteString,
    toMillisRange,
    toRelativeString,
    toRelativeStringFromParts
} from './date-math.js';

const NOW = DateTime.fromISO('2026-07-04T12:00:00.000Z');

describe('getDateMode', () => {
    it('returns "now" for the literal string "now"', () => {
        expect(getDateMode('now')).toBe(DATE_MODES.NOW);
    });

    it('returns "relative" for expressions containing now', () => {
        expect(getDateMode('now-15m')).toBe(DATE_MODES.RELATIVE);
        expect(getDateMode('now/d')).toBe(DATE_MODES.RELATIVE);
    });

    it('returns "absolute" for ISO strings', () => {
        expect(getDateMode('2026-07-04T12:00:00.000Z')).toBe(DATE_MODES.ABSOLUTE);
    });
});

describe('parse', () => {
    it('parses "now" to the reference instant', () => {
        expect(parse('now', { now: NOW })?.toMillis()).toBe(NOW.toMillis());
    });

    it('parses a "now-Nunit" relative offset', () => {
        const result = parse('now-15m', { now: NOW });
        expect(result?.toISO()).toBe(NOW.minus({ minutes: 15 }).toISO());
    });

    it('parses a "now+Nunit" relative offset', () => {
        const result = parse('now+2h', { now: NOW });
        expect(result?.toISO()).toBe(NOW.plus({ hours: 2 }).toISO());
    });

    it('rounds down to the start of the unit by default when a snap is present', () => {
        const result = parse('now/d', { now: NOW });
        expect(result?.toISO()).toBe(NOW.startOf('day').toISO());
    });

    it('rounds up to the end of the unit when roundUp is true', () => {
        const result = parse('now/d', { now: NOW, roundUp: true });
        expect(result?.toISO()).toBe(NOW.endOf('day').toISO());
    });

    it('applies the snap after the offset', () => {
        const result = parse('now-1d/d', { now: NOW });
        expect(result?.toISO()).toBe(NOW.minus({ days: 1 }).startOf('day').toISO());
    });

    it('parses an absolute ISO string', () => {
        const result = parse('2020-01-01T00:00:00.000Z');
        expect(result?.toISO()).toBe(DateTime.fromISO('2020-01-01T00:00:00.000Z').toISO());
    });

    it('returns null for an invalid string', () => {
        expect(parse('not-a-date')).toBeNull();
    });
});

describe('parseRelativeParts / toRelativeStringFromParts round-trip', () => {
    it('parses now-40m', () => {
        expect(parseRelativeParts('now-40m')).toEqual({ count: 40, unit: 'm', round: false });
    });

    it('parses now+40m', () => {
        expect(parseRelativeParts('now+40m')).toEqual({ count: 40, unit: 'm+', round: false });
    });

    it('parses now-1d/d as rounded', () => {
        expect(parseRelativeParts('now-1d/d')).toEqual({
            count: 1,
            unit: 'd',
            round: true,
            roundUnit: 'd'
        });
    });

    it('parses bare "now" as zero count', () => {
        expect(parseRelativeParts('now')).toEqual({ count: 0, unit: 's', round: false });
    });

    it('formats parts back into a relative string', () => {
        expect(toRelativeStringFromParts({ count: 40, unit: 'm', round: false })).toBe('now-40m');
        expect(toRelativeStringFromParts({ count: 40, unit: 'm+', round: false })).toBe('now+40m');
        expect(
            toRelativeStringFromParts({ count: 1, unit: 'd', round: true, roundUnit: 'd' })
        ).toBe('now-1d/d');
        expect(toRelativeStringFromParts({ count: 0, unit: 's', round: false })).toBe('now');
    });

    it('round-trips an absolute string into an approximate relative string', () => {
        const twoHoursAgo = NOW.minus({ hours: 2 }).toISO() as string;
        expect(toRelativeString(twoHoursAgo, NOW)).toBe('now-2h');
    });

    it('picks the unit itself, not the next smaller one, when the duration is exactly one unit', () => {
        const oneHourAgo = NOW.minus({ hours: 1 }).toISO() as string;
        expect(toRelativeString(oneHourAgo, NOW)).toBe('now-1h');
    });
});

describe('isRelativeToNow', () => {
    it('is true for a relative start and "now" end', () => {
        expect(isRelativeToNow('now-15m', 'now')).toBe(true);
    });

    it('is true for a "now" start and relative end (future window)', () => {
        expect(isRelativeToNow('now', 'now+15m')).toBe(true);
    });

    it('is false for two absolute dates', () => {
        expect(isRelativeToNow('2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z')).toBe(false);
    });
});

describe('toAbsoluteString / toRelativeString', () => {
    it('resolves a relative string to an ISO string', () => {
        expect(toAbsoluteString('now-15m')).not.toBe(INVALID_DATE);
        expect(() => DateTime.fromISO(toAbsoluteString('now-15m'))).not.toThrow();
    });

    it('returns the original string unchanged for unparseable input', () => {
        expect(toAbsoluteString('not-a-date')).toBe('not-a-date');
    });
});

describe('hasRangeChanged', () => {
    it('is false when both start and end match the original props', () => {
        expect(
            hasRangeChanged({ start: 'now-15m', end: 'now' }, { start: 'now-15m', end: 'now' })
        ).toBe(false);
    });

    it('is true when start differs', () => {
        expect(
            hasRangeChanged({ start: 'now-1h', end: 'now' }, { start: 'now-15m', end: 'now' })
        ).toBe(true);
    });

    it('is true when end differs', () => {
        expect(
            hasRangeChanged({ start: 'now-15m', end: 'now-5m' }, { start: 'now-15m', end: 'now' })
        ).toBe(true);
    });
});

describe('toMillisRange', () => {
    it('converts an absolute range to milliseconds', () => {
        const result = toMillisRange('2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z');
        expect(result).toEqual({
            startDateMs: DateTime.fromISO('2020-01-01T00:00:00.000Z').toMillis(),
            endDateMs: DateTime.fromISO('2020-01-02T00:00:00.000Z').toMillis()
        });
    });

    it('rounds the end up when both start and end are the same relative string', () => {
        const result = toMillisRange('now/d', 'now/d', { now: NOW });
        expect(result).toEqual({
            startDateMs: NOW.startOf('day').toMillis(),
            endDateMs: NOW.endOf('day').toMillis()
        });
        expect(result?.startDateMs).not.toBe(result?.endDateMs);
    });

    it('returns null when start is unparseable', () => {
        expect(toMillisRange('not-a-date', 'now', { now: NOW })).toBeNull();
    });

    it('returns null when end is unparseable', () => {
        expect(toMillisRange('now', 'not-a-date', { now: NOW })).toBeNull();
    });
});

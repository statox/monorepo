import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { parseTimeParts } from './quick-select-utils.js';

const NOW = DateTime.fromISO('2026-07-04T12:00:00.000Z', { zone: 'utc' });

describe('parseTimeParts', () => {
    it('parses a "last" window from start=now-40m, end=now', () => {
        expect(parseTimeParts('now-40m', 'now', NOW)).toEqual({
            timeTense: 'last',
            timeUnits: 'm',
            timeValue: 40
        });
    });

    it('parses a "next" window from start=now, end=now+2h', () => {
        expect(parseTimeParts('now', 'now+2h', NOW)).toEqual({
            timeTense: 'next',
            timeUnits: 'h',
            timeValue: 2
        });
    });

    it('approximates a round-only expression (now/d) by diffing the resolved date against now', () => {
        // NOW is 2026-07-04T12:00:00.000Z; now/d resolves to the start of that
        // day (2026-07-04T00:00:00.000Z), 12 hours before NOW.
        expect(parseTimeParts('now/d', 'now', NOW)).toEqual({
            timeTense: 'last',
            timeUnits: 'h',
            timeValue: 12
        });
    });

    it('approximates a plain absolute date (no "now" in the string) against now', () => {
        const twoHoursAgo = NOW.minus({ hours: 2 }).toISO() as string;
        expect(parseTimeParts(twoHoursAgo, 'now', NOW)).toEqual({
            timeTense: 'last',
            timeUnits: 'h',
            timeValue: 2
        });
    });

    it('approximates a round-only expression exactly one day away as 1 day, not 24 hours', () => {
        // now/M resolves to the start of the month (2026-07-01T00:00:00.000Z),
        // exactly 1 day before this reference instant.
        const oneDayIntoTheMonth = DateTime.fromISO('2026-07-02T00:00:00.000Z', { zone: 'utc' });
        expect(parseTimeParts('now/M', 'now', oneDayIntoTheMonth)).toEqual({
            timeTense: 'last',
            timeUnits: 'd',
            timeValue: 1
        });
    });

    it('defaults to a zero-second "last" window for unparseable input', () => {
        expect(parseTimeParts('not-a-date', 'now', NOW)).toEqual({
            timeTense: 'last',
            timeUnits: 's',
            timeValue: 0
        });
    });
});

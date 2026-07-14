import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { commonDurationRanges } from './time-options.js';
import { prettyDuration, showPrettyDuration } from './pretty-duration.js';

const NOW = DateTime.fromISO('2026-07-04T12:00:00.000Z', { zone: 'utc' });
const dateFormat = 'MMM d, yyyy @ HH:mm:ss';

describe('prettyDuration', () => {
    it('uses the matching commonly-used range label when start/end match exactly', () => {
        expect(
            prettyDuration('now/d', 'now/d', {
                commonlyUsedRanges: commonDurationRanges,
                dateFormat,
                now: NOW
            })
        ).toBe('Today');
    });

    it('formats a relative "last N unit" window', () => {
        expect(
            prettyDuration('now-15m', 'now', { commonlyUsedRanges: [], dateFormat, now: NOW })
        ).toBe('Last 15 minutes');
    });

    it('formats a relative "next N unit" window', () => {
        expect(
            prettyDuration('now', 'now+2h', { commonlyUsedRanges: [], dateFormat, now: NOW })
        ).toBe('Next 2 hours');
    });

    it('pluralizes singular counts correctly', () => {
        expect(
            prettyDuration('now-1m', 'now', { commonlyUsedRanges: [], dateFormat, now: NOW })
        ).toBe('Last 1 minute');
    });

    it('falls back to a formatted absolute range when nothing else matches', () => {
        const start = '2020-01-01T00:00:00.000Z';
        const end = '2020-01-02T00:00:00.000Z';
        const result = prettyDuration(start, end, { commonlyUsedRanges: [], dateFormat, now: NOW });
        expect(result).toBe(
            `${DateTime.fromISO(start).toFormat(dateFormat)} to ${DateTime.fromISO(end).toFormat(dateFormat)}`
        );
    });
});

describe('showPrettyDuration', () => {
    it('is true when the range matches a commonly-used range', () => {
        expect(showPrettyDuration('now/d', 'now/d', commonDurationRanges)).toBe(true);
    });

    it('is true when the range is relative to now', () => {
        expect(showPrettyDuration('now-15m', 'now', [])).toBe(true);
    });

    it('is false for two absolute dates not in the commonly-used list', () => {
        expect(showPrettyDuration('2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z', [])).toBe(
            false
        );
    });
});

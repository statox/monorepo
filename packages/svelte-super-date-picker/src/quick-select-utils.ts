import { DateTime } from 'luxon';
import { parseRelativeParts } from './date-math.js';
import type { QuickSelect, TimeUnitId } from './types.js';

const isNow = (value: string) => value === 'now';

export function parseTimeParts(
    start: string,
    end: string,
    now: DateTime = DateTime.now()
): QuickSelect {
    const value = isNow(start) ? end : start;
    const parts = parseRelativeParts(value, now);
    const isNext = parts.unit.endsWith('+');

    return {
        timeTense: isNext ? 'next' : 'last',
        timeUnits: (isNext ? parts.unit.slice(0, -1) : parts.unit) as TimeUnitId,
        timeValue: parts.count
    };
}

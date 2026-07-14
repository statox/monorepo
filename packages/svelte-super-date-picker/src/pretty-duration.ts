import { DateTime } from 'luxon';
import {
    DATE_MODES,
    getDateMode,
    INVALID_DATE,
    isRelativeToNow,
    parse,
    parseRelativeParts
} from './date-math.js';
import type { DurationRange, RelativeParts, ShortDate, TimeUnitAllId } from './types.js';

const RELATIVE_DURATION_LABELS: Record<TimeUnitAllId, (count: number) => string> = {
    s: (count) => `Last ${count} second${count === 1 ? '' : 's'}`,
    's+': (count) => `Next ${count} second${count === 1 ? '' : 's'}`,
    m: (count) => `Last ${count} minute${count === 1 ? '' : 's'}`,
    'm+': (count) => `Next ${count} minute${count === 1 ? '' : 's'}`,
    h: (count) => `Last ${count} hour${count === 1 ? '' : 's'}`,
    'h+': (count) => `Next ${count} hour${count === 1 ? '' : 's'}`,
    d: (count) => `Last ${count} day${count === 1 ? '' : 's'}`,
    'd+': (count) => `Next ${count} day${count === 1 ? '' : 's'}`,
    w: (count) => `Last ${count} week${count === 1 ? '' : 's'}`,
    'w+': (count) => `Next ${count} week${count === 1 ? '' : 's'}`,
    M: (count) => `Last ${count} month${count === 1 ? '' : 's'}`,
    'M+': (count) => `Next ${count} month${count === 1 ? '' : 's'}`,
    y: (count) => `Last ${count} year${count === 1 ? '' : 's'}`,
    'y+': (count) => `Next ${count} year${count === 1 ? '' : 's'}`
};

const ROUNDED_LABELS: Record<string, string> = {
    s: 'second',
    m: 'minute',
    h: 'hour',
    d: 'day',
    w: 'week',
    M: 'month',
    y: 'year'
};

function hasRangeMatch(timeFrom: ShortDate, timeTo: ShortDate, ranges: DurationRange[]) {
    return ranges.find(({ start, end }) => timeFrom === start && timeTo === end);
}

export function showPrettyDuration(
    timeFrom: ShortDate,
    timeTo: ShortDate,
    quickRanges: DurationRange[]
): boolean {
    if (hasRangeMatch(timeFrom, timeTo, quickRanges)) return true;
    return isRelativeToNow(timeFrom, timeTo);
}

function formatTimeString(
    timeString: ShortDate,
    dateFormat: string,
    opts: { roundUp?: boolean; now?: DateTime } = {}
): string {
    if (timeString === 'now') return 'now';

    const parsed = parse(timeString, opts);
    if (!parsed || !parsed.isValid) return INVALID_DATE;

    return parsed.toFormat(dateFormat);
}

export function prettyDuration(
    timeFrom: ShortDate,
    timeTo: ShortDate,
    opts: { commonlyUsedRanges: DurationRange[]; dateFormat: string; now?: DateTime }
): string {
    const { commonlyUsedRanges, dateFormat, now } = opts;

    const matchingQuickRange = hasRangeMatch(timeFrom, timeTo, commonlyUsedRanges);
    if (matchingQuickRange?.label) {
        return matchingQuickRange.label;
    }

    if (isRelativeToNow(timeFrom, timeTo)) {
        const relativeParts: RelativeParts =
            getDateMode(timeTo) === DATE_MODES.NOW
                ? parseRelativeParts(timeFrom, now)
                : parseRelativeParts(timeTo, now);

        const label = RELATIVE_DURATION_LABELS[relativeParts.unit as TimeUnitAllId]?.(
            relativeParts.count
        );

        if (label) {
            if (relativeParts.round && relativeParts.roundUnit) {
                return `${label} rounded to the ${ROUNDED_LABELS[relativeParts.roundUnit]}`;
            }
            return label;
        }
    }

    const displayFrom = formatTimeString(timeFrom, dateFormat, { now });
    const displayTo = formatTimeString(timeTo, dateFormat, { roundUp: true, now });
    return `${displayFrom} to ${displayTo}`;
}

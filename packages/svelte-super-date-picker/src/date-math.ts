import { DateTime, Duration, type DateTimeUnit } from 'luxon';
import type { DurationRange, RelativeParts, ShortDate, TimeUnitId } from './types.js';

const ROUND_DELIMITER = '/';

export const relativeUnitsFromLargestToSmallest: TimeUnitId[] = ['y', 'M', 'w', 'd', 'h', 'm', 's'];

const UNIT_TO_LUXON_PLURAL: Record<TimeUnitId, string> = {
    y: 'years',
    M: 'months',
    w: 'weeks',
    d: 'days',
    h: 'hours',
    m: 'minutes',
    s: 'seconds'
};

const UNIT_TO_LUXON_SINGULAR: Record<TimeUnitId, DateTimeUnit> = {
    y: 'year',
    M: 'month',
    w: 'week',
    d: 'day',
    h: 'hour',
    m: 'minute',
    s: 'second'
};

export const DATE_MODES = {
    ABSOLUTE: 'absolute',
    RELATIVE: 'relative',
    NOW: 'now'
} as const;

export const INVALID_DATE = 'invalid_date';

const RELATIVE_PATTERN = /^now(?:([-+])(\d+)([smhdwMy]))?(?:\/([smhdwMy]))?$/;

export function getDateMode(value: ShortDate): (typeof DATE_MODES)[keyof typeof DATE_MODES] {
    if (value === 'now') return DATE_MODES.NOW;
    if (value.includes('now')) return DATE_MODES.RELATIVE;
    return DATE_MODES.ABSOLUTE;
}

export function parse(
    value: ShortDate,
    opts: { roundUp?: boolean; now?: DateTime } = {}
): DateTime | null {
    const now = opts.now ?? DateTime.now();
    if (typeof value !== 'string') return null;

    if (value === 'now') return now;

    if (value.startsWith('now')) {
        const matches = value.match(RELATIVE_PATTERN);
        if (!matches) return null;

        const [, operator, countStr, unit, roundUnitLetter] = matches;
        let result = now;

        if (operator && countStr && unit) {
            const count = parseInt(countStr, 10);
            const luxonUnit = UNIT_TO_LUXON_PLURAL[unit as TimeUnitId];
            result =
                operator === '+'
                    ? result.plus({ [luxonUnit]: count })
                    : result.minus({ [luxonUnit]: count });
        }

        if (roundUnitLetter) {
            const luxonUnit = UNIT_TO_LUXON_SINGULAR[roundUnitLetter as TimeUnitId];
            result = opts.roundUp ? result.endOf(luxonUnit) : result.startOf(luxonUnit);
        }

        return result;
    }

    const parsed = DateTime.fromISO(value);
    return parsed.isValid ? parsed : null;
}

export function hasRangeChanged(
    range: Pick<DurationRange, 'start' | 'end'>,
    original: Pick<DurationRange, 'start' | 'end'>
): boolean {
    return range.start !== original.start || range.end !== original.end;
}

export function toMillisRange(
    start: ShortDate,
    end: ShortDate,
    opts: { now?: DateTime } = {}
): { startDateMs: number; endDateMs: number } | null {
    const startParsed = parse(start, { now: opts.now });
    const endParsed = parse(end, { now: opts.now, roundUp: true });
    if (!startParsed || !endParsed) return null;
    return { startDateMs: startParsed.toMillis(), endDateMs: endParsed.toMillis() };
}

export function parseRelativeParts(value: string, now: DateTime = DateTime.now()): RelativeParts {
    const matches = typeof value === 'string' ? value.match(RELATIVE_PATTERN) : null;
    const operator = matches?.[1];
    const count = matches?.[2];
    const unit = matches?.[3];
    const roundUnitLetter = matches?.[4];

    if (count && unit) {
        const isRounded = !!roundUnitLetter;
        return {
            count: parseInt(count, 10),
            unit: operator === '+' ? `${unit}+` : unit,
            round: isRounded,
            ...(isRounded ? { roundUnit: roundUnitLetter as TimeUnitId } : {})
        };
    }

    const results: RelativeParts = { count: 0, unit: 's', round: false };
    const parsedValue = parse(value, { now });
    if (!parsedValue) return results;

    const diffMs = now.diff(parsedValue).as('milliseconds');
    let unitOp = '';
    for (const unitId of relativeUnitsFromLargestToSmallest) {
        const asUnit = Duration.fromMillis(diffMs).as(UNIT_TO_LUXON_PLURAL[unitId] as never);
        if (asUnit < 0) unitOp = '+';
        if (Math.abs(asUnit) >= 1) {
            results.count = Math.round(Math.abs(asUnit));
            results.unit = unitId + unitOp;
            results.round = false;
            break;
        }
    }
    return results;
}

export function toRelativeStringFromParts(parts: RelativeParts): string {
    const { count, round: isRounded, roundUnit, unit: rawUnit } = parts;

    if (count === 0 && !isRounded) {
        return 'now';
    }

    const matches = rawUnit.match(/([smhdwMy])(\+)?/);
    const unit = matches ? matches[1] : 's';
    const operator = matches?.[2] ? matches[2] : '-';
    const round = isRounded ? `${ROUND_DELIMITER}${roundUnit ?? unit}` : '';

    return `now${operator}${count}${unit}${round}`;
}

export function isRelativeToNow(start: ShortDate, end: ShortDate): boolean {
    const startMode = getDateMode(start);
    const endMode = getDateMode(end);
    const isLast = startMode === DATE_MODES.RELATIVE && endMode === DATE_MODES.NOW;
    const isNext = startMode === DATE_MODES.NOW && endMode === DATE_MODES.RELATIVE;
    return isLast || isNext;
}

export function toAbsoluteString(value: ShortDate, roundUp = false): string {
    const parsed = parse(value, { roundUp });
    if (!parsed) return value;
    if (!parsed.isValid) return INVALID_DATE;
    return parsed.toISO() ?? INVALID_DATE;
}

export function toRelativeString(value: string, now: DateTime = DateTime.now()): string {
    return toRelativeStringFromParts(parseRelativeParts(value, now));
}

import { Duration } from 'luxon';
import type { Milliseconds, RefreshUnitsOptions } from './types.js';

const UNIT_TO_LUXON_PLURAL: Record<RefreshUnitsOptions, 'hours' | 'minutes' | 'seconds'> = {
    h: 'hours',
    m: 'minutes',
    s: 'seconds'
};

export interface RefreshIntervalValue {
    value: number;
    units: RefreshUnitsOptions;
}

export function fromMilliseconds(
    milliseconds: Milliseconds,
    unit?: RefreshUnitsOptions
): RefreshIntervalValue {
    const round = (value: number) => parseFloat(value.toFixed(2));
    const asUnit = (u: RefreshUnitsOptions) =>
        Duration.fromMillis(milliseconds).as(UNIT_TO_LUXON_PLURAL[u]);

    if (unit === 'h' || (!unit && asUnit('h') > 1)) {
        return { units: 'h', value: round(asUnit('h')) };
    }

    if (unit === 'm' || (!unit && asUnit('m') > 1)) {
        return { units: 'm', value: round(asUnit('m')) };
    }

    return { units: 's', value: round(asUnit('s')) };
}

export function toMilliseconds(units: RefreshUnitsOptions, value: number): Milliseconds {
    return Math.round(
        Duration.fromObject({ [UNIT_TO_LUXON_PLURAL[units]]: value }).as('milliseconds')
    );
}

export function getMinInterval(minInterval?: Milliseconds, unit?: RefreshUnitsOptions): number {
    if (!minInterval) return 0;
    const { value } = fromMilliseconds(minInterval, unit);
    return Math.ceil(value || 0);
}

export function clampToMinInterval(
    milliseconds: Milliseconds,
    minInterval?: Milliseconds
): Milliseconds {
    return Math.max(milliseconds, minInterval || 0);
}

export function resolveIsPaused(
    refreshIntervalMs: Milliseconds,
    requestedIsPaused: boolean
): boolean {
    return refreshIntervalMs <= 0 ? true : requestedIsPaused;
}

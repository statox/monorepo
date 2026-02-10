import { DateTime, Interval } from 'luxon';
import { getLunarState, getUpcomingLunarStates } from './moon.js';
import { getSolarState } from './sun.js';
import { RangeInvalid, RangeTooLargeError } from './errors.js';

const getEphemeridesForDay = (day: DateTime, includeUpcomingLunarStates: boolean) => {
    const dayJs = day.toJSDate();
    const moonState = getLunarState(dayJs);
    const sunState = getSolarState(dayJs);

    if (!includeUpcomingLunarStates) {
        return {
            moonState,
            sunState
        };
    }

    const upcomingLunarStates = getUpcomingLunarStates(dayJs);
    return {
        moonState,
        sunState,
        upcomingLunarStates
    };
};

export const getTodayEphemerides = () => {
    // Using Luxon to easily mock the date in tests
    return getEphemeridesForDay(DateTime.now(), true);
};

export const getRangeEphemerides = (params: { from: number; to: number }) => {
    const { from, to } = params;

    if (from > to) {
        throw new RangeInvalid();
    }

    const MAX_RANGE_DAYS = 360;
    if (to - from > MAX_RANGE_DAYS * 24 * 3600 * 1000) {
        throw new RangeTooLargeError();
    }

    const start = DateTime.fromMillis(from).set({ hour: 12, minute: 0 });
    const end = DateTime.fromMillis(to).set({ hour: 12, minute: 0 });

    const days = Interval.fromDateTimes(start, end)
        .splitBy({ days: 1 })
        .map((sub) => sub.start!.set({ hour: 12, minute: 0 }));

    const ephemerides = days.map((day) => {
        return { day: day.toMillis(), ephemeride: getEphemeridesForDay(day, false) };
    });

    return { ephemerides };
};

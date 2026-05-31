import { LunarPhase } from 'lunarphase-js';
import { getRangeEphemeridesAPI, getTodayEphemeridesAPI } from './api';
import { DateTime, Duration } from 'luxon';
import type { Ephemerides_GetRange_Output } from 'statox-api';
import type { MoonVisibilitySegment, YearlyEphemerisDay } from './types';

export const getMoonPhasePictureURL = (phase: LunarPhase) => {
    if (phase === LunarPhase.NEW) {
        return 'https://upload.wikimedia.org/wikipedia/commons/d/dd/New_Moon.jpg';
    }
    if (phase === LunarPhase.WAXING_CRESCENT) {
        return 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Waxing_Crescent_Moon_on_4-1-17_%2833627493622%29.jpg';
    }
    if (phase === LunarPhase.FIRST_QUARTER) {
        return 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Daniel_Hershman_-_march_moon_%28by%29.jpg';
    }
    if (phase === LunarPhase.WAXING_GIBBOUS) {
        return 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Lune-Nikon-600-F4_Luc_Viatour.jpg';
    }
    if (phase === LunarPhase.FULL) {
        return 'https://upload.wikimedia.org/wikipedia/commons/b/b5/20110319_Supermoon.jpg';
    }
    if (phase === LunarPhase.WANING_GIBBOUS) {
        return 'https://upload.wikimedia.org/wikipedia/commons/7/7d/2013-01-02_00-00-55-Waning-gibbous-moon.jpg';
    }
    if (phase === LunarPhase.LAST_QUARTER) {
        return 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Waning_gibbous_moon_near_last_quarter_-_23_Sept._2016.png';
    }
    if (phase === LunarPhase.WANING_CRESCENT) {
        return 'https://upload.wikimedia.org/wikipedia/commons/3/35/Waning_Crescent_Moon%287Sep15%29.jpg';
    }

    throw new Error('UNKOWN_LUNAR_PHASE');
};

export const getMoonPhaseIconURL = (phase: LunarPhase) => {
    if (phase === LunarPhase.NEW) {
        return 'moon_phase_icons/1_new_moon.png';
    }
    if (phase === LunarPhase.WAXING_CRESCENT) {
        return 'moon_phase_icons/2_waxing_crescent.png';
    }
    if (phase === LunarPhase.FIRST_QUARTER) {
        return 'moon_phase_icons/3_first_quarter.png';
    }
    if (phase === LunarPhase.WAXING_GIBBOUS) {
        return 'moon_phase_icons/4_waxing_gibbous.png';
    }
    if (phase === LunarPhase.FULL) {
        return 'moon_phase_icons/5_full_moon.png';
    }
    if (phase === LunarPhase.WANING_GIBBOUS) {
        return 'moon_phase_icons/6_waning_gibbous.png';
    }
    if (phase === LunarPhase.LAST_QUARTER) {
        return 'moon_phase_icons/7_last_quarter.png';
    }
    if (phase === LunarPhase.WANING_CRESCENT) {
        return 'moon_phase_icons/8_waning_crescent.png';
    }

    throw new Error('UNKOWN_LUNAR_PHASE');
};

export const getTodayEphemerides = async () => {
    const { ephemerides } = await getTodayEphemeridesAPI();
    const { moonState, sunState, upcomingLunarStates } = ephemerides;

    return {
        moonState,
        sunState: {
            goldenHour: DateTime.fromMillis(sunState.goldenHour),
            solarNoon: DateTime.fromMillis(sunState.solarNoon),
            sunrise: DateTime.fromMillis(sunState.sunrise),
            sunset: DateTime.fromMillis(sunState.sunset),
            dayLength: Duration.fromMillis(sunState.dayLengthMs),
            dayLengthDiff: Duration.fromMillis(sunState.dayLengthDiffMs)
        },
        upcomingLunarStates: upcomingLunarStates.map((entry) => {
            return {
                date: DateTime.fromMillis(entry.tsMillis),
                lunarState: {
                    ...entry.lunarState,
                    phasePictureUrl: getMoonPhasePictureURL(entry.lunarState.moonPhase)
                }
            };
        })
    };
};

const FRENCH_MONTHS = [
    '',
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Juin',
    'Juil',
    'Aoû',
    'Sep',
    'Oct',
    'Nov',
    'Déc'
];

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

const hhmmToPercent = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return ((h + m / 60) / 24) * 100;
};

const parseMoonVisibility = (window: string[]): MoonVisibilitySegment[] => {
    if (window.length !== 2) return [];
    const startPct = hhmmToPercent(window[0]);
    const endPct = hhmmToPercent(window[1]);

    if (startPct <= endPct) {
        return [{ startPercent: startPct, widthPercent: endPct - startPct }];
    }
    // Wraps around midnight: two segments
    return [
        { startPercent: startPct, widthPercent: 100 - startPct },
        { startPercent: 0, widthPercent: endPct }
    ];
};

const formatDiffMs = (ms: number): string => {
    const sign = ms >= 0 ? '+' : '-';
    const dur = Duration.fromMillis(Math.abs(ms));
    const mins = Math.floor(dur.as('minutes'));
    const secs = Math.floor(dur.as('seconds')) % 60;
    return `${sign}${mins}m${secs.toString().padStart(2, '0')}s`;
};

export const processYearlyEphemerides = (
    rawData: Ephemerides_GetRange_Output['ephemerides'],
    zone: string
): YearlyEphemerisDay[] => {
    const maxAbsDiff = rawData.reduce(
        (max, entry) => Math.max(max, Math.abs(entry.ephemeride.sunState.dayLengthDiffMs)),
        1
    );

    const now = DateTime.now();
    let prevMoonPhase: string | undefined;
    let prevMonth: number | undefined;

    const days: YearlyEphemerisDay[] = rawData.map((entry) => {
        const date = DateTime.fromMillis(entry.day, { zone: 'Europe/Paris' });
        const { sunState, moonState } = entry.ephemeride;

        const sunrise = DateTime.fromMillis(sunState.sunrise, { zone });
        const sunset = DateTime.fromMillis(sunState.sunset, { zone });
        const sunriseHours = sunrise.hour + sunrise.minute / 60;
        const sunsetHours = sunset.hour + sunset.minute / 60;

        const showMoonIcon = prevMoonPhase !== undefined && moonState.moonPhase !== prevMoonPhase;
        let moonIconURL = '';
        try {
            moonIconURL = getMoonPhaseIconURL(moonState.moonPhase as LunarPhase);
        } catch {
            // ignore unknown phases
        }
        prevMoonPhase = moonState.moonPhase;

        const currentMonth = date.month;
        const isFirstOfMonth = prevMonth !== undefined && currentMonth !== prevMonth;
        prevMonth = currentMonth;

        const dayLengthDur = Duration.fromMillis(sunState.dayLengthMs);
        const dayLengthH = Math.floor(dayLengthDur.as('hours'));
        const dayLengthM = Math.floor(dayLengthDur.as('minutes')) % 60;

        return {
            dateMs: entry.day,
            dateFormatted: date.toFormat('cccc dd MMMM yyyy', { locale: 'fr' }),
            sunrisePercent: (sunriseHours / 24) * 100,
            sunsetPercent: (sunsetHours / 24) * 100,
            sunriseFormatted: sunrise.toFormat('HH:mm'),
            sunsetFormatted: sunset.toFormat('HH:mm'),
            dayLengthFormatted: `${dayLengthH}h${dayLengthM.toString().padStart(2, '0')}`,
            dayLengthDiffNormalized: sunState.dayLengthDiffMs / maxAbsDiff,
            dayLengthDiffMs: sunState.dayLengthDiffMs,
            dayLengthDiffFormatted: formatDiffMs(sunState.dayLengthDiffMs),
            showMoonIcon,
            moonIconURL,
            moonPhaseFr: moonState.moonPhaseFr,
            moonVisibilitySegments: parseMoonVisibility(moonState.moonVisibilityWindow),
            moonriseFormatted: moonState.moonVisibilityWindow[0] ?? '',
            moonsetFormatted: moonState.moonVisibilityWindow[1] ?? '',
            isFirstOfMonth,
            monthLabel: isFirstOfMonth ? FRENCH_MONTHS[currentMonth] : '',
            isToday: date.hasSame(now, 'day'),
            solarEvent: null,
            lunarDistance: Number(moonState.lunarDistance.toFixed(2))
        };
    });

    // Detect solstices (dayLengthDiff crosses zero) and equinoxes (dayLength crosses 12h)
    for (let i = 1; i < days.length; i++) {
        const prev = rawData[i - 1].ephemeride.sunState;
        const curr = rawData[i].ephemeride.sunState;
        if (prev.dayLengthDiffMs > 0 && curr.dayLengthDiffMs <= 0) {
            days[i].solarEvent = "Solstice d'été";
        } else if (prev.dayLengthDiffMs < 0 && curr.dayLengthDiffMs >= 0) {
            days[i].solarEvent = "Solstice d'hiver";
        }
        if (prev.dayLengthMs < TWELVE_HOURS_MS && curr.dayLengthMs >= TWELVE_HOURS_MS) {
            days[i].solarEvent = 'Équinoxe de printemps';
        } else if (prev.dayLengthMs > TWELVE_HOURS_MS && curr.dayLengthMs <= TWELVE_HOURS_MS) {
            days[i].solarEvent = "Équinoxe d'automne";
        }
    }

    return days;
};

export const getYearlyEphemerides = async () => {
    const from = DateTime.now().toUTC().minus({ days: 150 }).toMillis();
    const to = DateTime.now().toUTC().plus({ days: 150 }).toMillis();
    const { ephemerides } = await getRangeEphemeridesAPI({ from, to });
    return ephemerides;
};

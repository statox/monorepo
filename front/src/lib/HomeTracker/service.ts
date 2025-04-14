import { LunarPhase } from 'lunarphase-js';
import { getEphemeridesAPI } from './api';
import { DateTime } from 'luxon';

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

export const getEphemerides = async () => {
    const ephemerides = await getEphemeridesAPI();
    const { moonState, sunState, upcomingLunarStates } = ephemerides;

    return {
        moonState,
        sunState: {
            goldenHour: DateTime.fromMillis(sunState.goldenHour),
            solarNoon: DateTime.fromMillis(sunState.solarNoon),
            sunrise: DateTime.fromMillis(sunState.sunrise),
            sunset: DateTime.fromMillis(sunState.sunset)
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

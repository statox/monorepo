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

export const getEphemerides = async () => {
    const data = await getEphemeridesAPI();

    return {
        lunarAge: data.lunarAge,
        lunarAgePercent: data.lunarAgePercent,
        moonPhase: data.moonPhase,
        moonPhaseFr: data.moonPhaseFr,
        moonVisibilityWindow: data.moonVisibilityWindow,
        goldenHour: DateTime.fromMillis(data.goldenHour),
        solarNoon: DateTime.fromMillis(data.solarNoon),
        sunrise: DateTime.fromMillis(data.sunrise),
        sunset: DateTime.fromMillis(data.sunset)
    };
};

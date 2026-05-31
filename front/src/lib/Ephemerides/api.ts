import { client2 } from '$lib/api';
import { LunarPhaseFrench } from './types';
import { LunarPhase } from 'lunarphase-js';

export const getTodayEphemeridesAPI = async () => {
    const res = await client2.ephemerides.getToday();

    const validLunarPhases = Object.values(LunarPhase);
    const validLunarPhasesFr = Object.values(LunarPhaseFrench);

    // The API client types the moonPhase as a string, let's ensure it's a valid LunarPhase
    const moonPhaseString = res.ephemerides.moonState.moonPhase;
    if (!validLunarPhases.includes(moonPhaseString as LunarPhase)) {
        throw new Error(
            `Invalid moon phase received: ${moonPhaseString}. Expected one of: ${validLunarPhases.join(', ')}`
        );
    }

    // Validate and type the moonPhase in upcomingLunarStates
    const upcomingLunarStates = res.ephemerides.upcomingLunarStates.map((state) => {
        const upcomingMoonPhase = state.lunarState.moonPhase;
        const upcomingMoonPhaseFr = state.lunarState.moonPhaseFr;
        if (!validLunarPhases.includes(upcomingMoonPhase as LunarPhase)) {
            throw new Error(
                `Invalid moon phase in upcoming lunar states: ${upcomingMoonPhase}. Expected one of: ${validLunarPhases.join(', ')}`
            );
        }
        if (!validLunarPhasesFr.includes(upcomingMoonPhaseFr as LunarPhaseFrench)) {
            throw new Error(
                `Invalid french moon phase in upcoming lunar states: ${upcomingMoonPhaseFr}. Expected one of: ${validLunarPhasesFr.join(', ')}`
            );
        }
        return {
            ...state,
            lunarState: {
                ...state.lunarState,
                moonPhase: upcomingMoonPhase as LunarPhase,
                moonPhaseFr: upcomingMoonPhaseFr as LunarPhaseFrench
            }
        };
    });

    return {
        ...res,
        ephemerides: {
            ...res.ephemerides,
            moonState: {
                ...res.ephemerides.moonState,
                moonPhase: moonPhaseString as LunarPhase
            },
            upcomingLunarStates
        }
    };
};

export const getRangeEphemeridesAPI = async (params: { from: number; to: number }) => {
    return client2.ephemerides.getRange(params);
};

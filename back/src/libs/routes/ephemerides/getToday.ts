import { FromSchema } from 'json-schema-to-ts';
import { EmptyInput, GetRoute } from '../types.js';
import { getTodayEphemerides } from '../../modules/ephemerides/index.js';

const handler = () => {
    const ephemerides = getTodayEphemerides();
    return { ephemerides };
};

const lunarStateSchema = {
    type: 'object',
    properties: {
        lunarAge: { type: 'number' },
        lunarAgePercent: { type: 'number' },
        lunarDistance: {
            type: 'number',
            description:
                'Distance to the moon measured in units of Earth radii, with perigee at 56 and apogee at 63.8'
        },
        moonPhase: { type: 'string' },
        moonPhaseFr: { type: 'string' },
        moonVisibilityWindow: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 2,
            minItems: 2
        }
    },
    required: [
        'lunarAge',
        'lunarAgePercent',
        'lunarDistance',
        'moonPhase',
        'moonPhaseFr',
        'moonVisibilityWindow'
    ],
    additionalProperties: false
} as const;

const outputSchema = {
    type: 'object',
    properties: {
        ephemerides: {
            type: 'object',
            properties: {
                moonState: lunarStateSchema,
                sunState: {
                    type: 'object',
                    properties: {
                        sunrise: { type: 'number' },
                        sunset: { type: 'number' },
                        solarNoon: { type: 'number' },
                        goldenHour: { type: 'number' },
                        dayLengthMs: {
                            type: 'number',
                            description: 'How many hours of sun this day (in ms)'
                        },
                        dayLengthDiffMs: {
                            type: 'number',
                            description:
                                'The difference of day length compared to yesterday (in ms)'
                        }
                    },
                    required: [
                        'dayLengthDiffMs',
                        'dayLengthMs',
                        'sunrise',
                        'sunset',
                        'solarNoon',
                        'goldenHour'
                    ],
                    additionalProperties: false
                },
                upcomingLunarStates: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            lunarState: lunarStateSchema,
                            tsMillis: {
                                type: 'number'
                            }
                        },
                        required: ['tsMillis', 'lunarState']
                    }
                }
            },
            required: ['moonState', 'sunState', 'upcomingLunarStates'],
            additionalProperties: false
        }
    },
    required: ['ephemerides'],
    additionalProperties: false
} as const;

export const route: GetRoute<EmptyInput, FromSchema<typeof outputSchema>> = {
    method: 'get',
    path: '/ephemerides/getToday',
    handler,
    authentication: 'none',
    outputSchema
};

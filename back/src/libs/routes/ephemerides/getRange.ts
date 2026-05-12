import { FromSchema } from 'json-schema-to-ts';
import { PostRoute, RouteHandler } from '../types.js';
import { getRangeEphemerides } from '../../modules/ephemerides/index.js';

const handler: RouteHandler<Input> = async (params) => {
    const { from, to } = params.input;
    return getRangeEphemerides({ from, to });
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

const inputSchema = {
    type: 'object',
    description: 'Get the ephemerides for a range of dates.',
    properties: {
        from: {
            type: 'number',
            description: 'The UTC timestamp in (in ms) of the first day of the range'
        },
        to: {
            type: 'number',
            description: 'The UTC timestamp in (in ms) of the last day of the range'
        }
    },
    additionalProperties: false,
    required: ['from', 'to']
} as const;

type Input = FromSchema<typeof inputSchema>;

const outputSchema = {
    type: 'object',
    properties: {
        ephemerides: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    day: {
                        type: 'number',
                        description: 'timestamp (ms) of the day'
                    },
                    ephemeride: {
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
                            }
                        },
                        required: ['moonState', 'sunState'],
                        additionalProperties: false
                    }
                },
                required: ['day', 'ephemeride'],
                additionalProperties: false
            }
        }
    },
    required: ['ephemerides'],
    additionalProperties: false
} as const;

export const route: PostRoute<FromSchema<typeof inputSchema>, FromSchema<typeof outputSchema>> = {
    method: 'post',
    path: '/ephemerides/getRange',
    handler,
    authentication: 'none',
    outputSchema,
    inputSchema,
    clientErrors: ['RANGE_TOO_LARGE', 'RANGE_IS_INVALID']
};

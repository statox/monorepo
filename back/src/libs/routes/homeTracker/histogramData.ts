import { FromSchema } from 'json-schema-to-ts';
import { PostRoute, RouteHandler } from '../types.js';
import { getHistogramData } from '../../modules/homeTracker/index.js';

const handler: RouteHandler<Input> = (params) => {
    params.loggableContext.addData('timewindowStartMs', params.input.timeWindow.startDateMs);
    params.loggableContext.addData('timewindowEndMs', params.input.timeWindow.endDateMs);
    return getHistogramData(params.input.timeWindow);
};

const inputSchema = {
    type: 'object',
    required: ['timeWindow'],
    additionalProperties: false,
    properties: {
        timeWindow: {
            type: 'object',
            required: ['startDateMs', 'endDateMs'],
            additionalProperties: false,
            properties: {
                startDateMs: { type: 'number' },
                endDateMs: { type: 'number' }
            }
        }
    }
} as const;

const outputSchema = {
    type: 'object',
    properties: {
        sensorNames: {
            type: 'array',
            items: { type: 'string' }
        },
        histogramData: {
            type: 'object',
            additionalProperties: {
                type: 'object',
                properties: {
                    tempCelsius: { type: 'object', additionalProperties: { type: 'number' } },
                    internalTempCelsius: {
                        type: 'object',
                        additionalProperties: { type: 'number' }
                    },
                    batteryCharge: { type: 'object', additionalProperties: { type: 'number' } },
                    humidity: { type: 'object', additionalProperties: { type: 'number' } },
                    internalHumidity: {
                        type: 'object',
                        additionalProperties: { type: 'number' }
                    },
                    pressurehPa: { type: 'object', additionalProperties: { type: 'number' } }
                },
                additionalProperties: false
            }
        }
    },
    required: ['sensorNames', 'histogramData'],
    additionalProperties: false
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, FromSchema<typeof outputSchema>> = {
    method: 'post',
    path: '/homeTracker/histogramData',
    inputSchema,
    scope: 'homeTracker',
    handler,
    authentication: 'user2',
    clientErrors: ['INVALID_TIME_WINDOW'],
    outputSchema
};

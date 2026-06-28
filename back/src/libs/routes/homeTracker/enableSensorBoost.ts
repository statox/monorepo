import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostRoute, RouteHandler } from '../types.js';
import { enableSensorBoost } from '../../modules/homeTracker/index.js';
import { emptyObjectSchema } from '../helpers.js';

const handler: RouteHandler<Input> = async (params) => {
    params.loggableContext.addData('sensorName', params.input.sensorName);
    params.loggableContext.addData('dataStr', JSON.stringify(params.input));

    await enableSensorBoost(params.input);
    return;
};

const inputSchema = {
    type: 'object',
    required: ['sensorName', 'sleepTimeSec', 'durationSec'],
    additionalProperties: false,
    properties: {
        sensorName: { type: 'string' },
        sleepTimeSec: { type: 'number', minimum: 1 },
        durationSec: { type: 'number', minimum: 1 }
    }
} as const;
type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/homeTracker/enableSensorBoost',
    inputSchema: inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['SENSOR_NOT_FOUND'],
    outputSchema: emptyObjectSchema
};

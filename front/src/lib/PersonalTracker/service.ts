import { ApiError } from '$lib/api';
import { toast } from '$lib/components/Toast';
import { createEvent, getAllEvents } from './api';
import { encryptData, decryptData, getRandomSalt, getUserKey } from '$lib/encryption';
import Ajv from 'ajv';
import type { FromSchema } from 'json-schema-to-ts';

// JSON Schema for PersonalTrackerData
export const personalTrackerDataSchema = {
    type: 'object',
    properties: {
        mood: {
            type: 'number',
            minimum: 0,
            maximum: 10
        },
        weight: {
            type: 'number',
            minimum: 0
        },
        emotionwheel: {
            type: 'object',
            properties: {
                emotions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            category: {
                                type: 'string'
                            },
                            subcategory: {
                                type: 'string'
                            },
                            emotion: {
                                type: 'string'
                            },
                            color: {
                                type: 'string'
                            }
                        },
                        required: ['category', 'subcategory', 'emotion', 'color'],
                        additionalProperties: false
                    }
                }
            },
            required: ['emotions'],
            additionalProperties: false
        },
        workplace: {
            type: 'string',
            enum: ['remote', 'on site']
        },
        energy: {
            type: 'number',
            minimum: 1,
            maximum: 10
        }
    },
    additionalProperties: false
} as const;

// Derive TypeScript type from schema
export type PersonalTrackerData = FromSchema<typeof personalTrackerDataSchema>;

// Setup AJV validator
const ajv = new Ajv();
const validateData = ajv.compile(personalTrackerDataSchema);

// Validation helper functions
function validatePersonalTrackerData(data: unknown): asserts data is PersonalTrackerData {
    if (!validateData(data)) {
        const errors = ajv.errorsText(validateData.errors);
        throw new Error(`Invalid PersonalTracker data: ${errors}`);
    }
}

export const encryptAndUpload = async (
    data: PersonalTrackerData,
    password: string,
    eventDateUnix: number
) => {
    // Validate data before encrypting
    try {
        validatePersonalTrackerData(data);
    } catch (error) {
        const message = `<strong>Validation Error</strong><br/> ${(error as Error).message}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
        throw error;
    }

    const saltB64 = getRandomSalt().saltB64;
    const { keyB64 } = getUserKey({ password, saltB64 });
    const { ciphertextB64, nonceB64 } = encryptData({ data: JSON.stringify(data), keyB64 });

    try {
        await createEvent({
            eventDateUnix,
            saltB64,
            nonceB64,
            ciphertextB64
        });
    } catch (error) {
        let errorMessage = (error as Error).message;
        if (error instanceof ApiError && error.code === 401) {
            errorMessage = 'Invalid logged in user';
        }
        const message = `<strong>Entry not created</strong><br/> ${errorMessage}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
    }
};

export type PersonalTrackerEvent = PersonalTrackerData & {
    eventDateUnix: number;
};

export const getAndDecryptEvents = async (password: string): Promise<PersonalTrackerEvent[]> => {
    const eventsCiphered = await getAllEvents();

    return eventsCiphered
        .map((cipher) => {
            try {
                const { keyB64 } = getUserKey({ password, saltB64: cipher.saltB64 });
                const { dataB64 } = decryptData({
                    ciphertextB64: cipher.ciphertextB64,
                    nonceB64: cipher.nonceB64,
                    keyB64
                });

                const decryptedData = JSON.parse(atob(dataB64));

                // Validate decrypted data
                validatePersonalTrackerData(decryptedData);

                const event: PersonalTrackerEvent = {
                    ...decryptedData,
                    eventDateUnix: cipher.eventDateUnix
                };

                return event;
            } catch (error) {
                console.log('Error parsing or validating decrypted event');
                console.log(error);
                return undefined;
            }
        })
        .filter((v): v is PersonalTrackerEvent => v !== undefined);
};

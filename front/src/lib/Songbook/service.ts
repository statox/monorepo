import Ajv from 'ajv';
import type { FromSchema } from 'json-schema-to-ts';
import { ApiError } from '$lib/api';
import { toast } from '$lib/components/Toast';
import { getChords, uploadChords } from '$lib/Songbook/api';

const chordSchema = {
    type: 'object',
    required: ['artist', 'title', 'url', 'creationDate', 'tags'],
    additionalProperties: false,
    properties: {
        artist: {
            type: 'string',
            minLength: 1
        },
        title: {
            type: 'string',
            minLength: 1
        },
        url: {
            type: 'string',
            minLength: 1
        },
        creationDate: {
            type: 'number'
        },
        tags: {
            type: 'array',
            items: {
                type: 'string'
            }
        }
    }
} as const;

// Derive TypeScript type from schema
export type ChordData = FromSchema<typeof chordSchema>;

// Setup AJV validator
const ajv = new Ajv();
const validateData = ajv.compile(chordSchema);

// Validation helper functions
function validateChordData(data: unknown): asserts data is ChordData {
    if (!validateData(data)) {
        const errors = ajv.errorsText(validateData.errors);
        throw new Error(`Invalid PersonalTracker data: ${errors}`);
    }
}

export const uploadNewChord = async (newChord: ChordData) => {
    try {
        validateChordData(newChord);
    } catch (error) {
        const message = `<strong>Validation Error</strong><br/> ${(error as Error).message}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
        throw error;
    }

    try {
        // Fetch existing chords and prepend the new one
        const chords = await getChords();
        const updatedChords = [newChord, ...chords];

        await uploadChords({ chords: updatedChords });
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

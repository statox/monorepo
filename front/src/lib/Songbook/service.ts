import Ajv from 'ajv';
import type { FromSchema } from 'json-schema-to-ts';
import { ApiError } from '$lib/api';
import { toast } from '$lib/components/Toast';
import { addChord } from '$lib/Songbook';
import type { Chords_AddEntry_Errors } from 'statox-api';

const chordSchema = {
    type: 'object',
    required: ['artist', 'title', 'url', 'tags'],
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
        throw new Error(`Invalid Songbook data: ${errors}`);
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
        await addChord(newChord);
    } catch (error) {
        let errorMessage = (error as Error).message;
        // TODO: The kind of guard for generic errors (e.g. INVALID_SCOPE) should be factorized in a common module
        if (error instanceof ApiError) {
            const e = error as ApiError<Chords_AddEntry_Errors>;
            if (e.code === 'ITEM_ALREADY_EXISTS') {
                errorMessage = 'A song with this URL already exists';
            } else if (e.code === 'UNAUTHORIZED') {
                errorMessage = 'Invalid logged in user';
            } else if (e.code === 'INVALID_SCOPE') {
                errorMessage = 'Invalid scope';
            } else if (e.code === 'FORBIDDEN_FOR_USER') {
                errorMessage = 'Forbidden for user';
            } else if (e.code === 'NETWORK_ERROR') {
                errorMessage = 'API unreachable';
            } else if (e.code === 'INTERNAL_SERVER_ERROR') {
                errorMessage = 'Server error';
            }
        }
        const message = `<strong>Entry not created</strong><br/> ${errorMessage}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
    }
};

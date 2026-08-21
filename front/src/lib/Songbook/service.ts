import Ajv from 'ajv';
import type { FromSchema } from 'json-schema-to-ts';
import { ApiError } from '$lib/api';
import { toast } from '$lib/components/Toast';
import { addChord, updateChord, deleteChord } from '$lib/Songbook';
import type {
    Chords_AddEntry_Errors,
    Chords_UpdateEntry_Errors,
    Chords_DeleteEntry_Errors
} from 'statox-api';

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

const describeApiError = (error: unknown): string => {
    let errorMessage = (error as Error).message;
    // TODO: The kind of guard for generic errors (e.g. INVALID_SCOPE) should be factorized in a common module
    if (error instanceof ApiError) {
        const e = error as ApiError<
            Chords_AddEntry_Errors | Chords_UpdateEntry_Errors | Chords_DeleteEntry_Errors
        >;
        if (e.code === 'ITEM_ALREADY_EXISTS') {
            errorMessage = 'A song with this URL already exists';
        } else if (e.code === 'ITEM_NOT_FOUND') {
            errorMessage = 'This song no longer exists';
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
        } else if (e.code === 'INPUT_VALIDATION_FAILED') {
            errorMessage = 'Invalid data sent to the server';
        }
    }
    return errorMessage;
};

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
        const message = `<strong>Entry not created</strong><br/> ${describeApiError(error)}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
    }
};

export const updateExistingChord = async (chord: ChordData & { id: number }) => {
    try {
        const { artist, title, url, tags } = chord;
        validateChordData({ artist, title, url, tags });
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
        await updateChord(chord);
    } catch (error) {
        const message = `<strong>Entry not updated</strong><br/> ${describeApiError(error)}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
        throw error;
    }
};

export const deleteExistingChord = async (id: number) => {
    try {
        await deleteChord({ id });
    } catch (error) {
        const message = `<strong>Entry not deleted</strong><br/> ${describeApiError(error)}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
        throw error;
    }
};

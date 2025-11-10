import { PUBLIC_API_URL } from '$env/static/public';

interface GetOptions {
    path: string;
}

export const requestAPIGet = async <ResponseType>(options: GetOptions): Promise<ResponseType> => {
    const { path } = options;

    if (!path.length || path[0] !== '/') {
        throw new Error('Malformed path');
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${PUBLIC_API_URL}${path}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include', // Includes the session cookie to work with passportjs
        headers
    });

    if (response.status < 200 || response.status >= 300) {
        let message: string;
        try {
            message = await response.text();
        } catch (error) {
            message = 'could not parse server error message';
        }
        throw new ApiError(response.status, message);
    }

    return response.json();
};

export class ApiError extends Error {
    code: number;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}

interface PostOptions {
    path: string;
    data: unknown;
}
export const requestAPIPost = async <ResponseType>(options: PostOptions): Promise<ResponseType> => {
    const { path, data } = options;

    if (!path.length || path[0] !== '/') {
        throw new Error('Malformed path');
    }

    const body = JSON.stringify(data);

    const response = await fetch(`${PUBLIC_API_URL}${path}`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include', // Includes the session cookie to work with passportjs
        headers: {
            'Content-Type': 'application/json'
        },
        body
    });

    if (response.status < 200 || response.status >= 300) {
        let message: string;
        try {
            message = await response.text();
        } catch (error) {
            message = 'could not parse server error message';
        }
        throw new ApiError(response.status, message);
    }

    return response.json();
};

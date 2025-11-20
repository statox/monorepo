/*
 * This error is not sent by the API anymore (after to migration from auth0 to passport)
 * Keeping it until we handle the auth errors properly
 */
export class UserLoggedOutError extends Error {
    constructor() {
        super('USER_LOGGED_OUT');
    }
}

export class UserLoggedOutError extends Error {
    constructor() {
        super('USER_LOGGED_OUT');
    }
}

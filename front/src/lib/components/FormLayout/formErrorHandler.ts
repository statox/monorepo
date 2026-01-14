import { toast } from '$lib/components/Toast';
import { ApiError } from '$lib/api';
import { UserLoggedOutError } from '$lib/auth';

export function handleFormError(error: unknown, action: string = 'created') {
    let errorMessage = (error as Error).message;

    if (error instanceof ApiError && error.code === 401) {
        errorMessage = 'Invalid logged in user';
    } else if (error instanceof UserLoggedOutError) {
        errorMessage = 'User is logged out';
    }

    const message = `<strong>Entry not ${action}</strong><br/> ${errorMessage}`;
    toast.push(message, {
        duration: 0,
        theme: {
            '--toastBarBackground': '#FF0000'
        }
    });
}

export function showSuccessToast(message: string) {
    toast.push(`<i class="fas fa-check"></i> ${message}`);
}

import { toast } from '$lib/components/Toast';

export const copyToClipboard = (content: string) => {
    try {
        navigator.clipboard.writeText(content);

        toast.push('<i class="fas fa-check"></i> Copied to clipboard', {
            duration: 1000,
            theme: {
                '--toastBarHeight': 0
            }
        });
    } catch (error) {
        console.log(error);

        toast.push('Couldnt copy to clipboard', {
            duration: 4000,
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
    }
};

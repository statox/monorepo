<script lang="ts">
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import { toast } from '$lib/components/Toast';
    import { Notice, type NoticeItem } from '$lib/components/Notice';
    import { createEvent } from '$lib/PersonalTracker/api';
    import { DateTime } from 'luxon';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    let value: number = $state(100);

    const upload = async () => {
        noticeMessages = [];
        if (value !== Number(value.toFixed(1))) {
            noticeMessages.push({
                level: 'error',
                header: 'Value have at most 1 number after the comma'
            });
        }
        if (value < 80 || value > 110) {
            noticeMessages.push({ level: 'error', header: 'Value must be in kg' });
        }

        if (noticeMessages.length) {
            return;
        }

        const timestampUTC = DateTime.now().toUTC().toUnixInteger();
        try {
            await createEvent({
                event: {
                    timestampUTC,
                    type: 'weight',
                    value: Math.floor(value * 100)
                }
            });
            onUpload();
        } catch (error) {
            let errorMessage = (error as Error).message;
            if (error instanceof ApiError && error.code === 401) {
                errorMessage = 'Invalid logged in user';
            } else if (error instanceof UserLoggedOutError) {
                errorMessage = 'User is logged out';
            }
            const message = `<strong>Entry not created</strong><br/> ${errorMessage}`;
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };
</script>

<div>
    <h4>Weight</h4>

    {#each noticeMessages as item}
        <Notice {item} />
    {/each}

    <div class="input-container">
        <button onclick={() => (value = Number((value - 0.1).toFixed(2)))}>-</button>
        <input type="number" step="0.1" bind:value />
        <button onclick={() => (value = Number((value + 0.1).toFixed(2)))}>+</button>
    </div>
    <button class="form-action" onclick={upload}>Submit</button>
</div>

<style>
    .input-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        gap: 10px;

        margin: 1em;

        button {
            font-weight: bolder;
        }

        input {
            /* Disable built-in arrows Firefox */
            -moz-appearance: textfield;
            appearance: textfield;

            font-size: larger;
        }

        /* Disable built-in arrows Chrome, Safari, Edge */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
            display: none;
            -webkit-appearance: none;
            margin: 0;
        }
    }
</style>

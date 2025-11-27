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

    let value: number = $state(5);

    const upload = async () => {
        const timestampUTC = DateTime.now().toUTC().toUnixInteger();
        try {
            await createEvent({
                event: {
                    timestampUTC,
                    type: 'mood',
                    value
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
    <h3>Mood</h3>

    {#each noticeMessages as item}
        <Notice {item} />
    {/each}

    <div class="options-container">
        {#each [1, 2, 3, 4, 5, 6, 7, 9, 10] as mood}
            <button class:selected={value === mood} onclick={() => (value = mood)}>{mood}</button>
        {/each}
    </div>

    <button class="form-action" onclick={upload}>Submit</button>
</div>

<style>
    .options-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        gap: 10px;

        margin: 1em;
    }
</style>

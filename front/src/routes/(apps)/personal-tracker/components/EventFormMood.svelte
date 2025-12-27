<script lang="ts">
    import { toast } from '$lib/components/Toast';
    import { Notice, type NoticeItem } from '$lib/components/Notice';
    import { encryptAndUpload, type PersonalTrackerData } from '$lib/PersonalTracker/service';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    let value: number = $state(5);

    const upload = async () => {
        const data: PersonalTrackerData = { type: 'mood', data: value };

        try {
            await encryptAndUpload(data, 'Correct Horse Battery Staple');
            onUpload();
        } catch (error) {
            let errorMessage = (error as Error).message;
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
    <h4>Mood</h4>

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

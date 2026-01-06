<script lang="ts">
    import { goto } from '$app/navigation';
    import { AuthGuard } from '$lib/components/AuthGuard';
    import { toast } from '$lib/components/Toast';
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import type { RawChord } from '$lib/Songbook/types';
    import { uploadNewChord } from '$lib/Songbook/service';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();

    let title: string = $state('');
    let artist: string = $state('');
    let url: string = $state('');
    let tagsStr: string = $state('');

    const submit = async () => {
        console.log('In submit');
        const tags = [];
        if (tagsStr) {
            tags.push(...tagsStr.replaceAll(' ', '').split(','));
        }

        const now = Date.now();
        const newChord: RawChord = { title, artist, url, tags, creationDate: now };
        console.log({ newChord });

        try {
            await uploadNewChord(newChord);
            toast.push('<i class="fas fa-check"></i> Song added successfully');
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
                duration: 0,
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };
</script>

<div class="page-content">
    <h2 class="title-bar">
        Add a new song
        <button onclick={() => goto('/songbook/edit')}>Back</button>
    </h2>

    <AuthGuard message="Login to add a new song" requiredScope="admin">
        <form class="form-content">
            <label for="artist">Artist</label>
            <input type="text" bind:value={artist} />

            <label for="title">Title</label>
            <input type="text" bind:value={title} />

            <label for="url">Url</label>
            <input type="text" bind:value={url} />

            <label for="tags">Tags</label>
            <input type="text" bind:value={tagsStr} />

            <button class="form-action" onclick={submit}>Submit</button>
        </form>
    </AuthGuard>
</div>

<style>
    .form-action {
        grid-column: span 2;
    }

    .form-content {
        display: grid;
        grid-template-columns: auto auto;
    }

    .page-content {
        max-width: 900px;
    }

    .title-bar {
        margin-bottom: 1em;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
</style>

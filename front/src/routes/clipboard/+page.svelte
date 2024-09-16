<script lang="ts">
    import { openModal } from '$lib/components/Modal';
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getAllClipboard, getPublicClipboard } from '$lib/Clipboard/api';
    import ClipboardView from './components/ClipboardView.svelte';
    import ClipboardForm from './components/ClipboardForm.svelte';
    import { pageNameStore } from '$lib/components/Header';

    pageNameStore.set('Clipboard');

    const getClipboard = () => {
        if ($user) {
            return getAllClipboard();
        }
        return getPublicClipboard();
    };
    let clipboardApi = getClipboard();

    const fetchClipboard = () => (clipboardApi = getClipboard());
</script>

<HeadIOS title="Clipboard" description="My universal clipboard app" />

<h2>Upload</h2>
{#if $user}
    <button on:click={() => openModal(ClipboardForm, { onUpload: fetchClipboard })}>
        Add an entry
    </button>
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry' }} />
{/if}

<h2>Content</h2>
{#await clipboardApi}
    <p>Loading data</p>
{:then clipboard}
    <ClipboardView {clipboard} on:delete={fetchClipboard} />
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}

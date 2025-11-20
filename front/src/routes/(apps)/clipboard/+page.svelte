<script lang="ts">
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getAllClipboard, getPublicClipboard } from '$lib/Clipboard/api';
    import ClipboardView from './components/ClipboardView.svelte';
    import { pageNameStore } from '$lib/components/Header';
    import { goto } from '$app/navigation';

    pageNameStore.set('Clipboard');

    const getClipboard = () => {
        if ($user) {
            return getAllClipboard();
        }
        return getPublicClipboard();
    };
    let clipboardApi = $state(getClipboard());

    const fetchClipboard = () => (clipboardApi = getClipboard());
</script>

<HeadIOS title="Clipboard" description="My universal clipboard app" iconPath="/clipboard.png" />

<h2>Upload</h2>
{#if $user}
    <button onclick={() => goto('clipboard/create')}>Add an entry</button>
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

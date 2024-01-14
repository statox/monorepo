<script lang="ts">
    import { user } from '$lib/auth/service';
    import { getAllClipboard, getPublicClipboard } from '$lib/Clipboard/api';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import ClipboardView from './components/ClipboardView.svelte';
    import ClipboardForm from './components/ClipboardForm.svelte';

    const getClipboard = () => {
        if ($user) {
            return getAllClipboard();
        }
        return getPublicClipboard();
    };
    let clipboardApi = getClipboard();
</script>

<HeadIOS title="Clipboard" description="My universal clipboard app" />

<h2>Clipboard</h2>

<h3>Upload</h3>
<ClipboardForm on:upload={() => (clipboardApi = getClipboard())} />

<h3>Content</h3>
{#await clipboardApi}
    <p>Loading data</p>
{:then clipboard}
    <ClipboardView {clipboard} on:delete={() => (clipboardApi = getClipboard())} />
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}

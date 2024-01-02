<script lang="ts">
    import { user } from '$lib/auth/service';
    import { getAllClipboard, getPublicClipboard } from '$lib/Clipboard/api';
    import ClipboardPrivateView from './components/ClipboardPrivateView.svelte';
    import ClipboardPublicView from './components/ClipboardPublicView.svelte';
    import ClipboardForm from './components/ClipboardForm.svelte';

    const getClipboard = () => {
        if ($user) {
            return getAllClipboard();
        }
        return getPublicClipboard();
    };
    let clipboardApi = getClipboard();
</script>

<svelte:head>
    <title>Clipboard</title>
    <meta name="description" content="Description of my page">
    <!-- Icon used when saving the page as an app on iOS -->
    <link rel="apple-touch-icon" href="/favicon.png">
    <!-- Title used when saving the page as an app on iOS -->
    <meta name="apple-mobile-web-app-title" content="Clipboard">
    <!-- Hide the Safari UI and status bar when saving the page as an app on iOS -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
</svelte:head>

<h2>Clipboard</h2>

<h3>Upload</h3>
<ClipboardForm on:upload={() => (clipboardApi = getClipboard())} />

<h3>Content</h3>
{#await clipboardApi}
    <p>Loading data</p>
{:then clipboard}
    {#if $user}
        <ClipboardPrivateView {clipboard} on:delete={() => (clipboardApi = getClipboard())} />
    {:else}
        <ClipboardPublicView {clipboard} />
    {/if}
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}

<script lang="ts">
    import { modals } from 'svelte-modals';
    import { AuthGuard } from '$lib/components/AuthGuard';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getReactionsForPublic } from '$lib/Reactor/api';
    import ReactorView from './components/ReactorView.svelte';
    import ReactorForm from './components/ReactorForm.svelte';
    import { pageMetadataStore } from '$lib/components/Header';

    const pageMetadata = {
        name: 'Reactor',
        description: 'My collection of memes',
        showAuthInHeader: true
    } as const;
    pageMetadataStore.set(pageMetadata);

    let reactionsApi = $state(getReactionsForPublic());

    const onUpload = () => (reactionsApi = getReactionsForPublic());
</script>

<HeadIOS title={pageMetadata.name} description={pageMetadata.description} />

<h2>Upload</h2>
<AuthGuard message="Login to add an entry" requiredScope="admin">
    <button onclick={() => modals.open(ReactorForm, { onUpload })}> Add an entry </button>
</AuthGuard>

<h2>Content</h2>
{#await reactionsApi}
    <p>Loading data</p>
{:then reactions}
    <ReactorView {reactions} />
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}

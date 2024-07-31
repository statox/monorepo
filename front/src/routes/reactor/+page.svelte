<script lang="ts">
    import { openModal } from '$lib/components/Modal';
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getReactionsForPublic } from '$lib/Reactor/api';
    import ReactorView from './components/ReactorView.svelte';
    import ReactorForm from './components/ReactorForm.svelte';

    let reactionsApi = getReactionsForPublic();

    const onUpload = () => (reactionsApi = getReactionsForPublic());
</script>

<HeadIOS title="Reactor" description="My collection of memes" />

<h2>Reactor</h2>

<h3>Upload</h3>
{#if $user}
    <button on:click={() => openModal(ReactorForm, { onUpload })}> Add an entry </button>
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry' }} />
{/if}

<h3>Content</h3>
{#await reactionsApi}
    <p>Loading data</p>
{:then reactions}
    <ReactorView {reactions} />
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}

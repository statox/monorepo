<script lang="ts">
    import { getReactionsForPublic } from '$lib/Reactor/api';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import ReactorView from './components/ReactorView.svelte';
    import ReactorForm from './components/ReactorForm.svelte';

    let reactionsApi = getReactionsForPublic();
</script>

<HeadIOS title="Reactor" description="My collection of memes" />

<h2>Reactor</h2>

<h3>Upload</h3>
<ReactorForm on:upload={() => (reactionsApi = getReactionsForPublic())} />

<h3>Content</h3>
{#await reactionsApi}
    <p>Loading data</p>
{:then reactions}
    <ReactorView {reactions} />
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}

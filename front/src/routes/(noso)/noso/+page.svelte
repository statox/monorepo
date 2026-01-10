<script lang="ts">
    import { modals } from 'svelte-modals';
    import Info from './components/Info.svelte';

    let now = $state();
    setInterval(() => (now = Math.floor(Date.now() / 1000)));
</script>

<div>Now {now}</div>

<button onclick={() => modals.open(Info)}> Test modal </button>

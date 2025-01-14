<script lang="ts">
    import { copyToClipboard } from './clipboard';

    export let content: string;
</script>

<button aria-label="copy" class="copy-button" on:click={() => copyToClipboard(content)}>
    <i class="fas fa-copy"></i>
</button>

<style>
    .copy-button {
        font-size: 0.8em;
    }
</style>

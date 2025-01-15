<script lang="ts">
    import { copyToClipboard } from './clipboard';

    interface Props {
        content: string;
    }

    let { content }: Props = $props();
</script>

<button aria-label="copy" class="copy-button" onclick={() => copyToClipboard(content)}>
    <i class="fas fa-copy"></i>
</button>

<style>
    .copy-button {
        font-size: 0.8em;
    }
</style>

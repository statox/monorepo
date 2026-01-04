<script lang="ts">
    import type { NoticeItem } from './types';
    interface Props {
        item: NoticeItem;
    }

    let { item }: Props = $props();
</script>

<div class={'container ' + item.level}>
    <div class="header">{item.header}</div>
    {#if item.message}
        <div class="message">{item.message}</div>
    {/if}
</div>

<style>
    .container {
        padding: 1em;
        margin-bottom: 0.5em;
        border-radius: 5px;
        border-left: 4px solid;
        background-color: var(--nc-bg-2);
    }

    .container.error {
        border-left-color: var(--nc-error);
    }

    .container.info {
        border-left-color: var(--nc-info);
    }

    .container.success {
        border-left-color: var(--nc-ac-1);
    }

    .header {
        color: var(--nc-tx-2);
        font-weight: bold;
    }

    .message {
        color: var(--nc-tx-2);
        margin-top: 0.25em;
    }
</style>

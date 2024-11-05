<script lang="ts">
    import type { NoticeItem } from './types';
    export let item: NoticeItem;
</script>

<div class={'container ' + item.level}>
    <div class="header">{item.header}</div>
    {#if item.message}
        <div class="message">{item.message}</div>
    {/if}
</div>

<style>
    .container {
        padding-top: 0.3em;
        padding-bottom: 0.3em;
        padding-left: 1em;

        margin-bottom: 0.3em;

        border-radius: 5px;

        border: 1px solid var(--nc-tx-1);
    }
    .container.error {
        background-color: var(--nc-error);
    }
    .container.info {
        background-color: var(--nc-info);
    }
    .container.success {
        background-color: var(--nc-success);
    }

    .header {
        color: var(--nc-white);
        font-weight: bolder;
    }

    .message {
        color: var(--nc-white);
    }
</style>

<script lang="ts">
    import type { NoticeItem } from './types';
    export let item: NoticeItem;
</script>

<div class="container" class:info={item.level === 'info'} class:error={item.level === 'error'}>
    <div class="header">{item.header}</div>
    {#if item.message}
        <div class="message">{item.message}</div>
    {/if}
</div>

<style>
    .container.error {
        background-color: #ab0000;
    }
    .container.info {
        background-color: #528aff;
    }

    .header {
        color: #ffffff;
        font-weight: bolder;
    }

    .message {
        color: #ffffff;
    }
</style>

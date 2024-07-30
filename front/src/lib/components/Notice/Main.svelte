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
    }
    .container.error {
        background-color: #ab0000;
    }
    .container.info {
        background-color: #528aff;
    }
    .container.success {
        background-color: #4e8759;
    }

    .header {
        color: #ffffff;
        font-weight: bolder;
    }

    .message {
        color: #ffffff;
    }
</style>

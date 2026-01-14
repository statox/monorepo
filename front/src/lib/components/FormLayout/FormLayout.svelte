<script lang="ts">
    import { goto } from '$app/navigation';
    import { AuthGuard } from '$lib/components/AuthGuard';
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    interface Props {
        title: string;
        backUrl: string;
        authMessage?: string;
        noticeMessages?: NoticeItem[];
        children: import('svelte').Snippet;
    }

    let {
        title,
        backUrl,
        authMessage = 'Login to add an entry',
        noticeMessages = [],
        children
    }: Props = $props();
</script>

<div class="form-layout">
    <h2 class="title-bar">
        {title}
        <button onclick={() => goto(backUrl)}>Back</button>
    </h2>

    <AuthGuard message={authMessage} requiredScope="admin">
        {#each noticeMessages as item}
            <Notice {item} />
        {/each}

        {@render children()}
    </AuthGuard>
</div>

<style>
    .form-layout {
        min-width: 240px;
        padding: 16px;
        background: var(--nc-bg-1);
        border-radius: 26px;
        max-height: 90%;
        overflow: auto;
    }

    .title-bar {
        margin-bottom: 1em;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
</style>

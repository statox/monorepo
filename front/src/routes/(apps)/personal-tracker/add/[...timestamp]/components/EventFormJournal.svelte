<script lang="ts">
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    interface Props {
        value?: string;
    }

    let { value = $bindable('') }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    // Character count for user feedback
    const characterCount = $derived(value.length);
</script>

<div class="journal-form">
    {#each noticeMessages as item}
        <Notice {item} />
    {/each}

    <div class="journal-container">
        <textarea
            bind:value
            class="journal-textarea"
            placeholder="Write your thoughts, notes, or reflections for today..."
            rows="8"
        ></textarea>

        <div class="character-count">
            {characterCount} character{characterCount !== 1 ? 's' : ''}
        </div>
    </div>
</div>

<style>
    .journal-form {
        display: flex;
        flex-direction: column;
        gap: 1em;
    }

    .journal-container {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
    }

    .journal-textarea {
        width: 100%;
        padding: 1em;
        border-radius: 8px;
        border: 2px solid var(--nc-bg-3);
        background-color: var(--nc-bg-1);
        color: var(--nc-tx-1);
        font-family: inherit;
        font-size: 1em;
        line-height: 1.5;
        resize: vertical;
        min-height: 150px;
        transition: border-color 0.2s ease;
    }

    .journal-textarea:focus {
        outline: none;
        border-color: var(--nc-ac-1);
    }

    .journal-textarea::placeholder {
        color: var(--nc-tx-2);
        opacity: 0.6;
    }

    .character-count {
        text-align: right;
        font-size: 0.85em;
        opacity: 0.7;
        padding-right: 0.5em;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
        .journal-textarea {
            font-size: 0.95em;
            padding: 0.75em;
        }
    }

    @media (max-width: 480px) {
        .journal-textarea {
            font-size: 0.9em;
            min-height: 120px;
        }
    }
</style>

<script lang="ts">
    import { Markdown } from '$lib/components/Markdown';
    import type { Note } from '$lib/Notes';
    interface Props {
        note: Note;
    }

    let { note }: Props = $props();

    const formattedTags = note.tags.map((t) => `[${t}]`).join('');
</script>

<details>
    <summary>
        <span class="title">{note.title}</span>
        <span class="formatted-tags">{formattedTags}</span>
    </summary>

    <Markdown source={note.source} />
</details>

<style>
    .title {
        color: var(--nc-lk-1);
    }
    .formatted-tags {
        font-family: var(--nc-font-mono);
        /* Graying out https://stackoverflow.com/a/5081723/4194289 */
        opacity: 0.6;
    }
</style>

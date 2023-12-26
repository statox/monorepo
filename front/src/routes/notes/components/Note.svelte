<script lang="ts">
    import '$lib/styles/new_theme.css';
    import Mardkown from '$lib/components/Markdown/Main.svelte';
    import type { Note } from '$lib/Notes/types';
    export let note: Note;

    const formattedTags = note.tags.map((t) => `[${t}]`).join('');
</script>

<details>
    <summary>
        <span class="title">{note.title}</span>
        <span class="formatted-tags">{formattedTags}</span>
    </summary>

    <Mardkown source={note.source} />
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

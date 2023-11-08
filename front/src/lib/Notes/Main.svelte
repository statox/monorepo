<script lang="ts">
    import NoteComponent from './Note.svelte';
    import type { Note } from './types';

    const notesModules = import.meta.glob("./data/*.md");

    const extractDataFromSource = (source: string) => {
        const titleMatch = source.match(/\[title]: # '(.*)'\n/);
        const tagsStrMatch = source.match(/\[tags]: # '(.*)'\n/);
        if (!titleMatch || !tagsStrMatch) {
            throw new Error('Invalid note metadata');
        }
        const title = titleMatch[1];
        const tagsStr = tagsStrMatch[1];
        const tags = JSON.parse(tagsStr);

        return { source, title, tags};
    }

    let notes: Note[] = [];
    for (const notePath in notesModules) {
        notesModules[notePath]().then((noteModule) => {
            const module = noteModule as { default: string };
            if (!module?.default || typeof module?.default !== 'string') {
                throw new Error('Invalid note content');
            };
            const noteSource = module.default;
            const data = extractDataFromSource(noteSource);
            notes = [...notes, data];
        });
    }
</script>
<h2>Notes</h2>

{#each notes as note}
    <NoteComponent {note} />
{/each}

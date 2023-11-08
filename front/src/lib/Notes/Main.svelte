<script lang="ts">
    import NoteComponent from './Note.svelte';
    import type { Note } from './types';

    const notesModules = import.meta.glob("./data/*.md");
    let searchStr: string;

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

    const filterIn = (note: Note, searchStr: string) => {
        const search = searchStr?.toLowerCase().trim() || '';
        if (!searchStr || searchStr.length === 0) {
            return true;
        }
        if (note.title.toLowerCase().includes(search)) {
            return true;
        }
        for (const tag of note.tags) {
            if (tag.toLowerCase().includes(search)) {
                return true;
            }
        }
        return false;
    }
</script>

<h2>Stuff I forget</h2>
<div>
    Search by tag: <input type="text" bind:value={searchStr}>
</div>

{#each notes as note}
    {#if filterIn(note, searchStr) }
    <NoteComponent {note} />
    {/if}
{/each}

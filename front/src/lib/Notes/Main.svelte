<script lang="ts">
    import NoteComponent from './Note.svelte';
    import type { Note } from './types';

    const notesModules = import.meta.glob("./data/*.md");
    let searchStr: string;
    let notes: Note[] = [];

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

    // Import all the markdowns, extract title and tags and add to array used for display
    const moduleResolutions = Object.keys(notesModules).map(( notePath ) => notesModules[notePath]());
    Promise.all(moduleResolutions).then(modules => {
        notes = modules.map(noteModule => {
            const module = noteModule as { default: string };
            if (!module?.default || typeof module?.default !== 'string') {
                throw new Error('Invalid note content');
            };
            const noteSource = module.default;
            return extractDataFromSource(noteSource);
        }).sort((a, b) => a.title < b.title ? -1 : 1);
    });

    const noteMatchesSearch = (note: Note, searchStr: string) => {
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
<!-- Use a css class instead of an #if directive to avoid mounting all of the components when the search is changed -->
<div class:hidden={!noteMatchesSearch(note, searchStr)} >
    <NoteComponent {note} />
</div>
{/each}

<style>
    .hidden {
        display: none;
    }
</style>

<script lang="ts">
    import Note from './Note.svelte';
    import ansibleNote from './data/ansible.md';

    const extractDataFromSource = (source: string) => {
        const title = source.match(/\[title]: # \((.*)\)\n/)[1];
        const tagsStr = source.match(/\[tags]: # \((.*)\)\n/)[1];
        const tags = JSON.parse(tagsStr);

        console.log({title, tags});
    }

    extractDataFromSource(ansibleNote);
</script>
<h2>Notes</h2>

<Note source={ansibleNote} />

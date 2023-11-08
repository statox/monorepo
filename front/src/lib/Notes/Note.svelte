<script lang="ts">
    import Mardkown from '$lib/components/Markdown/Main.svelte';
    import { onMount } from 'svelte';

    export let source: string;
    let noteData = {
        title: '',
        tags: []
    }

    const extractDataFromSource = (source: string) => {
        const title = source.match(/\[title]: # \((.*)\)\n/)[1];
        const tagsStr = source.match(/\[tags]: # \((.*)\)\n/)[1];
        const tags = JSON.parse(tagsStr);

        noteData.title = title;
        noteData.tags = tags;
    }

    onMount(() => {
        extractDataFromSource(source);
    });
</script>


<details>
    <summary>
        <a>{ noteData.title }</a>
        <span class="formatted-tag">{ noteData.tags }</span>
    </summary>

    <Mardkown {source} />
</details>

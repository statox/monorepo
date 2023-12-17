<script lang="ts">
    import { PUBLIC_API_URL } from '$env/static/public';
    import type { Chord } from '../types';
    export let chord: Chord;
    export let showArtist = false;

    const text = (showArtist ? chord.artist + ' - ' : '') + chord.title;

    const getIconClass = (chord: Chord) => {
        const url = chord.url;
        if (url.includes('.doc')) {
            return 'fas fa-xs fa-file-word';
        }
        if (url.includes('.pdf')) {
            return 'fas fa-xs fa-file-pdf';
        }
        if (url.includes('youtube')) {
            return 'fa fa-xs fa-youtube';
        }
        return 'fas fa-xs fa-link';
    };
    let iconClass = getIconClass(chord);

    const addVisit = () => {
        const visitUrl = PUBLIC_API_URL + '/addChordLinkVisit';
        const data = { url: chord.url };
        fetch(visitUrl, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        });
    };
</script>

<span class={iconClass}></span>
<span>
    <a href={chord.url} target="_blank" rel="noopener noreferrer" on:click={addVisit}>{text}</a>
</span>

<style>
    .fa-file-word {
        color: #1d5af4;
    }

    .fa-file-pdf {
        color: #e82236;
    }

    .fa-link {
        color: #727171;
    }
</style>

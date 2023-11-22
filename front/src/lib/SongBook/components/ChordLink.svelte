<script lang="ts">
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
        return 'fas fa-xs fa-link'
    }
    let iconClass=getIconClass(chord);
</script>

<span class={iconClass}></span>
<span>
    <a href={chord.url} target="_blank" rel="noopener noreferrer">{text}</a>
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

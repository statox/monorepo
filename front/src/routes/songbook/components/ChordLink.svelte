<script lang="ts">
    import { base } from '$app/paths';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { visitCountsStore } from '../store';
    import { get } from 'svelte/store';
    import { toast } from '$lib/components/Toast';
    import { getAccessToken } from '$lib/auth/service';
    import { getTypeIconClass } from '../utils';
    import type { Chord } from '$lib/Songbook/types';
    import { uploadLinkVisit } from '$lib/Songbook/api';
    export let chord: Chord;
    export let showArtist = false;

    let toolTipContent: string;
    visitCountsStore.subscribe((visitCountsMap) => {
        if (!visitCountsMap) {
            return;
        }
        if (visitCountsMap.has(chord.url)) {
            const data = visitCountsMap.get(chord.url)!;
            const lastVisit = new Date(data.lastAccessDateUnix * 1000);
            toolTipContent = `visits: ${data.count} - last: ${lastVisit.toLocaleDateString()}`;
        }
    });

    const text = (showArtist ? chord.artist + ' - ' : '') + chord.title;

    const formatLink = (chord: Chord) => {
        if (chord.type === 'doc') {
            return `${base}/docviewer/${chord.url}`;
        }

        return chord.url;
    };

    const addVisit = async () => {
        try {
            debugger; // AFA
            console.log('about to add visit');
            await uploadLinkVisit(chord.url);
            console.log('added visit');

            // Once we made the call and it succeeded update the store
            // to reflect the change without having to call the API again
            const map = get(visitCountsStore);
            console.log('pouet 1');
            const data = map.get(chord.url) || { count: 0, lastAccessDateUnix: 0 };
            console.log('pouet 2');
            data.count++;
            console.log('pouet 3');
            data.lastAccessDateUnix = Date.now() / 1000;
            console.log('pouet 4');
            map.set(chord.url, data);
            console.log('pouet 5');
            visitCountsStore.set(map);
            console.log('pouet 6');
        } catch (error) {
            console.log('got an error');
            console.log(error);
            const message = `<strong>Visit not counted</strong><br/> ${(error as Error).message}`;
            toast.push(message, {
                // Don't automatically dismiss to see the error when coming back
                initial: 0,
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };
</script>

<span class={getTypeIconClass(chord.type)}></span>
<span>
    <a
        href={formatLink(chord)}
        target="_blank"
        rel="noopener noreferrer"
        title={toolTipContent}
        on:click={addVisit}>{text}</a
    >
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

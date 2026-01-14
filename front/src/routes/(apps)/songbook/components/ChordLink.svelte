<script lang="ts">
    import { base } from '$app/paths';
    import { visitCountsStore, failedVisitCounts } from '../store';
    import { get } from 'svelte/store';
    import { toast } from '$lib/components/Toast';
    import { getTypeIconClass } from '../utils';
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import { uploadLinkVisit, type Chord } from '$lib/Songbook';
    interface Props {
        chord: Chord;
        showArtist?: boolean;
    }

    let { chord, showArtist = false }: Props = $props();

    let toolTipContent: string | undefined = $state();
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

    const text = $derived((showArtist ? chord.artist + ' - ' : '') + chord.title);

    const formatLink = (chord: Chord) => {
        if (chord.type === 'doc') {
            return `${base}/docviewer/${chord.url}`;
        }

        return chord.url;
    };

    const addVisit = async () => {
        try {
            await uploadLinkVisit({ url: chord.url });

            // Once we made the call and it succeeded update the store
            // to reflect the change without having to call the API again
            const map = get(visitCountsStore);
            const data = map.get(chord.url) || { count: 0, lastAccessDateUnix: 0 };
            data.count++;
            data.lastAccessDateUnix = Date.now() / 1000;
            map.set(chord.url, data);
            visitCountsStore.set(map);
        } catch (error) {
            let errorMessage = (error as Error).message;
            if (error instanceof ApiError && error.code === 401) {
                errorMessage = 'Invalid logged in user';
            } else if (error instanceof UserLoggedOutError) {
                errorMessage = 'User is logged out';
            }

            // Keep track of the failure so we can try re-uploading it when user logs in
            $failedVisitCounts = [...$failedVisitCounts, chord.url];

            const message = `<strong>Visit not counted</strong><br/> ${errorMessage}`;
            toast.push(message, {
                initial: 1,
                duration: 5000,
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
        onclick={addVisit}>{text}</a
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

    .fa-youtube {
        color: #e82236;
    }
</style>

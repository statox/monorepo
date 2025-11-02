<script lang="ts">
    import { getLinksVisitsCount, uploadLinkVisit } from '$lib/Songbook/api';
    import { modals } from 'svelte-modals';
    import { BackToTop } from '$lib/components/BackToTop';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { Notice } from '$lib/components/Notice';
    import type { NoticeItem } from '$lib/components/Notice';
    import {
        ListByAccessDate,
        ListByArtist,
        ListByTags,
        ListByVisitsCounts
    } from './components/views';
    import ChordsChecks from './components/ChordsChecks.svelte';
    import LatestAdditions from './components/LatestAdditions.svelte';
    import RandomSongs from './components/RandomSongs.svelte';
    import type { Chord, ChordVisitItem, Filters, FilterType } from '$lib/Songbook/types';
    import { onMount } from 'svelte';
    import { visitCountsStore, failedVisitCounts } from './store';
    import { getTypeIconClass } from './utils';
    import { goto } from '$app/navigation';
    import { user } from '$lib/auth2';
    import { pageNameStore } from '$lib/components/Header';

    pageNameStore.set('Songbook');

    interface Props {
        // From +page.ts load() function
        data: { chords: Chord[] };
    }

    let { data }: Props = $props();
    const { chords } = data;
    let noticeMessages: NoticeItem[] = $state([]);

    const enqueueNoticeMessage = (item: NoticeItem) => {
        // Note there is a built-in way to have page errors with svelte
        // TODO check how to use that
        noticeMessages.push(item);
        noticeMessages = noticeMessages;
        setTimeout(() => {
            noticeMessages.shift();
            noticeMessages = noticeMessages;
        }, 5000);
    };

    onMount(async () => {
        try {
            if ($failedVisitCounts.length && $user) {
                enqueueNoticeMessage({
                    level: 'info',
                    header: `Trying to count missed visits while logged out`
                });

                for (const url of $failedVisitCounts) {
                    await uploadLinkVisit(url);
                }

                enqueueNoticeMessage({
                    level: 'success',
                    header: `Counted ${$failedVisitCounts.length} missed visits`
                });
                $failedVisitCounts = [];
            }
        } catch (_error) {
            enqueueNoticeMessage({ level: 'error', header: 'Couldnt upload failed visit counts' });
        }

        try {
            const countsData = await getLinksVisitsCount();
            const counts = countsData.reduce(
                (counts: Map<string, ChordVisitItem>, count: ChordVisitItem) => {
                    counts.set(count.url, {
                        ...count
                    });
                    return counts;
                },
                new Map()
            );

            visitCountsStore.set(counts);
        } catch (_error) {
            enqueueNoticeMessage({ level: 'error', header: 'Couldnt upload failed visit counts' });
        }
    });

    let searchString = $state('');

    const views = [
        { label: 'By artist', component: ListByArtist },
        { label: 'By tags', component: ListByTags },
        { label: 'By frequency', component: ListByVisitsCounts },
        { label: 'By access date', component: ListByAccessDate }
    ];
    let currentView = $state(views[0]);

    // TODO: Fix filters which were broken even before svelte 5 migration
    const defaultFilters = {
        pdf: true,
        doc: true,
        youtube: true,
        link: true
    };
    let filters: Filters = $state({ ...defaultFilters });
    const filtersKey: FilterType[] = Object.keys(defaultFilters) as FilterType[];
</script>

<HeadIOS title="Song Book" description="My song book" iconPath="/songbook.png" />

<h2>
    <span class="pull-right">
        <button style:position="relative" onclick={() => modals.open(ChordsChecks)}>
            Check dead links
        </button>

        <button style:position="relative" onclick={() => goto('/songbook/edit')}> Edit </button>
    </span>
</h2>

{#each noticeMessages as item}
    <Notice {item} />
{/each}

<BackToTop />

<p>
    This is a list of {chords.length} song chords I have been gathering since I started teaching myself
    the guitar as a teen and that I like to play.
</p>

<LatestAdditions {chords} />
<RandomSongs {chords} />

<div>
    <h3>All songs</h3>
    Search an artist, a title or a tag:<input type="text" bind:value={searchString} />
    <button aria-label="delete search" onclick={() => (searchString = '')}>
        <i class="fas fa-times-circle"></i>
    </button>

    <div class="filter-controls-container">
        <h4>Filters</h4>
        {#each filtersKey as filter}
            <button
                aria-label="filter for {filter}"
                class="filter-control"
                onclick={() => {
                    filters[filter] = !filters[filter];
                    filters = filters;
                }}
            >
                <input id={filter} type="checkbox" bind:checked={filters[filter]} />
                <span class={getTypeIconClass(filter)}></span>
            </button>
        {/each}
    </div>

    <h4>View</h4>
    <div class="view-controls-container">
        {#each views as option}
            <button
                class="control"
                class:selected={currentView === option}
                onclick={() => (currentView = option)}
            >
                {option.label}
            </button>
        {/each}
    </div>
</div>

<currentView.component {chords} {searchString} {filters} />

<style>
    .view-controls-container {
        display: flex;
        justify-content: space-around;
    }
    .filter-controls-container {
        display: flex;
        justify-content: space-around;
    }

    .control {
        flex-grow: 1;
    }

    .filter-control {
        flex-grow: 1;
        background: none;
    }

    @media screen and (max-width: 750px) {
        .view-controls-container {
            flex-direction: column;
            gap: 0.3em;
        }
    }
    @media screen and (min-width: 750px) {
        .view-controls-container {
            flex-direction: row;
            gap: 1em;
        }
    }

    button.selected {
        background-color: var(--nc-lk-2);
        font-weight: bold;
    }

    .fa-file-word {
        color: #1d5af4;
    }

    .fa-file-pdf {
        color: #e82236;
    }

    .fa-youtube {
        color: #e82236;
    }

    .fa-link {
        color: #727171;
    }
</style>

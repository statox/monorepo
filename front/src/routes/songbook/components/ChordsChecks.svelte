<script lang="ts">
    import { PUBLIC_API_URL } from '$env/static/public';
    import { closeModal } from '$lib/components/Modal';
    import type { Chord } from '../types';
    export let isOpen: boolean;

    type ApiResult = {
        nbChecks: number;
        nbSkipped: number;
        fails: {
            status: string;
            error: any;
            chord: Chord;
        }[];
        nbFails: number;
        timestamp: number;
    };

    const CHORDS_CHECK_URL = PUBLIC_API_URL + '/chords/checkLinks';
    let lastChordsCheck: Promise<ApiResult> = fetch(CHORDS_CHECK_URL).then((response) =>
        response.json()
    );

    const formatTimestamp = (checks: ApiResult) => {
        const lastCheckDate = new Date(checks.timestamp);
        return lastCheckDate.toDateString() + ' ' + lastCheckDate.toTimeString();
    };

    const sortFails = (checks: ApiResult) =>
        checks.fails.sort((a: any, b: any) => (a.chord.url < b.chord.url ? -1 : 1));
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="contents">
            <h3 class="title-bar">
                Urls checks
                <button on:click={closeModal}>Close</button>
            </h3>

            {#await lastChordsCheck}
                <p>Fetching results...</p>
            {:then checks}
                {@const lastCheckDate = formatTimestamp(checks)}
                {@const failures = sortFails(checks)}
                <div class="rows">
                    <span class="col table-head">Last Check</span>
                    <span class="col table-head">Checks</span>
                    <span class="col table-head">Skipped</span>
                    <span class="col table-head">Errors</span>

                    <span class="col">{lastCheckDate}</span>
                    <span class="col">{checks.nbChecks}</span>
                    <span class="col">{checks.nbSkipped}</span>
                    <span class="col">{checks.nbFails}</span>
                </div>
                <br />
                <div class="rows">
                    <span class="col table-head">Status</span>
                    <span class="col table-head">Ref</span>
                    <span class="col table-head">Host</span>
                    <span class="col table-head">Data</span>
                    {#each failures as failure}
                        <span class="col">{failure.status}</span>
                        <span class="col">{failure.chord.artist} - {failure.chord.title}</span>
                        <span class="col"
                            ><a href={failure.chord.url} target="_blank" rel="noopener noreferrer"
                                >{new URL(failure.chord.url).hostname}</a
                            ></span
                        >
                        <span class="col">{failure.error ? JSON.stringify(failure.error) : ''}</span
                        >
                    {/each}
                </div>
            {:catch error}
                <p style="color: red">Could not retrieve checks: {error.message}</p>
            {/await}
        </div>
    </div>
{/if}

<style>
    .modal {
        position: fixed;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        margin: 3em;
        z-index: 9999;

        /* allow click-through to backdrop */
        pointer-events: none;
    }

    .contents {
        min-width: 240px;
        border-radius: 26px;
        padding: 16px;
        background: white;
        pointer-events: auto;

        max-height: 90%;
        overflow: auto;
    }

    .title-bar {
        margin-bottom: 1em;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .table-head {
        background-color: var(--nc-bg-2);
        font-weight: bold;
    }

    .rows {
        display: grid;
        grid-template-columns: repeat(4, auto);
    }
    .rows .col {
        padding: 0.5em;
        border: 1px solid var(--nc-bg-3);
    }
</style>

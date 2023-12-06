<script lang="ts">
    import { closeModal } from "$lib/components/Modal";
    export let isOpen: boolean;

    export let lastChordsCheck: any;

    const failures = lastChordsCheck?.fails.sort((a: any, b: any) =>
        a.chord.url < b.chord.url ? 1 : -1
    );

    const lastCheckDate = new Date(lastChordsCheck?.timestamp);
    const lastCheckDateStr = lastCheckDate.toDateString() + ' ' + lastCheckDate.toTimeString();
</script>

{#if isOpen}
<div role="dialog" class="modal">
    <div class="contents">
    <h3>Urls checks</h3>
    {#if !lastChordsCheck}
        <span>Could not retrieve checks</span>
    {:else}
        <table>
            <tr>
                <th>Last Check</th>
                <th>Checks</th>
                <th>Skipped</th>
                <th>Errors</th>
            </tr>
            <tr>
                <td>{lastCheckDateStr}</td>
                <td>{lastChordsCheck.nbChecks}</td>
                <td>{lastChordsCheck.nbSkipped}</td>
                <td>{lastChordsCheck.nbFails}</td>
            </tr>
        </table>
        <table>
            <tr>
                <th>Status</th>
                <th>Ref</th>
                <th>Url</th>
                <th>Data</th>
            </tr>
            {#each failures as failure}
                <tr>
                    <td>{failure.status}</td>
                    <td>{failure.chord.artist} - {failure.chord.title}</td>
                    <td><a href="{failure.chord.url}" target="_blank" rel="noopener noreferrer" >{failure.chord.url}</a></td>
                    <td>{failure.error ? JSON.stringify(failure.error) : ''}</td>
                </tr>
            {/each}
        </table>
    {/if}
    <div class="actions">
        <button on:click="{closeModal}">Close</button>
    </div>
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
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;

        margin: 3em;

        /* allow click-through to backdrop */
        pointer-events: none;
    }

    .contents {
        min-width: 240px;
        border-radius: 6px;
        padding: 16px;
        background: white;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        pointer-events: auto;

        max-height: 90%;
        overflow: auto;
    }

    .actions {
        margin-top: 32px;
        display: flex;
        justify-content: flex-end;
    }
</style>

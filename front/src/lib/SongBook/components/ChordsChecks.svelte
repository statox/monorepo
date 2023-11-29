<script lang="ts">
    export let lastChordsCheck: any;

    const failures = lastChordsCheck?.fails.sort((a: any, b: any) =>
        a.chord.url < b.chord.url ? 1 : -1
    );

    const lastCheckDate = new Date(lastChordsCheck?.timestamp);
    const lastCheckDateStr = lastCheckDate.toDateString() + ' ' + lastCheckDate.toTimeString();
</script>

<div>
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
</div>

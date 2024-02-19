<script lang="ts">
    import { type ReactorEntryForPublic } from '$lib/Reactor/types';

    export let reactions: ReactorEntryForPublic[];
</script>

<div class="container">
    {#each reactions.sort((a, b) => b.creationDateUnix - a.creationDateUnix) as entry}
        <div><b>{entry.name}</b></div>
        <div class="entry-data-section">
            <div>
                <a href={entry.s3PresignedUrl} download={entry.name}>
                    <img src={entry.s3PresignedUrl} alt={entry.name} />
                </a>
            </div>
        </div>
        <div>{entry.tags}</div>
    {/each}
</div>

<style>
    .container {
        display: grid;
        row-gap: 1em;
    }

    @media screen and (max-width: 750px) {
        .container {
            grid-template-columns: 100%;
        }
        .entry-data-section {
            padding-bottom: 1em;
            margin-bottom: 1em;
            border-bottom: 5px solid var(--nc-tx-1);
        }
    }
    @media screen and (min-width: 750px) {
        .container {
            grid-template-columns: auto 25% 1fr;
        }
    }
</style>

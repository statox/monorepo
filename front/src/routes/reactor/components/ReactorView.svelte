<script lang="ts">
    import { PUBLIC_API_URL } from '$env/static/public';
    import { type ReactorEntryForPublic } from '$lib/Reactor/types';

    export let reactions: ReactorEntryForPublic[];

    let searchString = '';

    const matchSearch = (entry: ReactorEntryForPublic, searchString: string) => {
        if (!searchString.length) {
            return true;
        }

        const formatedName = entry.name.toLowerCase();
        if (formatedName.includes(searchString.toLowerCase())) {
            return true;
        }

        for (const tag of entry.tags) {
            const formatedTag = tag.toLowerCase();
            if (formatedTag.includes(searchString.toLowerCase())) {
                return true;
            }
        }

        return false;
    };
</script>

<input type="text" bind:value={searchString} />

{#key searchString}
    <div class="container">
        {#each reactions
            .filter((entry) => matchSearch(entry, searchString))
            .sort((a, b) => b.creationDateUnix - a.creationDateUnix) as entry}
            <div>
                <div><b>{entry.name}</b></div>
                <div>
                    {#each entry.tags as tag}
                        <span class="tag">{tag}</span>
                    {/each}
                </div>
            </div>
            <div>
                <a
                    href={PUBLIC_API_URL + entry.uri}
                    download={entry.name}
                    rel="noopener noreferrer"
                    target="blank"
                >
                    <img src={PUBLIC_API_URL + entry.uri} alt={entry.name} />
                </a>
            </div>
        {/each}
    </div>
{/key}

<style>
    .container {
        display: grid;
        row-gap: 1em;
    }

    .tag {
        margin: 0.3em;
        padding: 0.3em;
        background-color: var(--nc-bg-2);
        color: var(--nc-tx-1);
        border-radius: 5px;
    }

    @media screen and (max-width: 750px) {
        .container {
            grid-template-columns: 100%;
        }
    }
    @media screen and (min-width: 750px) {
        .container {
            grid-template-columns: auto 1fr;
        }
    }
</style>

<script lang="ts">
    import { goto } from '$app/navigation';

    type App = {
        link: string;
        name: string;
        description: string;
    };
    type Section = {
        name: string;
        apps: App[];
    };

    interface Props {
        sections: Section[];
    }

    let { sections }: Props = $props();
</script>

{#each sections as section}
    <h2>{section.name}</h2>

    <div class="container">
        {#each section.apps as app}
            <button
                class="app"
                onclick={() =>
                    app.link.startsWith('/') ? goto(app.link) : window.open(app.link, '_blank')}
            >
                <h3>{app.name}</h3>
                <div class="description">{app.description}</div>
            </button>
        {/each}
    </div>
{/each}

<style>
    .container {
        display: flex;
        justify-content: flex-start;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 2em;
    }

    .app {
        flex: 1;
        min-width: 300px;
        min-height: 5em;
        padding-bottom: 2em;
        background-color: var(--nc-bg-2);
        white-space: normal;
        border-radius: 15px;

        @media screen and (min-width: 720px) {
            max-width: 300px;
        }
    }

    .app:hover {
        background: var(--nc-bg-3);
        border: solid 2px var(--nc-tx-1);
    }

    .description {
        color: var(--nc-tx-1);
    }
</style>

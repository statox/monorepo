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
            <button class="app" onclick={() => goto(app.link)}>
                <h3>{app.name}</h3>
                <div class="description">{app.description}</div>
            </button>
        {/each}
    </div>
{/each}

<style>
    .container {
        display: flex;
        justify-content: space-evenly;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 3em;
    }

    .app {
        flex: 1;
        min-width: 300px;
        min-height: 300px;
        background-color: var(--nc-bg-2);
        white-space: normal;
        border-radius: 15px;
    }

    .description {
        color: var(--nc-tx-1);
    }
</style>

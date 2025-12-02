<script lang="ts">
    import { pageMetadataStore } from '$lib/components/Header';
    import { sections } from './data';

    pageMetadataStore.set({ name: 'Browser home' });
</script>

{#each Object.keys(sections) as sectionName}
    <h3>{sectionName}</h3>
    <div class="container">
        {#each sections[sectionName] as link}
            <a class="app" href={link.url}>
                <img class="link-favicon" alt={link.name} src={link.icon} />
                <span class="link-name">{link.name}</span>
            </a>
        {/each}
    </div>
{/each}

<style>
    .container {
        min-width: 300px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .app {
        display: flex;
        flex-direction: row;
        gap: 10px;
        align-items: flex-start;
        justify-content: flex-start;
        flex: 1;
        min-width: 5vw;
        background-color: var(--nc-bg-2);
        border-radius: 15px;

        padding: 0.2em;
        cursor: pointer;
    }

    .link-favicon {
        height: 2em;
        width: 2em;
        margin: 0;
    }
</style>

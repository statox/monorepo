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
                <span class="link-name">{link.name}</span>
                <img class="link-favicon" alt={link.name} src={link.icon} />
            </a>
        {/each}
    </div>
{/each}

<style>
    .container {
        min-width: 300px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
    }

    @media screen and (max-width: 600px) {
        .container {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .app {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-around;
        flex: 1;
        min-width: 5vw;
        min-height: 10em;
        background-color: var(--nc-bg-2);
        border-radius: 15px;
    }

    .link-favicon {
        width: 50%;
        height: 50%;
    }
</style>

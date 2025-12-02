<script lang="ts">
    import { pageMetadataStore } from '$lib/components/Header';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { sections } from './data';

    const pageMetadata = {
        name: 'Browser home',
        description: 'Browse the news',
        iconPath: '/browser_home.png'
    } as const;
    pageMetadataStore.set(pageMetadata);
</script>

<HeadIOS
    title={pageMetadata.name}
    description={pageMetadata.description}
    iconPath={pageMetadata.iconPath}
/>

<div class="container">
    {#each Object.keys(sections) as sectionName}
        <div class="section-container">
            <h3>{sectionName}</h3>
            {#each sections[sectionName] as link}
                <a class="app" href={link.url} target="_blank" rel="noopener noreferrer">
                    <img class="link-favicon" alt={link.name} src={link.icon} />
                    <span class="link-name">{link.name}</span>
                </a>
            {/each}
        </div>
    {/each}
</div>

<style>
    .container {
        min-width: 300px;
        column-width: 300px;
        column-gap: 30px;

        @media screen and (max-width: 600px) {
            padding: 10px;
        }
    }

    .section-container {
        min-width: 300px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        break-inside: avoid;
        margin-bottom: 30px;
    }

    .app {
        display: flex;
        flex-direction: row;
        gap: 10px;
        max-height: 2em;
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
        background-color: var(--nc-lk-2);
    }
</style>

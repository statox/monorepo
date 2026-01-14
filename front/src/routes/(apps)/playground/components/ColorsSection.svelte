<script lang="ts">
    const colorVars = [
        { name: '--nc-tx-1', description: 'Primary text' },
        { name: '--nc-tx-2', description: 'Secondary text' },
        { name: '--nc-tx-3', description: 'Tertiary text / comments' },
        { name: '--nc-bg-1', description: 'Primary background' },
        { name: '--nc-bg-2', description: 'Secondary background' },
        { name: '--nc-bg-3', description: 'Tertiary background' },
        { name: '--nc-lk-1', description: 'Primary link' },
        { name: '--nc-lk-2', description: 'Secondary link' },
        { name: '--nc-lk-tx', description: 'Link text on colored bg' },
        { name: '--nc-ac-1', description: 'Accent color' },
        { name: '--nc-ac-tx', description: 'Accent text' },
        { name: '--nc-success', description: 'Success color' },
        { name: '--nc-info', description: 'Info color' },
        { name: '--nc-error', description: 'Error color' },
        { name: '--nc-white', description: 'White' }
    ];
</script>

<section>
    <h2>Colors</h2>
    <div class="color-grid">
        {#each colorVars as { name, description }}
            <div class="color-swatch">
                <div class="color-box" style="background-color: var({name})"></div>
                <div class="color-info">
                    <code>{name}</code>
                    <span class="color-desc">{description}</span>
                </div>
            </div>
        {/each}
    </div>
</section>

<style>
    section {
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    .color-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
    }

    .color-swatch {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem;
        background-color: var(--nc-bg-2);
        border-radius: 4px;
    }

    .color-box {
        width: 50px;
        height: 50px;
        border-radius: 4px;
        border: 1px solid var(--nc-bg-3);
        flex-shrink: 0;
    }

    .color-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .color-info code {
        color: var(--nc-tx-1);
        font-size: 0.9rem;
    }

    .color-desc {
        color: var(--nc-tx-3);
        font-size: 0.85rem;
    }
</style>

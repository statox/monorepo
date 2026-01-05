<script lang="ts">
    import { emotionWheel } from '$lib/PersonalTracker/emotionWheel';
    import { SvelteSet } from 'svelte/reactivity';

    interface Props {
        selection: SvelteSet<string>;
    }
    let { selection }: Props = $props();

    const select = (value: {
        category: string;
        subcategory: string;
        emotion: string;
        color: string;
    }) => {
        const entryAsStr = [value.category, value.subcategory, value.emotion, value.color].join(
            ' - '
        );
        if (selection.has(entryAsStr)) {
            selection.delete(entryAsStr);
        } else {
            selection.add(entryAsStr);
        }
    };

    const isSelected = (category: string, subcategory: string, emotion: string) => {
        return [...selection].some((item) => {
            const parts = item.split(' - ');
            return parts[0] === category && parts[1] === subcategory && parts[2] === emotion;
        });
    };

    // Organize emotions by category
    const categories = Object.keys(emotionWheel).map((categoryName) => {
        const color = (emotionWheel[categoryName] as any)._color || '#CCCCCC';
        const subcategories = Object.keys(emotionWheel[categoryName])
            .filter((key) => !key.startsWith('_'))
            .map((subcategoryName) => {
                const emotions = Object.keys((emotionWheel[categoryName] as any)[subcategoryName]);
                return {
                    name: subcategoryName,
                    emotions
                };
            });

        return {
            name: categoryName,
            color,
            subcategories
        };
    });

    const expandedCategories = new SvelteSet<string>();

    const toggleCategory = (categoryName: string) => {
        if (expandedCategories.has(categoryName)) {
            expandedCategories.delete(categoryName);
        } else {
            expandedCategories.add(categoryName);
        }
    };
</script>

<div class="emotion-list">
    {#each categories as category}
        <div class="category-section">
            <button
                class="category-header"
                onclick={() => toggleCategory(category.name)}
                style="background-color: {category.color}"
            >
                <span class="category-name">{category.name}</span>
                <span class="expand-icon">
                    {expandedCategories.has(category.name) ? '▼' : '▶'}
                </span>
            </button>

            {#if expandedCategories.has(category.name)}
                <div class="category-content">
                    {#each category.subcategories as subcategory}
                        <div class="subcategory-section">
                            <h5 class="subcategory-name">{subcategory.name}</h5>
                            <div class="emotions-grid">
                                {#each subcategory.emotions as emotion}
                                    {@const selected = isSelected(
                                        category.name,
                                        subcategory.name,
                                        emotion
                                    )}
                                    <button
                                        class="emotion-btn"
                                        class:selected
                                        onclick={() =>
                                            select({
                                                category: category.name,
                                                subcategory: subcategory.name,
                                                emotion,
                                                color: category.color
                                            })}
                                        style="--category-color: {category.color}"
                                    >
                                        {emotion}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .emotion-list {
        display: flex;
        flex-direction: column;
        gap: 0.75em;
    }

    .category-section {
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid var(--nc-bg-3);
    }

    .category-header {
        width: 100%;
        padding: 1em;
        border: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: white;
        font-weight: bold;
        font-size: 1.1em;
        text-shadow:
            0 1px 3px rgba(0, 0, 0, 0.8),
            0 0 10px rgba(0, 0, 0, 0.5);
    }

    .category-header:hover {
        filter: brightness(1.1);
    }

    .expand-icon {
        font-size: 0.8em;
    }

    .category-content {
        background-color: var(--nc-bg-1);
        padding: 1em;
    }

    .subcategory-section {
        margin-bottom: 1.5em;
    }

    .subcategory-section:last-child {
        margin-bottom: 0;
    }

    .subcategory-name {
        margin: 0 0 0.75em 0;
        font-size: 1em;
        opacity: 0.8;
    }

    .emotions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.5em;
    }

    .emotion-btn {
        padding: 0.75em;
        border-radius: 6px;
        border: 2px solid var(--nc-bg-3);
        background-color: var(--nc-bg-1);
        color: var(--nc-tx-1);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9em;
        text-align: center;
    }

    .emotion-btn:hover {
        border-color: var(--category-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .emotion-btn.selected {
        background-color: var(--category-color);
        border-color: var(--category-color);
        color: white;
        font-weight: bold;
        transform: scale(1.05);
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
        .emotions-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        }

        .emotion-btn {
            padding: 0.6em;
            font-size: 0.85em;
        }
    }

    @media (max-width: 480px) {
        .emotions-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .emotion-btn {
            padding: 0.5em;
            font-size: 0.8em;
        }

        .category-header {
            padding: 0.75em;
            font-size: 1em;
        }
    }
</style>

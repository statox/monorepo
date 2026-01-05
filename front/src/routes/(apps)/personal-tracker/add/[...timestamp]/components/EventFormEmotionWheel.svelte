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

    // Calculate the total number of emotions to determine angular proportions
    interface CategoryData {
        name: string;
        color: string;
        emotionCount: number;
        startAngle: number;
        endAngle: number;
        subcategories: SubcategoryData[];
    }

    interface SubcategoryData {
        name: string;
        startAngle: number;
        endAngle: number;
        emotions: string[];
    }

    function calculateAngles(): CategoryData[] {
        const categories: CategoryData[] = [];

        // First pass: count emotions per category
        let totalEmotions = 0;
        Object.keys(emotionWheel).forEach((categoryName) => {
            let emotionCount = 0;
            Object.keys(emotionWheel[categoryName])
                .filter((key) => !key.startsWith('_'))
                .forEach((subcategoryName) => {
                    // @ts-expect-error TODO Type properly
                    emotionCount += Object.keys(emotionWheel[categoryName][subcategoryName]).length;
                });
            const color = (emotionWheel[categoryName] as any)._color || '#CCCCCC';
            categories.push({
                name: categoryName,
                color,
                emotionCount,
                startAngle: 0,
                endAngle: 0,
                subcategories: []
            });
            totalEmotions += emotionCount;
        });

        // Second pass: calculate angles
        let currentAngle = 0;
        categories.forEach((category) => {
            const categoryAngleSpan = (category.emotionCount / totalEmotions) * 360;
            category.startAngle = currentAngle;
            category.endAngle = currentAngle + categoryAngleSpan;

            // Calculate subcategory angles
            let subcategoryAngle = currentAngle;
            Object.keys(emotionWheel[category.name])
                .filter((key) => !key.startsWith('_'))
                .forEach((subcategoryName) => {
                    // @ts-expect-error TODO Type properly
                    const emotions = Object.keys(emotionWheel[category.name][subcategoryName]);
                    const subcategoryAngleSpan =
                        (emotions.length / category.emotionCount) * categoryAngleSpan;

                    category.subcategories.push({
                        name: subcategoryName,
                        startAngle: subcategoryAngle,
                        endAngle: subcategoryAngle + subcategoryAngleSpan,
                        emotions
                    });

                    subcategoryAngle += subcategoryAngleSpan;
                });

            currentAngle += categoryAngleSpan;
        });

        return categories;
    }

    const categoryData = calculateAngles();

    // Helper function to lighten a hex color
    function lightenColor(hex: string, percent: number): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.floor((num >> 16) + ((255 - (num >> 16)) * percent) / 100));
        const g = Math.min(
            255,
            Math.floor(((num >> 8) & 0x00ff) + ((255 - ((num >> 8) & 0x00ff)) * percent) / 100)
        );
        const b = Math.min(
            255,
            Math.floor((num & 0x0000ff) + ((255 - (num & 0x0000ff)) * percent) / 100)
        );
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    // Hover state management
    let hoveredCategory: string | null = $state(null);
    let hoveredSubcategory: string | null = $state(null);
    let hoveredEmotion: string | null = $state(null);

    function handleEmotionHover(
        categoryName: string,
        subcategoryName: string,
        emotionName: string
    ) {
        hoveredCategory = categoryName;
        hoveredSubcategory = subcategoryName;
        hoveredEmotion = emotionName;
    }

    function handleSubcategoryHover(categoryName: string, subcategoryName: string) {
        hoveredCategory = categoryName;
        hoveredSubcategory = subcategoryName;
        hoveredEmotion = null;
    }

    function handleCategoryHover(categoryName: string) {
        hoveredCategory = categoryName;
        hoveredSubcategory = null;
        hoveredEmotion = null;
    }

    function clearHover() {
        hoveredCategory = null;
        hoveredSubcategory = null;
        hoveredEmotion = null;
    }

    // Helper function to create SVG arc path
    function createWedgePath(
        startAngle: number,
        endAngle: number,
        innerRadius: number,
        outerRadius: number,
        centerX: number = 50,
        centerY: number = 50
    ): string {
        const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
        const endAngleRad = ((endAngle - 90) * Math.PI) / 180;

        const x1 = centerX + innerRadius * Math.cos(startAngleRad);
        const y1 = centerY + innerRadius * Math.sin(startAngleRad);
        const x2 = centerX + outerRadius * Math.cos(startAngleRad);
        const y2 = centerY + outerRadius * Math.sin(startAngleRad);
        const x3 = centerX + outerRadius * Math.cos(endAngleRad);
        const y3 = centerY + outerRadius * Math.sin(endAngleRad);
        const x4 = centerX + innerRadius * Math.cos(endAngleRad);
        const y4 = centerY + innerRadius * Math.sin(endAngleRad);

        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return `
            M ${x1} ${y1}
            L ${x2} ${y2}
            A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3}
            L ${x4} ${y4}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}
            Z
        `;
    }

    // Helper function to calculate text position and rotation
    function getTextTransform(
        startAngle: number,
        endAngle: number,
        radius: number
    ): { x: number; y: number; rotation: number } {
        const midAngle = (startAngle + endAngle) / 2;
        const angleRad = ((midAngle - 90) * Math.PI) / 180;
        const x = 50 + radius * Math.cos(angleRad);
        const y = 50 + radius * Math.sin(angleRad);

        // Flip text on right side for readability
        const rotation = midAngle < 180 ? midAngle - 90 : midAngle + 90;

        return { x, y, rotation };
    }
</script>

<div class="emotion-wheel-container">
    <svg viewBox="0 0 100 100" class="wheel">
        <!-- Outer circle: Emotions -->
        {#each categoryData as category}
            {#each category.subcategories as subcategory}
                {@const anglePerEmotion =
                    (subcategory.endAngle - subcategory.startAngle) / subcategory.emotions.length}
                {#each subcategory.emotions as emotion, i}
                    {@const emotionStartAngle = subcategory.startAngle + i * anglePerEmotion}
                    {@const emotionEndAngle = subcategory.startAngle + (i + 1) * anglePerEmotion}
                    {@const path = createWedgePath(emotionStartAngle, emotionEndAngle, 30, 47)}
                    {@const textPos = getTextTransform(emotionStartAngle, emotionEndAngle, 38.5)}
                    {@const isHighlighted = hoveredEmotion === emotion}
                    {@const isSelected = [...selection].find((v) => v.includes(emotion))}
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <g
                        class="emotion-wedge"
                        onmouseenter={() =>
                            handleEmotionHover(category.name, subcategory.name, emotion)}
                        onmouseleave={clearHover}
                        onclick={() =>
                            select({
                                category: category.name,
                                subcategory: subcategory.name,
                                emotion,
                                color: category.color
                            })}
                    >
                        <path
                            d={path}
                            class="emotion-path"
                            class:highlighted={isHighlighted}
                            class:selected={isSelected}
                            style="fill: {category.color};"
                        />
                        <text
                            x={textPos.x}
                            y={textPos.y}
                            transform="rotate({textPos.rotation} {textPos.x} {textPos.y})"
                            class="emotion-text"
                            text-anchor="middle"
                            dominant-baseline="middle"
                        >
                            {emotion}
                        </text>
                    </g>
                {/each}
            {/each}
        {/each}

        <!-- Middle circle: Subcategories -->
        {#each categoryData as category}
            {#each category.subcategories as subcategory}
                {@const path = createWedgePath(
                    subcategory.startAngle,
                    subcategory.endAngle,
                    17,
                    30
                )}
                {@const textPos = getTextTransform(
                    subcategory.startAngle,
                    subcategory.endAngle,
                    23.5
                )}
                {@const isHighlighted =
                    hoveredSubcategory === subcategory.name && hoveredCategory === category.name}
                {@const isSelected = [...selection].find((v) => v.includes(subcategory.name))}
                {@const lighterColor = lightenColor(category.color, 30)}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <g
                    class="subcategory-wedge"
                    onmouseenter={() => handleSubcategoryHover(category.name, subcategory.name)}
                    onmouseleave={clearHover}
                >
                    <path
                        d={path}
                        class="subcategory-path"
                        class:highlighted={isHighlighted}
                        class:selected={isSelected}
                        style="fill: {lighterColor};"
                    />
                    <text
                        x={textPos.x}
                        y={textPos.y}
                        transform="rotate({textPos.rotation} {textPos.x} {textPos.y})"
                        class="subcategory-text"
                        text-anchor="middle"
                        dominant-baseline="middle"
                    >
                        {subcategory.name}
                    </text>
                </g>
            {/each}
        {/each}

        <!-- Inner circle: Categories -->
        {#each categoryData as category}
            {@const path = createWedgePath(category.startAngle, category.endAngle, 0, 17)}
            {@const textPos = getTextTransform(category.startAngle, category.endAngle, 8.5)}
            {@const isHighlighted = hoveredCategory === category.name}
            {@const isSelected = [...selection].find((v) => v.includes(category.name))}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <g
                class="category-wedge"
                onmouseenter={() => handleCategoryHover(category.name)}
                onmouseleave={clearHover}
            >
                <path
                    d={path}
                    class="category-path"
                    class:highlighted={isHighlighted}
                    class:selected={isSelected}
                    style="fill: {category.color};"
                />
                <text
                    x={textPos.x}
                    y={textPos.y}
                    transform="rotate({textPos.rotation} {textPos.x} {textPos.y})"
                    class="category-text"
                    text-anchor="middle"
                    dominant-baseline="middle"
                >
                    {category.name}
                </text>
            </g>
        {/each}

        <!-- Center circle -->
        <circle cx="50" cy="50" r="0" class="center-circle" />
    </svg>
</div>

<style>
    .emotion-wheel-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        box-sizing: border-box;
    }

    .wheel {
        width: 100%;
        height: 100%;
        max-width: 800px;
        max-height: 800px;
    }

    /* Category styles */
    .category-path {
        stroke: #333;
        stroke-width: 0.2;
        cursor: pointer;
        transition: filter 0.2s;
    }

    .category-path.highlighted {
        filter: brightness(1.25);
        stroke-width: 0.5;
    }
    .category-path.selected {
        filter: brightness(0.85);
    }

    .category-text {
        font-size: 2px;
        font-weight: bold;
        pointer-events: none;
        user-select: none;
    }

    /* Subcategory styles */
    .subcategory-path {
        stroke: #333;
        stroke-width: 0.2;
        cursor: pointer;
        transition: filter 0.2s;
    }

    .subcategory-path.highlighted {
        filter: brightness(1.25);
        stroke-width: 0.5;
    }
    .subcategory-path.selected {
        filter: brightness(0.85);
    }

    .subcategory-text {
        font-size: 2.1px;
        font-weight: 600;
        pointer-events: none;
        user-select: none;
    }

    /* Emotion styles */
    .emotion-path {
        stroke: #333;
        stroke-width: 0.2;
        cursor: pointer;
        transition: filter 0.2s;
    }

    .emotion-path.highlighted {
        filter: brightness(1.25);
        stroke-width: 0.5;

        transform: scale(1.12);
        transform-origin: 50% 50%;
        transform-box: fill-box;
    }

    .emotion-path.selected {
        filter: brightness(0.85);

        transform: scale(1.12);
        transform-origin: 50% 50%;
        transform-box: fill-box;
    }

    .emotion-text {
        font-size: 2.4px;
        pointer-events: none;
        user-select: none;
    }

    .center-circle {
        fill: white;
        stroke: #333;
        stroke-width: 0.2;
    }
</style>

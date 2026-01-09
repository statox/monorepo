<script lang="ts">
    import { PUBLIC_ENVIRONMENT } from '$env/static/public';
    import { getApiUrl } from '$lib/helpers';
    import { onMount } from 'svelte';

    const apiUrl = getApiUrl();
    const isLocal = apiUrl.includes('localhost');
    const symbol = isLocal ? '💻' : '🌍';
    const label = isLocal ? 'Local' : 'Remote';
    let color = $state('#000000'); // Default in case we can't get it from the CSS

    onMount(() => {
        const bodyStyle = getComputedStyle(document.body);
        const colorClass = isLocal ? '--nc-success' : '--nc-error';
        color = bodyStyle.getPropertyValue(colorClass);
    });
</script>

{#if PUBLIC_ENVIRONMENT === 'local'}
    <span class="debug-indicator" title="API Server: {label}" style="--color: {color}">
        {symbol}
    </span>
{/if}

<style>
    .debug-indicator {
        font-size: 1.2em;
        padding: 0.15em;
        cursor: help;
        user-select: none;

        background-color: var(--color);

        border-radius: 50%;
    }
</style>

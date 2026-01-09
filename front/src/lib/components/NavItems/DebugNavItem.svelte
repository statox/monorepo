<script lang="ts">
    import { PUBLIC_ENVIRONMENT } from '$env/static/public';
    import { apiUrlTypeStore, toggleApiUrl } from '$lib/api/apiUrlStore';

    const isLocal = $derived($apiUrlTypeStore === 'local');
    const symbol = $derived(isLocal ? '💻' : '🌍');
    const label = $derived(isLocal ? 'Local' : 'Remote');
    let color = $state('#000000'); // Default in case we can't get it from the CSS

    $effect(() => {
        if (typeof document !== 'undefined') {
            const bodyStyle = getComputedStyle(document.body);
            const colorClass = isLocal ? '--nc-success' : '--nc-error';
            color = bodyStyle.getPropertyValue(colorClass);
        }
    });

    const handleClick = () => {
        toggleApiUrl();
    };
</script>

{#if PUBLIC_ENVIRONMENT === 'local'}
    <button
        class="debug-indicator"
        title="API Server: {label} (click to toggle)"
        style="--color: {color}"
        onclick={handleClick}
        type="button"
    >
        {symbol}
    </button>
{/if}

<style>
    .debug-indicator {
        /* Reset button styles */
        border: none;
        font-family: inherit;
        margin: 0;

        /* Rounded button */
        font-size: 1.2em;
        padding: 0.15em;
        cursor: pointer;
        user-select: none;

        background-color: var(--color);

        border-radius: 50%;
    }

    .debug-indicator:hover {
        opacity: 0.8;
    }
</style>

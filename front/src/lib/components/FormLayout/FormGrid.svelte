<script lang="ts">
    interface Props {
        children: import('svelte').Snippet;
        onsubmit?: () => void | Promise<void>;
    }

    let { children, onsubmit }: Props = $props();
</script>

<form
    class="form-grid"
    onsubmit={(e) => {
        e.preventDefault();
        onsubmit?.();
    }}
>
    {@render children()}
</form>

<style>
    .form-grid {
        display: grid;
        grid-template-columns: minmax(80px, 120px) 1fr;
        grid-row-gap: 1em;
        grid-column-gap: 1em;
    }

    .form-grid :global(label) {
        text-align: right;
    }

    .form-grid :global(.field-error) {
        grid-column: 2;
        color: var(--nc-error);
        font-size: 0.85em;
        margin-top: -0.5em;
    }

    @media screen and (max-width: 600px) {
        .form-grid {
            grid-template-columns: 100% !important;
        }

        .form-grid :global(label) {
            text-align: left;
        }

        .form-grid :global(.field-error) {
            grid-column: 1;
        }
    }
</style>

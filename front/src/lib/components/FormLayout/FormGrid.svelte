<script lang="ts">
    interface Props {
        children: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<form class="form-grid">
    {@render children()}
</form>

<style>
    .form-grid {
        display: grid;
        grid-template-columns: auto auto;
        grid-row-gap: 1em;
    }

    @media screen and (max-width: 600px) {
        .form-grid {
            grid-template-columns: 100% !important;
        }
    }
</style>

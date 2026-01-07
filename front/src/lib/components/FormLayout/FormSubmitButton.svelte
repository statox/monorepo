<script lang="ts">
    import { Spinner } from '$lib/components/Spinner';

    interface Props {
        onclick: () => void | Promise<void>;
        loading?: boolean;
        disabled?: boolean;
        label?: string;
        spanTwoColumns?: boolean;
    }

    let {
        onclick,
        loading = false,
        disabled = false,
        label = 'Submit',
        spanTwoColumns = true
    }: Props = $props();
</script>

<button
    class="form-submit-button"
    class:span-two={spanTwoColumns}
    {onclick}
    disabled={disabled || loading}
>
    {#if loading}
        <Spinner size={0.5} unit="em" durationSeconds={0.5} />
    {:else}
        {label}
    {/if}
</button>

<style>
    .form-submit-button {
        margin-top: 1em;
        width: auto;
        min-width: 120px;
    }

    .form-submit-button.span-two {
        grid-column: 1 / -1;
        justify-self: start;
    }

    @media screen and (max-width: 600px) {
        .form-submit-button.span-two {
            grid-column: 1 / -1;
            justify-self: start;
        }
    }
</style>

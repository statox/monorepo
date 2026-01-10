<script lang="ts">
    import { ButtonDelete } from '../ButtonDelete';

    interface Props {
        files?: FileList;
    }

    let { files = $bindable() }: Props = $props();
    let fileInput: HTMLInputElement | undefined = $state();
    let hasInput = $state(false);

    const clearFile = () => {
        if (fileInput !== undefined) {
            fileInput.value = '';
        }
        hasInput = (fileInput?.value?.length ?? 0) > 0;
    };
</script>

<span class="file-input-container">
    {#if hasInput}
        <ButtonDelete deleteAction={clearFile} />
    {/if}
    <input
        class="file-input"
        type="file"
        bind:files
        bind:this={fileInput}
        onchange={() => (hasInput = (fileInput?.value?.length ?? 0) > 0)}
    />
</span>

<style>
    .file-input-container {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        width: 100%;
        max-width: 100%;
    }

    .file-input {
        flex: 1 1 auto;
        min-width: 0;
        max-width: 400px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    @media screen and (max-width: 600px) {
        .file-input-container {
            gap: 0.25rem;
        }
    }
</style>

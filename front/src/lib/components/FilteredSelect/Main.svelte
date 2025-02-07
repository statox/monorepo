<script lang="ts">
    const normalizeString = (str: string) => {
        // Decompose the string into unicode representation separating
        // the accents from the letters. Then remove the accents characters
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    interface Props {
        value: string;
        options: string[];
    }

    let { value = $bindable(), options }: Props = $props();
    let selectionDone = $state(false);

    let filteredOptions = $derived(
        options.filter((i) => {
            if (value.length < 2) {
                return false;
            }
            return normalizeString(i).toLowerCase().includes(normalizeString(value).toLowerCase());
        })
    );

    function selectIngredient(option: string) {
        value = option;
        selectionDone = true;
    }

    const inputChanged = () => {
        selectionDone = false;
    };
</script>

<span>
    <input bind:value type="text" oninput={inputChanged} />
    {#if filteredOptions.length > 0 && !selectionDone}
        <div class="dropdown">
            {#each filteredOptions as option}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="option" onclick={() => selectIngredient(option)}>
                    {option}
                </div>
            {/each}
        </div>
    {/if}
</span>

<style>
    input {
        width: 100%;
    }

    .dropdown {
        border: 1px solid var(--nc-bg-2);
        padding-top: 6px;
        padding-bottom: 6px;
        padding-left: 12px;
        padding-right: 12px;
    }

    .option {
        cursor: pointer;
    }

    .option:hover {
        background-color: var(--nc-bg-2);
    }
</style>

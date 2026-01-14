<script lang="ts">
    import Spinner from '$lib/components/Spinner/Main.svelte';
    import DurationPicker from '$lib/components/DurationPicker/Main.svelte';
    import FilteredSelect from '$lib/components/FilteredSelect/Main.svelte';
    import ValueWithUnit from '$lib/components/ValueWithUnit/Main.svelte';

    let durationValue = $state(3600);
    let selectValue = $state('option2');

    const selectOptions = ['option1', 'option2', 'option3', 'verylongoption'];
</script>

<section>
    <h2>Other Components</h2>
    <div class="component-examples">
        <div class="component-demo">
            <h3>Spinner</h3>
            <Spinner size={50} unit="px" durationSeconds={1} />
        </div>

        <div class="component-demo">
            <h3>DurationPicker</h3>
            <DurationPicker bind:valueInSeconds={durationValue} />
            <p>Selected duration: {durationValue} seconds</p>
        </div>

        <div class="component-demo">
            <h3>FilteredSelect</h3>
            <FilteredSelect bind:value={selectValue} options={selectOptions} />
            <p>Selected: {selectValue || 'none'}</p>
        </div>

        <div class="component-demo">
            <h3>ValueWithUnit</h3>
            <div class="value-examples">
                <span><ValueWithUnit value={42} unitString="kg" /></span>
                <span><ValueWithUnit value={3.14} unitString="m/s" /></span>
                <span><ValueWithUnit value={100} unitString="%" /></span>
            </div>
        </div>
    </div>
</section>

<style>
    section {
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    .component-examples {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .component-demo {
        background-color: var(--nc-bg-2);
        padding: 1.5rem;
        border-radius: 4px;
    }

    .component-demo p {
        margin-top: 0.5rem;
        color: var(--nc-tx-3);
        font-size: 0.9rem;
    }

    .value-examples {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
</style>

<script lang="ts">
    import { Duration, type DurationLikeObject, type DurationUnit } from 'luxon';

    const units: DurationUnit[] = ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'];

    export let allowedUnits: DurationUnit[] = units;
    export let defaultDuration: { value: number, unit: DurationUnit } = { value: 10, unit: allowedUnits[0]};
    export let valueInSeconds: number;

    let inputUnit = defaultDuration.unit;
    let inputValue = defaultDuration.value;

    $: {
        const durationLikeObj: DurationLikeObject = {};
        durationLikeObj[inputUnit as DurationUnit] = inputValue;
        const ttlDuration = Duration.fromObject(durationLikeObj);
        valueInSeconds = ttlDuration.as('seconds');
    }
</script>

<div>
    <input type="number" min="0" bind:value={inputValue} />
    <select bind:value={inputUnit}>
        {#each allowedUnits as unit}
            <option value={unit}>{unit}</option>
        {/each}
    </select>
</div>

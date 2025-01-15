<script lang="ts">
    import { Duration, type DurationLikeObject, type DurationUnit } from 'luxon';

    const defaultAllowedUnits: DurationUnit[] = [
        'seconds',
        'minutes',
        'hours',
        'days',
        'weeks',
        'months',
        'years'
    ];

    interface Props {
        allowedUnits?: DurationUnit[];
        defaultDuration?: { value: number; unit: DurationUnit };
        valueInSeconds: number;
    }

    let {
        allowedUnits = defaultAllowedUnits,
        defaultDuration = {
            value: 10,
            unit: allowedUnits[0]
        },
        valueInSeconds = $bindable()
    }: Props = $props();

    let inputUnit = $state(defaultDuration.unit);
    let inputValue = $state(defaultDuration.value);

    $effect(() => {
        const durationLikeObj: DurationLikeObject = {};
        durationLikeObj[inputUnit as DurationUnit] = inputValue;
        const ttlDuration = Duration.fromObject(durationLikeObj);
        valueInSeconds = ttlDuration.as('seconds');
    });
</script>

<div>
    <input type="number" min="0" bind:value={inputValue} />
    <select bind:value={inputUnit}>
        {#each allowedUnits as unit}
            <option value={unit}>{unit}</option>
        {/each}
    </select>
</div>

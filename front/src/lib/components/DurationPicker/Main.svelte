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

    // Initialize with default values, will be set by effect
    let inputUnit = $state<DurationUnit>('seconds');
    let inputValue = $state<number>(0);

    // Sync state when defaultDuration prop changes
    $effect(() => {
        inputUnit = defaultDuration.unit;
        inputValue = defaultDuration.value;
    });

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

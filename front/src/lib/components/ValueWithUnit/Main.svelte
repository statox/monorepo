<script lang="ts">
    interface Props {
        value: number | undefined;
        unitString: string;
        precision?: number;
    }

    let { value, unitString, precision = 1 }: Props = $props();

    let intPart = $state('-');
    let floatPart = $state('');

    $effect(() => {
        if (value === undefined) {
            return;
        }

        const valueAsString = value?.toFixed(precision);
        intPart = valueAsString.split('.')[0];
        floatPart = valueAsString.split('.')[1] || '';
    });
</script>

<span class="value">
    <div>
        {intPart}
    </div>
    {#if floatPart && precision > 0}
        <div class="float-part">
            .{floatPart}
        </div>
    {/if}
</span>
<span class="unit-symbol">{unitString}</span>

<style>
    .value {
        /* TODO: Check if justify-self interferes with other usages and how to remove id needed */
        justify-self: end; /* This is here to properly align in the SensorSummary element */

        display: inline-flex;
        align-items: baseline;
    }
    .float-part {
        font-size: 0.6em;
    }
    .unit-symbol {
        padding-left: 0.2ch;
        font-size: 0.8em;
        color: var(--nc-tx-1);
    }
</style>

<script lang="ts">
    import { Duration } from 'luxon';

    interface Props {
        oldValue: number;
        newValue: number;
        oldTimestamp: number;
        newTimestamp: number;
    }

    let { oldValue, newValue, oldTimestamp, newTimestamp }: Props = $props();

    const trendValue = $derived(newValue - oldValue);
    const trendValueStr = $derived(trendValue.toFixed(1));
    const trendDuration = $derived(Duration.fromMillis(newTimestamp - oldTimestamp));
    const trendDurationStr = $derived(
        trendDuration.as('hours') < 2
            ? trendDuration.toFormat("m'm'")
            : trendDuration.toFormat("hh'h'mm'm'")
    );

    const getTrendIconClass = () => {
        if (Math.abs(trendValue) < 0.2) {
            return 'trend-steady fas fa-equals';
        }
        if (trendValue > 0) {
            return 'trend-up fas fa-long-arrow-alt-up';
        }

        return 'trend-down fas fa-long-arrow-alt-down';
    };
</script>

<span class="container">
    <i class={getTrendIconClass()}></i>
    {trendValueStr} / {trendDurationStr}
</span>

<style>
    .container {
        font-size: small;
    }

    .trend-steady {
        color: var(--nc-info);
    }

    .trend-up {
        color: var(--nc-success);
    }

    .trend-down {
        color: var(--nc-error);
    }
</style>

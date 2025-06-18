<script lang="ts">
    interface Props {
        oldValue: number;
        newValue: number;
        oldTimestamp: number;
        newTimestamp: number;
    }

    let { oldValue, newValue, oldTimestamp, newTimestamp }: Props = $props();

    const trendValue = newValue - oldValue;
    const trendValueStr = trendValue.toFixed(1);
    const trendDuration = ((newTimestamp - oldTimestamp) / 1000 / 60).toFixed(0);

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
    {trendValueStr} / {trendDuration}m
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

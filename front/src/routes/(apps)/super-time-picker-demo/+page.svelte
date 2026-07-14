<script lang="ts">
    import { SuperDatePicker } from 'svelte-super-date-picker';
    import type { OnRefreshProps, OnTimeChangeProps } from 'svelte-super-date-picker';

    let isPaused = $state(true);
    let refreshInterval = $state(5000);
    let lastEvent = $state('');

    const handleTimeChange = (props: OnTimeChangeProps) => {
        lastEvent = `onTimeChange: ${JSON.stringify(props)}`;
        console.log('onTimeChange', props);
    };

    const handleRefresh = (props: OnRefreshProps) => {
        lastEvent = `onRefresh: ${JSON.stringify(props)}`;
        console.log('onRefresh', props);
    };

    const handleRefreshChange = (props: { isPaused: boolean; refreshInterval: number }) => {
        isPaused = props.isPaused;
        refreshInterval = props.refreshInterval;
        lastEvent = `onRefreshChange: ${JSON.stringify(props)}`;
        console.log('onRefreshChange', props);
    };
</script>

<svelte:head>
    <title>svelte-super-date-picker demo</title>
</svelte:head>

<h1>svelte-super-date-picker demo</h1>
<p>
    Standalone verification page for the svelte-super-date-picker package. Not linked from
    navigation.
</p>

<SuperDatePicker
    start="now-15m"
    end="now"
    {isPaused}
    {refreshInterval}
    onTimeChange={handleTimeChange}
    onRefresh={handleRefresh}
    onRefreshChange={handleRefreshChange}
/>

<pre>{lastEvent}</pre>

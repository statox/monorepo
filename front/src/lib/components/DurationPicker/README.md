# Duration Picker

Input component allowing to select a duration based on a time unit (seconds, minute, day, ...) and a value.

The value is computed in seconds.

Example usage:

```svelte
<DurationPicker
    bind:valueInSeconds={ttlSeconds}
    allowedUnits={['minutes', 'hours', 'days', 'months', 'years']} # Optional
    defaultDuration={{value: 1, unit: 'days'}} # Optional
/>

<span>Value in seconds: {tllSeconds}</span>
```

## Dependency

The component relies on Luxon's `Duration` features to do the conversion. TODO maybe get rid of the dependency?

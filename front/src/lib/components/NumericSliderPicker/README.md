# NumericSliderPicker

A versatile Svelte component for selecting numeric values with multiple input methods: slider, adjustment buttons, and direct text input. Perfect for any numeric input needs like weight, tempo, volume, temperature, etc.

## Features

- 🎚️ Optional interactive slider
- ➕➖ Configurable adjustment buttons
- ⌨️ Direct numeric input field
- ✅ Custom validation support
- 🎨 Configurable decimal precision
- 📊 Large display with optional unit
- 📱 Fully responsive design

## Props

| Prop                | Type                              | Required | Default | Description                                             |
| ------------------- | --------------------------------- | -------- | ------- | ------------------------------------------------------- |
| `value`             | `number`                          | No       | `0`     | The current value (bindable)                            |
| `min`               | `number`                          | Yes      | -       | Minimum allowed value                                   |
| `max`               | `number`                          | Yes      | -       | Maximum allowed value                                   |
| `step`              | `number`                          | No       | `1`     | Step increment for slider and keyboard input            |
| `unit`              | `string`                          | No       | `''`    | Unit label (e.g., "kg", "BPM", "°C")                    |
| `decimals`          | `number`                          | No       | `0`     | Number of decimal places to display                     |
| `adjustmentButtons` | `number[]`                        | No       | `[]`    | Array of adjustment values (e.g., `[-1, -0.1, 0.1, 1]`) |
| `showSlider`        | `boolean`                         | No       | `true`  | Whether to show the slider                              |
| `showDirectInput`   | `boolean`                         | No       | `true`  | Whether to show the direct input field                  |
| `validate`          | `(value: number) => NoticeItem[]` | No       | -       | Optional validation function                            |

## Usage Examples

### Weight Tracker

```svelte
<script lang="ts">
    import { NumericSliderPicker } from '$lib/components/NumericSliderPicker';
    import type { NoticeItem } from '$lib/components/Notice';

    let weight = $state(70);

    const validateWeight = (val: number): NoticeItem[] => {
        const errors: NoticeItem[] = [];

        if (val !== Number(val.toFixed(1))) {
            errors.push({
                level: 'error',
                header: 'Maximum 1 decimal place allowed'
            });
        }

        if (val < 40 || val > 200) {
            errors.push({
                level: 'error',
                header: 'Weight must be between 40 and 200 kg'
            });
        }

        return errors;
    };
</script>

<NumericSliderPicker
    bind:value={weight}
    min={40}
    max={200}
    step={0.1}
    unit="kg"
    decimals={1}
    adjustmentButtons={[-1, -0.1, 0.1, 1]}
    validate={validateWeight}
/>
```

### Metronome Tempo (No Slider)

```svelte
<script lang="ts">
    import { NumericSliderPicker } from '$lib/components/NumericSliderPicker';

    let tempo = $state(120);
</script>

<NumericSliderPicker
    bind:value={tempo}
    min={40}
    max={240}
    step={1}
    unit="BPM"
    decimals={0}
    adjustmentButtons={[-10, -1, 1, 10]}
    showSlider={false}
/>
```

### Temperature Control

```svelte
<script lang="ts">
    import { NumericSliderPicker } from '$lib/components/NumericSliderPicker';

    let temperature = $state(20);
</script>

<NumericSliderPicker
    bind:value={temperature}
    min={15}
    max={30}
    step={0.5}
    unit="°C"
    decimals={1}
    adjustmentButtons={[-1, -0.5, 0.5, 1]}
/>
```

## Validation

The `validate` prop accepts a function that receives the current value and returns an array of `NoticeItem` objects for any validation errors:

```typescript
interface NoticeItem {
    level: 'error' | 'warning' | 'info' | 'success';
    header: string;
    message?: string;
}
```

Example validation function:

```typescript
const validateValue = (val: number): NoticeItem[] => {
    const errors: NoticeItem[] = [];

    if (val < 0) {
        errors.push({
            level: 'error',
            header: 'Value must be positive'
        });
    }

    if (val > 100) {
        errors.push({
            level: 'warning',
            header: 'Value is very high',
            message: 'Consider using a lower value'
        });
    }

    return errors;
};
```

### Custom Styling

Override component styles:

```css
:global(.numeric-slider-picker) {
    /* Custom styles */
}
```

## Responsive Behavior

- **Desktop (>768px)**: Full-size display and controls
- **Tablet (≤768px)**: Compact layout
- **Mobile (≤480px)**: Stacked layout with 2-column button grid

## Component Composition

This component works well as a building block in form components. You can wrap it to add domain-specific behavior:

```svelte
<script lang="ts">
    import { NumericSliderPicker } from '$lib/components/NumericSliderPicker';

    // Export methods that parent components might need
    export const validate = () => {
        return validateWeight(value).length === 0;
    };

    export const getStorageValue = () => {
        return Math.floor(value * 100);
    };

    let { value = $bindable(100) }: Props = $props();

    const validateWeight = (val: number) => {
        // validation logic
    };
</script>

<NumericSliderPicker
    bind:value
    min={80}
    max={110}
    step={0.1}
    unit="kg"
    decimals={1}
    adjustmentButtons={[-1, -0.1, 0.1, 1]}
    validate={validateWeight}
/>
```

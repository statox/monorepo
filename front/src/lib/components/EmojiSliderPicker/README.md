# EmojiSliderPicker

A reusable Svelte component for selecting a numeric value from a range using an interactive slider and button grid. Each value is represented by an emoji and a label, making it ideal for tracking subjective metrics like mood, energy, pain levels, etc.

## Features

- 📊 Interactive range slider with visual gradient
- 🎯 Quick selection buttons with emoji display
- 🎨 Customizable color palette
- 📱 Responsive design for mobile and desktop
- ♿ Accessible with proper labels and titles

## Props

| Prop           | Type                  | Required | Default                     | Description                                            |
| -------------- | --------------------- | -------- | --------------------------- | ------------------------------------------------------ |
| `value`        | `number`              | No       | `5`                         | The currently selected value (bindable)                |
| `options`      | `EmojiSliderOption[]` | Yes      | -                           | Array of option objects defining each selectable value |
| `colorPalette` | `string[]`            | No       | Auto-generated red-to-green | Array of CSS color strings for the value scale         |

**Note:** The `min` and `max` values are automatically extracted from the `options` array.

### EmojiSliderOption Type

```typescript
interface EmojiSliderOption {
    value: number; // The numeric value (must be part of a continuous sequence)
    emoji: string; // Emoji to display for this value
    label: string; // Text label describing this value
}
```

## Validation Rules

The component validates the `options` prop and displays error messages for:

1. **Empty options**: At least one option must be provided
1. **Invalid colors**: If `colorPalette` is provided it must have the same number of items as `options`
1. **Non-continuous values**: Option values must form a continuous sequence (e.g., 1,2,3,4,5 is valid, but 1,2,4,5 is not)

## Color Palette Behavior

- If no `colorPalette` is provided, the component automatically generates a gradient from red (low values) to green (high values) based on the number of options
    - The color palette then adapts to any number of options (works with 5, 10, or any other number)
- If a `colorPalette` is provided, it uses the exact colors specified

## Usage Examples

### Basic Usage with auto generated color palette (Mood Tracker)

```svelte
<script lang="ts">
    import { EmojiSliderPicker, type EmojiSliderOption } from '$lib/components/EmojiSliderPicker';

    let moodValue = $state(5);

    const moodOptions: EmojiSliderOption[] = [
        { value: 1, emoji: '😢', label: 'Terrible' },
        { value: 2, emoji: '😟', label: 'Very Bad' },
        { value: 3, emoji: '😕', label: 'Bad' },
        { value: 4, emoji: '😐', label: 'Poor' },
        { value: 5, emoji: '🙂', label: 'Okay' },
        { value: 6, emoji: '😊', label: 'Good' },
        { value: 7, emoji: '😄', label: 'Great' },
        { value: 8, emoji: '😁', label: 'Very Good' },
        { value: 9, emoji: '🤩', label: 'Excellent' },
        { value: 10, emoji: '😍', label: 'Amazing' }
    ];
</script>

<EmojiSliderPicker bind:value={moodValue} options={moodOptions} />
```

### With Custom Color Palette (Energy Tracker)

```svelte
<script lang="ts">
    import { EmojiSliderPicker, type EmojiSliderOption } from '$lib/components/EmojiSliderPicker';

    let energyValue = $state(5);

    const energyOptions: EmojiSliderOption[] = [
        { value: 1, emoji: '😴', label: 'Exhausted' },
        { value: 2, emoji: '😪', label: 'Very Tired' },
        { value: 3, emoji: '🥱', label: 'Tired' },
        { value: 4, emoji: '😑', label: 'Drained' },
        { value: 5, emoji: '😐', label: 'Low' },
        { value: 6, emoji: '🙂', label: 'Moderate' },
        { value: 7, emoji: '😊', label: 'Good' },
        { value: 8, emoji: '😄', label: 'Energetic' },
        { value: 9, emoji: '⚡', label: 'Vibrant' },
        { value: 10, emoji: '🔋', label: 'Peak Energy' }
    ];

    // Custom color palette from purple to cyan
    const energyColors = [
        '#8e24aa', // 1 - Purple
        '#d32f2f', // 2 - Red
        '#f44336', // 3 - Light red
        '#ff5722', // 4 - Orange-red
        '#ff9800', // 5 - Orange
        '#ffc107', // 6 - Amber
        '#cddc39', // 7 - Lime
        '#8bc34a', // 8 - Light green
        '#4caf50', // 9 - Green
        '#00bcd4' // 10 - Cyan
    ];
</script>

<EmojiSliderPicker bind:value={energyValue} options={energyOptions} colorPalette={energyColors} />
```

## Styling

### Custom Styling

You can override styles by targeting the component's classes:

```css
:global(.emoji-slider-picker) {
    /* Custom styles */
}
```

## Responsive Behavior

The component automatically adjusts its layout for different screen sizes:

- **Desktop (>768px)**: Full-size emoji and buttons
- **Tablet (≤768px)**: Medium-size emoji, compact buttons
- **Mobile (≤480px)**: Small emoji, minimal spacing

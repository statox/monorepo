<script lang="ts">
    import { EmojiSliderPicker, type EmojiSliderOption } from '$lib/components/EmojiSliderPicker';

    interface Props {
        value?: number;
    }

    let { value = $bindable(5) }: Props = $props();

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

<EmojiSliderPicker bind:value options={energyOptions} colorPalette={energyColors} />

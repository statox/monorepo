<script lang="ts">
    import { EmojiSliderPicker, type EmojiSliderOption } from '$lib/components/EmojiSliderPicker';

    interface Props {
        value?: number;
    }

    let { value = $bindable(5) }: Props = $props();

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

<EmojiSliderPicker bind:value options={moodOptions} />

<script lang="ts">
    import { NumericSliderPicker } from '$lib/components/NumericSliderPicker';
    import type { NoticeItem } from '$lib/components/Notice';

    interface Props {
        value?: number;
    }

    let { value = $bindable(100) }: Props = $props();

    const validateWeight = (val: number): NoticeItem[] => {
        const errors: NoticeItem[] = [];

        if (val !== Number(val.toFixed(1))) {
            errors.push({
                level: 'error',
                header: 'Value have at most 1 number after the comma'
            });
        }

        if (val < 80 || val > 110) {
            errors.push({ level: 'error', header: 'Value must be in kg' });
        }

        return errors;
    };

    export const validate = (): boolean => {
        return validateWeight(value).length === 0;
    };

    export const getStorageValue = (): number => {
        return Math.floor(value * 100);
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

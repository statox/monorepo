<script lang="ts">
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    interface Props {
        value?: number;
    }

    let { value = $bindable(100) }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    export const validate = (): boolean => {
        noticeMessages = [];
        if (value !== Number(value.toFixed(1))) {
            noticeMessages.push({
                level: 'error',
                header: 'Value have at most 1 number after the comma'
            });
        }
        if (value < 80 || value > 110) {
            noticeMessages.push({ level: 'error', header: 'Value must be in kg' });
        }

        return noticeMessages.length === 0;
    };

    export const getStorageValue = (): number => {
        return Math.floor(value * 100);
    };
</script>

<div>
    <h4>Weight</h4>

    {#each noticeMessages as item}
        <Notice {item} />
    {/each}

    <div class="input-container">
        <button onclick={() => (value = Number((value - 0.1).toFixed(2)))}>-</button>
        <input type="number" step="0.1" bind:value />
        <button onclick={() => (value = Number((value + 0.1).toFixed(2)))}>+</button>
    </div>
</div>

<style>
    .input-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        gap: 10px;

        margin: 1em;

        button {
            font-weight: bolder;
        }

        input {
            /* Disable built-in arrows Firefox */
            -moz-appearance: textfield;
            appearance: textfield;

            font-size: larger;
        }

        /* Disable built-in arrows Chrome, Safari, Edge */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
            display: none;
            -webkit-appearance: none;
            margin: 0;
        }
    }
</style>

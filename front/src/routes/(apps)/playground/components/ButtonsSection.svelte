<script lang="ts">
    import { toast } from '$lib/components/Toast';
    import ButtonCopy from '$lib/components/ButtonCopy/Main.svelte';
    import ButtonDelete from '$lib/components/ButtonDelete/Main.svelte';
    import ButtonSwitch from '$lib/components/ButtonSwitch/Main.svelte';

    let switchValue = $state<'on' | 'off'>('on');
    let sliderValue = $state<'on' | 'off'>('off');
    let multiValue = $state<'on' | 'off'>('off');
</script>

<section>
    <h2>Button Components</h2>
    <div class="button-examples">
        <div class="component-demo">
            <h3>ButtonCopy</h3>
            <ButtonCopy content="Text to copy to clipboard" />
        </div>

        <div class="component-demo">
            <h3>ButtonDelete</h3>
            <ButtonDelete
                deleteAction={() => {
                    toast.push('Confirmed deletion');
                }}
            />
        </div>

        <div class="component-demo">
            <h3>ButtonSwitch - Inner Design</h3>
            <ButtonSwitch bind:value={switchValue} label="Enable feature" design="inner" />
            <p>Current value: {switchValue}</p>
        </div>

        <div class="component-demo">
            <h3>ButtonSwitch - Slider Design</h3>
            <ButtonSwitch bind:value={sliderValue} label="Toggle setting" design="slider" />
            <p>Current value: {sliderValue}</p>
        </div>

        <div class="component-demo">
            <h3>ButtonSwitch - Multi Design</h3>
            <ButtonSwitch
                bind:value={multiValue}
                label="Theme"
                design="multi"
                options={['light', 'dark']}
            />
            <p>Current value: {multiValue}</p>
        </div>
    </div>
</section>

<style>
    section {
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    .button-examples {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .component-demo {
        background-color: var(--nc-bg-2);
        padding: 1.5rem;
        border-radius: 4px;
    }

    .component-demo p {
        margin-top: 0.5rem;
        color: var(--nc-tx-3);
        font-size: 0.9rem;
    }
</style>

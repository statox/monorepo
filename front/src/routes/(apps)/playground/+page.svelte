<script lang="ts">
    import { pageMetadataStore } from '$lib/components/Header';
    import { SvelteToast } from '$lib/components/Toast';

    import ColorsSection from './components/ColorsSection.svelte';
    import BackgroundColorsSection from './components/BackgroundColorsSection.svelte';
    import TypographySection from './components/TypographySection.svelte';
    import ButtonsSection from './components/ButtonsSection.svelte';
    import ComponentsSection from './components/ComponentsSection.svelte';
    import SemanticStatesSection from './components/SemanticStatesSection.svelte';
    import ToastsSection from './components/ToastsSection.svelte';
    import EmojiSliderPickerDemo from './components/EmojiSliderPickerDemo.svelte';
    import NumericSliderPickerDemo from './components/NumericSliderPickerDemo.svelte';
    import FormLayoutDemo from './components/FormLayoutDemo.svelte';

    pageMetadataStore.set({ name: 'Theme Playground' });
</script>

<SvelteToast />

<div class="playground">
    <h1>Theme Playground</h1>
    <p class="intro">
        This page showcases all theme colors and common components. Use it to verify CSS changes
        across the application.
    </p>

    <ColorsSection />
    <BackgroundColorsSection />
    <TypographySection />
    <ButtonsSection />
    <ComponentsSection />
    <SemanticStatesSection />
    <ToastsSection />

    <section class="demo-section">
        <h2>Custom Picker Components</h2>
        <EmojiSliderPickerDemo />
        <NumericSliderPickerDemo />
    </section>

    <section class="demo-section">
        <h2>Form Layout Components</h2>
        <FormLayoutDemo />
    </section>
</div>

<style>
    .playground {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    h1 {
        color: var(--nc-tx-1);
        margin-bottom: 1rem;
    }

    .intro {
        color: var(--nc-tx-2);
        margin-bottom: 2rem;
    }

    .demo-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 2px solid var(--nc-bg-3);
    }

    .demo-section h2 {
        color: var(--nc-tx-1);
        margin-bottom: 2rem;
    }
</style>

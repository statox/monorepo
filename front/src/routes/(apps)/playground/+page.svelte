<script lang="ts">
    import { pageMetadataStore } from '$lib/components/Header';
    import { SvelteToast } from '$lib/components/Toast';

    import ColorsSection from './components/ColorsSection.svelte';
    import BackgroundColorsSection from './components/BackgroundColorsSection.svelte';
    import TypographySection from './components/TypographySection.svelte';
    import FormElementsSection from './components/FormElementsSection.svelte';
    import ButtonsSection from './components/ButtonsSection.svelte';
    import ComponentsSection from './components/ComponentsSection.svelte';
    import SemanticStatesSection from './components/SemanticStatesSection.svelte';
    import ToastsSection from './components/ToastsSection.svelte';

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
    <FormElementsSection />
    <ButtonsSection />
    <ComponentsSection />
    <SemanticStatesSection />
    <ToastsSection />
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
</style>

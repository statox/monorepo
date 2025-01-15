<script lang="ts">
    import type { Snippet } from 'svelte';
    import {
        modals,
        closeModals,
        exitBeforeEnter,
        transitioning,
        type SvelteModalComponent,
        type LazySvelteModalComponent
    } from './store';

    interface Props {
        backdrop?: Snippet;
        children?: Snippet;
        loading?: Snippet;
    }

    let { backdrop, children, loading }: Props = $props();

    function isLazyModal(
        component: SvelteModalComponent<any> | LazySvelteModalComponent<any>
    ): component is LazySvelteModalComponent<any> {
        return typeof component.prototype === 'undefined';
    }

    async function getComponent(component: LazySvelteModalComponent<any>) {
        return component().then((res) => res.default);
    }

    const allowedKeys = ['Escape'];
    let keyReleased = true;
    const onKeyDown = (e: KeyboardEvent) => {
        if (!allowedKeys.includes(e.key)) {
            return;
        }
        if (!keyReleased) {
            return;
        }
        keyReleased = false;
        if (closeModals()) {
            e.preventDefault();
        }
    };

    const onKeyUp = (e: KeyboardEvent) => {
        if (!keyReleased && allowedKeys.includes(e.key)) {
            keyReleased = true;
            e.preventDefault();
        }
    };
</script>

{#if $modals.length > 0}
    {@render backdrop?.()}
{/if}

{#if children}
    {@render children()}
{:else}
    {#each $modals as modal, i (i)}
        <!-- lazy modal -->
        {#if isLazyModal(modal.component)}
            {#await getComponent(modal.component)}
                {@render loading?.()}
            {:then component}
                {@const SvelteComponent = component}
                <SvelteComponent
                    isOpen={i === $modals.length - 1 && !$transitioning}
                    {...modal.props}
                    on:introstart={() => {
                        $exitBeforeEnter = true;
                    }}
                    on:outroend={() => {
                        $transitioning = false;
                    }}
                />
            {/await}
        {:else}
            <!-- normal modal -->
            <modal.component
                isOpen={i === $modals.length - 1 && !$transitioning}
                {...modal.props}
                on:introstart={() => {
                    $exitBeforeEnter = true;
                }}
                on:outroend={() => {
                    $transitioning = false;
                }}
            />
        {/if}
    {/each}
{/if}

<svelte:window onkeydown={onKeyDown} onkeyup={onKeyUp} />

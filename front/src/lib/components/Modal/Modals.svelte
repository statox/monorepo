<script lang="ts">
    import {
        modals,
        closeModals,
        exitBeforeEnter,
        transitioning,
        type SvelteModalComponent,
        type LazySvelteModalComponent
    } from './store';

    function isLazyModal(component: SvelteModalComponent<any> | LazySvelteModalComponent<any>) {
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
    <slot name="backdrop" />
{/if}

<slot>
    {#each $modals as modal, i (i)}
        <!-- lazy modal -->
        {#if isLazyModal(modal.component)}
            {#await getComponent(modal.component)}
                <slot name="loading" />
            {:then component}
                <svelte:component
                    this={component}
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
            <svelte:component
                this={modal.component}
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
</slot>

<svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} />
